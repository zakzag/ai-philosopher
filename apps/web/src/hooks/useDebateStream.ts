import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, SSEEvent } from '@philosopher/shared';
import { api } from '../services/api';

interface UseDebateStreamOptions {
  debateId: string;
  onToken?: (agentIndex: 0 | 1, content: string) => void;
  onTurnEnd?: (agentIndex: 0 | 1, messageId: string) => void;
  onDebateEnd?: (reason: string) => void;
  onError?: (message: string) => void;
}

interface UseDebateStreamReturn {
  messages: Message[];
  currentMessage: { agentIndex: 0 | 1; content: string } | null;
  isRunning: boolean;
  isPaused: boolean;
  isEnded: boolean;
  isWaitingForNext: boolean;
  nextAgentIndex: 0 | 1 | null;
  endReason: string | null;
  start: () => void;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  triggerNextTurn: () => Promise<void>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  undoToMessage: (messageId: string) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function useDebateStream({
  debateId,
  onToken,
  onTurnEnd,
  onDebateEnd,
  onError,
}: UseDebateStreamOptions): UseDebateStreamReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<{ agentIndex: 0 | 1; content: string } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [nextAgentIndex, setNextAgentIndex] = useState<0 | 1 | null>(null);
  const [endReason, setEndReason] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const accumulatedContentRef = useRef<string>('');

  const start = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = api.getStreamUrl(debateId);
    console.log('Starting SSE connection to:', url);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    setIsRunning(true);
    setIsEnded(false);
    setEndReason(null);
    accumulatedContentRef.current = '';

    eventSource.onopen = () => {
      console.log('SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      console.log('SSE message received:', event.data);
      try {
        const data: SSEEvent = JSON.parse(event.data);

        switch (data.type) {
          case 'token':
            accumulatedContentRef.current += data.content;
            setCurrentMessage((prev) => ({
              agentIndex: data.agentIndex,
              content: (prev?.agentIndex === data.agentIndex ? prev.content : '') + data.content,
            }));
            onToken?.(data.agentIndex, data.content);
            break;

          case 'turn-end':
            // Add completed message with accumulated content
            const fullContent = accumulatedContentRef.current;
            accumulatedContentRef.current = ''; // Reset for next message

            setMessages((prev) => [
              ...prev,
              {
                id: data.messageId,
                debateId,
                agentIndex: data.agentIndex,
                content: fullContent,
                timestamp: new Date(),
                isEdited: false,
              },
            ]);
            setCurrentMessage(null);
            onTurnEnd?.(data.agentIndex, data.messageId);
            break;

          case 'paused':
            setIsPaused(true);
            break;

          case 'resumed':
            setIsPaused(false);
            break;

          case 'waiting-for-next':
            setIsWaitingForNext(true);
            setNextAgentIndex(data.nextAgentIndex);
            break;

          case 'debate-end':
            console.log('Debate ended:', data.reason);
            setIsRunning(false);
            setIsEnded(true);
            setEndReason(data.reason);
            eventSource.close();
            onDebateEnd?.(data.reason || 'ended');
            break;

          case 'error':
            console.error('SSE error event:', data.message);
            onError?.(data.message);
            break;
        }
      } catch (e) {
        console.error('Error parsing SSE event:', e, event.data);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      setIsRunning(false);
      eventSource.close();
      onError?.('Failed to connect to debate stream');
    };
  }, [debateId, onToken, onTurnEnd, onDebateEnd, onError]);

  const pause = useCallback(async () => {
    await api.pauseDebate(debateId);
  }, [debateId]);

  const resume = useCallback(async () => {
    await api.resumeDebate(debateId);
  }, [debateId]);

  const stop = useCallback(async () => {
    await api.stopDebate(debateId);
  }, [debateId]);

  const triggerNextTurn = useCallback(async () => {
    try {
      await api.triggerNextTurn(debateId);
      setIsWaitingForNext(false);
      setNextAgentIndex(null);
    } catch (error) {
      console.error('Failed to trigger next turn:', error);
      onError?.('Failed to trigger next turn');
    }
  }, [debateId, onError]);

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    await api.updateMessage(debateId, messageId, content);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, content, isEdited: true } : msg
      )
    );
  }, [debateId]);

  const undoToMessage = useCallback(async (messageId: string) => {
    await api.undoToMessage(debateId, messageId);
    setMessages((prev) => {
      const index = prev.findIndex((msg) => msg.id === messageId);
      if (index === -1) return prev;
      return prev.slice(0, index + 1);
    });
    setIsEnded(false);
    setEndReason(null);
  }, [debateId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    messages,
    currentMessage,
    isRunning,
    isPaused,
    isEnded,
    isWaitingForNext,
    nextAgentIndex,
    endReason,
    start,
    pause,
    resume,
    stop,
    triggerNextTurn,
    updateMessage,
    undoToMessage,
    setMessages,
  };
}
