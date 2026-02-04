import { Response } from 'express';
import { Debate, Message, SSEEvent } from '@philosopher/shared';
import { AIProviderFactory, AIContext } from './ai/index.js';
import { debateRepository, messageRepository } from '../db/index.js';

// Store active debate states
interface DebateState {
  isPaused: boolean;
  shouldStop: boolean;
  currentAgentIndex: 0 | 1;
  startTime: number;
  turnCount: number;
  waitingForNext: boolean;
}

const activeDebates = new Map<string, DebateState>();

export class DebateService {
  private sendSSE(res: Response, event: SSEEvent): void {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  async startDebate(debateId: string, res: Response): Promise<void> {
    const debate = await debateRepository.findById(debateId);
    if (!debate) {
      this.sendSSE(res, { type: 'error', message: 'Debate not found' });
      return;
    }

    console.log(`Starting debate ${debateId}`);

    // Initialize debate state
    const state: DebateState = {
      isPaused: false,
      shouldStop: false,
      currentAgentIndex: 0,
      startTime: Date.now(),
      turnCount: 0,
      waitingForNext: false,
    };
    activeDebates.set(debateId, state);

    await debateRepository.updateStatus(debateId, 'running');

    try {
      await this.runDebateLoop(debate, state, res);
    } catch (error) {
      console.error(`Error in debate ${debateId}:`, error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.sendSSE(res, { type: 'error', message });
    } finally {
      activeDebates.delete(debateId);
    }
  }

  private async runDebateLoop(
    debate: Debate,
    state: DebateState,
    res: Response
  ): Promise<void> {
    console.log(`Running debate loop for ${debate.id}`);
    const provider = AIProviderFactory.getProvider();
    console.log(`Using AI provider: ${provider.name}`);

    const timeLimitMs = debate.timeLimitMinutes * 60 * 1000;
    const typingDelayMs = Math.floor((debate.responseDelaySeconds * 1000) / 20);

    let prompt = `Your opponent holds the position: "${debate.standpoints[1]}". Begin the debate by presenting your main argument for your position: "${debate.standpoints[0]}"`;

    while (!state.shouldStop) {
      // Check max turns
      if (debate.maxTurns && state.turnCount >= debate.maxTurns) {
        await debateRepository.endDebate(debate.id, 'max-turns');
        this.sendSSE(res, { type: 'debate-end', reason: 'max-turns' });
        return;
      }

      // Check timeout
      if (Date.now() - state.startTime > timeLimitMs) {
        await debateRepository.endDebate(debate.id, 'timeout');
        this.sendSSE(res, { type: 'debate-end', reason: 'timeout' });
        return;
      }

      // Wait while paused
      while (state.isPaused && !state.shouldStop) {
        await this.sleep(100);
      }

      // Step-by-step mode: wait for manual trigger
      if (debate.stepByStepMode && state.turnCount > 0) {
        state.waitingForNext = true;
        await debateRepository.updateStatus(debate.id, 'waiting-for-next');
        this.sendSSE(res, {
          type: 'waiting-for-next',
          nextAgentIndex: state.currentAgentIndex
        });

        while (state.waitingForNext && !state.shouldStop) {
          await this.sleep(100);
        }

        if (state.shouldStop) break;
      }

      // Auto-pause every N turns
      if (
        !debate.stepByStepMode &&
        debate.autoPauseEveryNTurns &&
        state.turnCount > 0 &&
        state.turnCount % debate.autoPauseEveryNTurns === 0
      ) {
        state.isPaused = true;
        await debateRepository.updateStatus(debate.id, 'paused');
        this.sendSSE(res, { type: 'paused' });

        while (state.isPaused && !state.shouldStop) {
          await this.sleep(100);
        }

        if (state.shouldStop) break;
      }

      if (state.shouldStop) break;

      // Get conversation history
      const messages = await messageRepository.findByDebateId(debate.id);

      // Build context for current agent
      const agentIndex = state.currentAgentIndex;
      console.log(`Generating response for agent ${agentIndex} (turn ${state.turnCount + 1})`);

      const context: AIContext = {
        standpoint: debate.standpoints[agentIndex],
        opponentStandpoint: debate.standpoints[agentIndex === 0 ? 1 : 0],
        messages: this.transformMessagesForAgent(messages, agentIndex),
        agentConfig: debate.agentConfigs[agentIndex],
        temperature: debate.temperature,
      };

      // Generate response with typing simulation
      let fullResponse = '';
      try {
        for await (const token of provider.streamResponse(prompt, context)) {
          if (state.shouldStop) break;

          fullResponse += token;
          this.sendSSE(res, { type: 'token', agentIndex, content: token });

          if (typingDelayMs > 0) {
            await this.sleep(typingDelayMs);
          }
        }
      } catch (error) {
        console.error(`Error generating response:`, error);
        throw error;
      }

      if (state.shouldStop) break;

      console.log(`Generated response (${fullResponse.length} chars)`);

      // Save message
      const savedMessage = await messageRepository.create({
        debateId: debate.id,
        agentIndex,
        content: fullResponse,
      });

      this.sendSSE(res, {
        type: 'turn-end',
        agentIndex,
        messageId: savedMessage.id
      });

      // Increment turn count
      state.turnCount++;
      await debateRepository.updateTurnCount(debate.id, state.turnCount);

      // Switch to other agent
      state.currentAgentIndex = agentIndex === 0 ? 1 : 0;
      prompt = 'Respond to your opponent\'s argument.';
    }

    // Manual stop
    await debateRepository.endDebate(debate.id, 'manual');
    this.sendSSE(res, { type: 'debate-end', reason: 'manual' });
  }

  private transformMessagesForAgent(messages: Message[], agentIndex: 0 | 1): Message[] {
    return messages.map(msg => ({
      ...msg,
    }));
  }

  pauseDebate(debateId: string): boolean {
    const state = activeDebates.get(debateId);
    if (state) {
      state.isPaused = true;
      return true;
    }
    return false;
  }

  resumeDebate(debateId: string): boolean {
    const state = activeDebates.get(debateId);
    if (state && state.isPaused) {
      state.isPaused = false;
      return true;
    }
    return false;
  }

  stopDebate(debateId: string): boolean {
    const state = activeDebates.get(debateId);
    if (state) {
      state.shouldStop = true;
      state.isPaused = false;
      state.waitingForNext = false;
      return true;
    }
    return false;
  }

  triggerNextTurn(debateId: string): boolean {
    const state = activeDebates.get(debateId);
    if (state && state.waitingForNext) {
      state.waitingForNext = false;
      return true;
    }
    return false;
  }

  isDebateActive(debateId: string): boolean {
    return activeDebates.has(debateId);
  }

  getDebateState(debateId: string): DebateState | undefined {
    return activeDebates.get(debateId);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const debateService = new DebateService();
