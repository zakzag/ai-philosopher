import { Message } from '@philosopher/shared';
import { getDb } from '../connection.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateMessageInput {
  debateId: string;
  agentIndex: 0 | 1;
  content: string;
}

export class MessageRepository {
  private get collection() {
    return getDb().collection<Message>('messages');
  }

  async create(input: CreateMessageInput): Promise<Message> {
    const message: Message = {
      id: uuidv4(),
      debateId: input.debateId,
      agentIndex: input.agentIndex,
      content: input.content,
      timestamp: new Date(),
      isEdited: false,
    };

    await this.collection.insertOne(message);
    return message;
  }

  async findByDebateId(debateId: string): Promise<Message[]> {
    return this.collection
      .find({ debateId })
      .sort({ timestamp: 1 })
      .toArray();
  }

  async findById(id: string): Promise<Message | null> {
    return this.collection.findOne({ id });
  }

  async updateContent(id: string, content: string): Promise<void> {
    await this.collection.updateOne(
      { id },
      { $set: { content, isEdited: true } }
    );
  }

  async deleteAfterMessage(debateId: string, messageId: string): Promise<number> {
    const message = await this.findById(messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    const result = await this.collection.deleteMany({
      debateId,
      timestamp: { $gt: message.timestamp },
    });

    return result.deletedCount;
  }

  async deleteByDebateId(debateId: string): Promise<void> {
    await this.collection.deleteMany({ debateId });
  }

  async getLastMessage(debateId: string): Promise<Message | null> {
    const messages = await this.collection
      .find({ debateId })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    return messages[0] || null;
  }

  async countByDebateId(debateId: string): Promise<number> {
    return this.collection.countDocuments({ debateId });
  }
}

export const messageRepository = new MessageRepository();
