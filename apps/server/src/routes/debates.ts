import { Router, Request, Response } from 'express';
import {
  CreateDebateRequest,
  CreateDebateResponse,
  DebateListResponse,
  DebateDetailResponse,
  UpdateMessageRequest
} from '@philosopher/shared';
import { debateRepository, messageRepository } from '../db/index.js';
import { debateService } from '../services/DebateService.js';

const router = Router();

// Create a new debate
router.post('/', async (req: Request<{}, {}, CreateDebateRequest>, res: Response<CreateDebateResponse>) => {
  try {
    const {
      standpoints,
      timeLimitMinutes,
      agentConfigs,
      responseDelaySeconds,
      stepByStepMode,
      maxTurns,
      temperature,
      autoPauseEveryNTurns,
    } = req.body;

    if (!standpoints || standpoints.length !== 2) {
      return res.status(400).json({ debate: null as any });
    }

    if (!agentConfigs || agentConfigs.length !== 2) {
      return res.status(400).json({ debate: null as any });
    }

    const debate = await debateRepository.create({
      standpoints,
      timeLimitMinutes: timeLimitMinutes || 5,
      agentConfigs,
      responseDelaySeconds: responseDelaySeconds ?? 5,
      stepByStepMode: stepByStepMode ?? false,
      maxTurns,
      temperature: temperature ?? 0.7,
      autoPauseEveryNTurns: stepByStepMode ? undefined : autoPauseEveryNTurns,
    });

    res.status(201).json({ debate });
  } catch (error) {
    console.error('Error creating debate:', error);
    res.status(500).json({ debate: null as any });
  }
});

// List all debates
router.get('/', async (_req: Request, res: Response<DebateListResponse>) => {
  try {
    const debates = await debateRepository.findAll();
    res.json({ debates });
  } catch (error) {
    console.error('Error listing debates:', error);
    res.status(500).json({ debates: [] });
  }
});

// Get debate details with messages
router.get('/:id', async (req: Request, res: Response<DebateDetailResponse>) => {
  try {
    const debate = await debateRepository.findById(req.params.id);
    if (!debate) {
      return res.status(404).json({ debate: null as any, messages: [] });
    }

    const messages = await messageRepository.findByDebateId(debate.id);
    res.json({ debate, messages });
  } catch (error) {
    console.error('Error getting debate:', error);
    res.status(500).json({ debate: null as any, messages: [] });
  }
});

// Stream debate (SSE endpoint)
router.get('/:id/stream', async (req: Request, res: Response) => {
  const debateId = req.params.id;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Handle client disconnect
  req.on('close', () => {
    debateService.stopDebate(debateId);
  });

  // Start the debate
  await debateService.startDebate(debateId, res);

  res.end();
});

// Pause debate
router.post('/:id/pause', async (req: Request, res: Response) => {
  const success = debateService.pauseDebate(req.params.id);

  if (success) {
    await debateRepository.updateStatus(req.params.id, 'paused');
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Debate not active or already paused' });
  }
});

// Resume debate
router.post('/:id/resume', async (req: Request, res: Response) => {
  const success = debateService.resumeDebate(req.params.id);

  if (success) {
    await debateRepository.updateStatus(req.params.id, 'running');
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Debate not active or not paused' });
  }
});

// Stop debate
router.post('/:id/stop', async (req: Request, res: Response) => {
  const success = debateService.stopDebate(req.params.id);
  res.json({ success });
});

// Trigger next turn (for step-by-step mode)
router.post('/:id/next-turn', async (req: Request, res: Response) => {
  const success = debateService.triggerNextTurn(req.params.id);

  if (success) {
    await debateRepository.updateStatus(req.params.id, 'running');
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Debate not waiting for next turn' });
  }
});


// Update message content (for editing before continuing)
router.put('/:id/messages/:messageId', async (req: Request<{ id: string; messageId: string }, {}, UpdateMessageRequest>, res: Response) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content required' });
    }

    const message = await messageRepository.findById(req.params.messageId);
    if (!message || message.debateId !== req.params.id) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    await messageRepository.updateContent(req.params.messageId, content);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ success: false, error: 'Failed to update message' });
  }
});

// Undo: delete all messages after a specific message
router.delete('/:id/messages/after/:messageId', async (req: Request, res: Response) => {
  try {
    const { id: debateId, messageId } = req.params;

    // Verify debate exists
    const debate = await debateRepository.findById(debateId);
    if (!debate) {
      return res.status(404).json({ success: false, error: 'Debate not found' });
    }

    // Delete messages after the specified one
    const deletedCount = await messageRepository.deleteAfterMessage(debateId, messageId);

    // Update debate status to paused so user can continue from this point
    if (debate.status === 'completed') {
      await debateRepository.updateStatus(debateId, 'paused');
    }

    res.json({ success: true, deletedCount });
  } catch (error) {
    console.error('Error undoing messages:', error);
    res.status(500).json({ success: false, error: 'Failed to undo' });
  }
});

// Delete a debate and its messages
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const debateId = req.params.id;

    // Stop if active
    debateService.stopDebate(debateId);

    // Delete messages first
    await messageRepository.deleteByDebateId(debateId);

    // Delete debate
    await debateRepository.delete(debateId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting debate:', error);
    res.status(500).json({ success: false, error: 'Failed to delete debate' });
  }
});

export default router;
