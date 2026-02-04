// AI Provider Types
export type AIProviderType = 'groq' | 'openrouter';

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model?: string;
}

// Agent Personality Types
export type PersonalityType =
  | 'materialist'
  | 'idealist'
  | 'pragmatic'
  | 'theoretical'
  | 'empiricist'
  | 'skeptic'
  | 'optimist'
  | 'pessimist'
  | 'analytical'
  | 'intuitive'
  | 'chaotic'
  | 'psychopath';

export interface PersonalityInfo {
  value: PersonalityType;
  label: string;
  description: string;
}

export const PERSONALITIES: PersonalityInfo[] = [
  { value: 'materialist', label: 'Materialist', description: 'Focuses on physical reality, rejects supernatural explanations, emphasizes material conditions' },
  { value: 'idealist', label: 'Idealist', description: 'Prioritizes ideas, consciousness, and mental constructs over physical reality' },
  { value: 'pragmatic', label: 'Pragmatic', description: 'Values practical consequences and real-world applications over abstract theory' },
  { value: 'theoretical', label: 'Theoretical', description: 'Prefers abstract reasoning, complex concepts, and systematic frameworks' },
  { value: 'empiricist', label: 'Empiricist', description: 'Relies on observable evidence, experiments, and sensory experience' },
  { value: 'skeptic', label: 'Skeptic', description: 'Questions assumptions, demands rigorous proof, challenges conventional wisdom' },
  { value: 'optimist', label: 'Optimist', description: 'Sees positive potential, emphasizes hope and progress, focuses on solutions' },
  { value: 'pessimist', label: 'Pessimist', description: 'Highlights risks and problems, considers worst-case scenarios, cautious outlook' },
  { value: 'analytical', label: 'Analytical', description: 'Breaks down arguments systematically, uses formal logic and structured reasoning' },
  { value: 'intuitive', label: 'Intuitive', description: 'Relies on gut feelings, pattern recognition, and holistic understanding' },
  { value: 'chaotic', label: 'Chaotic', description: 'Unpredictable reasoning, jumps between topics, non-linear arguments, embraces contradiction' },
  { value: 'psychopath', label: 'Psychopath', description: 'Emotionless logic, no moral or empathy-based appeals, cold rational analysis only' },
];

// Response Length Types
export type ResponseLength = 'short' | 'medium' | 'long';

export interface ResponseLengthInfo {
  value: ResponseLength;
  label: string;
  wordRange: string;
  wordCount: { min: number; max: number };
}

export const RESPONSE_LENGTHS: ResponseLengthInfo[] = [
  { value: 'short', label: 'Short', wordRange: '20-50 words', wordCount: { min: 20, max: 50 } },
  { value: 'medium', label: 'Medium', wordRange: '50-100 words', wordCount: { min: 50, max: 100 } },
  { value: 'long', label: 'Long', wordRange: '100-200 words', wordCount: { min: 100, max: 200 } },
];

// Agent Configuration

export interface AgentConfig {
  standpoint: string;
  personality: PersonalityType;
  responseLength: ResponseLength;
}

// Debate Types
export interface Standpoint {
  agentIndex: 0 | 1;
  position: string;
}

export interface DebateConfig {
  standpoints: [string, string];
  timeLimitMinutes: number;
  agentConfigs: [AgentConfig, AgentConfig];
  responseDelaySeconds: number;
  stepByStepMode: boolean;
  maxTurns?: number;
  temperature: number;
  autoPauseEveryNTurns?: number;
}

export type DebateStatus = 'pending' | 'running' | 'paused' | 'completed' | 'waiting-for-next';
export type DebateEndReason = 'timeout' | 'manual' | 'max-turns' | null;

export interface Debate {
  id: string;
  standpoints: [string, string];
  timeLimitMinutes: number;
  agentConfigs: [AgentConfig, AgentConfig];
  responseDelaySeconds: number;
  stepByStepMode: boolean;
  maxTurns?: number;
  temperature: number;
  autoPauseEveryNTurns?: number;
  status: DebateStatus;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  endReason: DebateEndReason;
  currentTurnCount?: number;
}

export interface Message {
  id: string;
  debateId: string;
  agentIndex: 0 | 1;
  content: string;
  timestamp: Date;
  isEdited: boolean;
}

// SSE Event Types
export type SSEEventType =
  | 'token'
  | 'turn-end'
  | 'paused'
  | 'resumed'
  | 'debate-end'
  | 'waiting-for-next'
  | 'error';

export interface SSETokenEvent {
  type: 'token';
  agentIndex: 0 | 1;
  content: string;
}

export interface SSETurnEndEvent {
  type: 'turn-end';
  agentIndex: 0 | 1;
  messageId: string;
}

export interface SSEPausedEvent {
  type: 'paused';
}

export interface SSEResumedEvent {
  type: 'resumed';
}

export interface SSEWaitingForNextEvent {
  type: 'waiting-for-next';
  nextAgentIndex: 0 | 1;
}

export interface SSEDebateEndEvent {
  type: 'debate-end';
  reason: DebateEndReason;
}

export interface SSEErrorEvent {
  type: 'error';
  message: string;
}

export type SSEEvent =
  | SSETokenEvent
  | SSETurnEndEvent
  | SSEPausedEvent
  | SSEResumedEvent
  | SSEWaitingForNextEvent
  | SSEDebateEndEvent
  | SSEErrorEvent;

// API Request/Response Types
export interface CreateDebateRequest {
  standpoints: [string, string];
  timeLimitMinutes: number;
  agentConfigs: [AgentConfig, AgentConfig];
  responseDelaySeconds: number;
  stepByStepMode: boolean;
  maxTurns?: number;
  temperature: number;
  autoPauseEveryNTurns?: number;
}

export interface CreateDebateResponse {
  debate: Debate;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface DebateListResponse {
  debates: Debate[];
}

export interface DebateDetailResponse {
  debate: Debate;
  messages: Message[];
}
