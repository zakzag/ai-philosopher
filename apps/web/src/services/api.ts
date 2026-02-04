import {
  Debate,
  Message,
  CreateDebateRequest,
  CreateDebateResponse,
  DebateListResponse,
  DebateDetailResponse
} from '@philosopher/shared';

const API_BASE = '/api';

export const api = {
  // Create a new debate
  async createDebate(data: CreateDebateRequest): Promise<Debate> {
    const response = await fetch(`${API_BASE}/debates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result: CreateDebateResponse = await response.json();
    return result.debate;
  },

  // Get all debates
  async getDebates(): Promise<Debate[]> {
    const response = await fetch(`${API_BASE}/debates`);
    const result: DebateListResponse = await response.json();
    return result.debates;
  },

  // Get debate with messages
  async getDebate(id: string): Promise<{ debate: Debate; messages: Message[] }> {
    const response = await fetch(`${API_BASE}/debates/${id}`);
    const result: DebateDetailResponse = await response.json();
    return result;
  },

  // Pause debate
  async pauseDebate(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/debates/${id}/pause`, {
      method: 'POST',
    });
    const result = await response.json();
    return result.success;
  },

  // Resume debate
  async resumeDebate(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/debates/${id}/resume`, {
      method: 'POST',
    });
    const result = await response.json();
    return result.success;
  },

  // Stop debate
  async stopDebate(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/debates/${id}/stop`, {
      method: 'POST',
    });
    const result = await response.json();
    return result.success;
  },

  // Trigger next turn (step-by-step mode)
  async triggerNextTurn(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/debates/${id}/next-turn`, {
      method: 'POST',
    });
    const result = await response.json();
    return result.success;
  },

  // Update message content
  async updateMessage(debateId: string, messageId: string, content: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/debates/${debateId}/messages/${messageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const result = await response.json();
    return result.success;
  },

  // Undo to a specific message
  async undoToMessage(debateId: string, messageId: string): Promise<number> {
    const response = await fetch(`${API_BASE}/debates/${debateId}/messages/after/${messageId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return result.deletedCount;
  },

  // Delete debate
  async deleteDebate(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/debates/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return result.success;
  },

  // Get SSE stream URL
  getStreamUrl(debateId: string): string {
    return `${API_BASE}/debates/${debateId}/stream`;
  },
};
