import { Debate, DebateStatus, DebateEndReason, AgentConfig } from '@philosopher/shared';
import { getDb } from '../connection.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateDebateInput {
  standpoints: [string, string];
  timeLimitMinutes: number;
  agentConfigs: [AgentConfig, AgentConfig];
  responseDelaySeconds: number;
  stepByStepMode: boolean;
  maxTurns?: number;
  temperature: number;
  autoPauseEveryNTurns?: number;
}

export class DebateRepository {
  private get collection() {
    return getDb().collection<Debate>('debates');
  }

  async create(input: CreateDebateInput): Promise<Debate> {
    const debate: Debate = {
      id: uuidv4(),
      standpoints: input.standpoints,
      timeLimitMinutes: input.timeLimitMinutes,
      agentConfigs: input.agentConfigs,
      responseDelaySeconds: input.responseDelaySeconds,
      stepByStepMode: input.stepByStepMode,
      maxTurns: input.maxTurns,
      temperature: input.temperature,
      autoPauseEveryNTurns: input.autoPauseEveryNTurns,
      status: 'pending',
      createdAt: new Date(),
      endReason: null,
      currentTurnCount: 0,
    };

    await this.collection.insertOne(debate);
    return debate;
  }

  async findById(id: string): Promise<Debate | null> {
    return this.collection.findOne({ id });
  }

  async findAll(): Promise<Debate[]> {
    return this.collection.find().sort({ createdAt: -1 }).toArray();
  }

  async updateStatus(id: string, status: DebateStatus): Promise<void> {
    const update: Partial<Debate> = { status };

    if (status === 'running') {
      update.startedAt = new Date();
    }

    await this.collection.updateOne({ id }, { $set: update });
  }

  async updateTurnCount(id: string, turnCount: number): Promise<void> {
    await this.collection.updateOne({ id }, { $set: { currentTurnCount: turnCount } });
  }

  async endDebate(id: string, reason: DebateEndReason): Promise<void> {
    await this.collection.updateOne(
      { id },
      {
        $set: {
          status: 'completed' as DebateStatus,
          endedAt: new Date(),
          endReason: reason,
        },
      }
    );
  }

  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ id });
  }
}

export const debateRepository = new DebateRepository();
