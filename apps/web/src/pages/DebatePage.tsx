import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Debate } from '@philosopher/shared';
import { ChatBubble } from '../components';
import { useDebateStream } from '../hooks/useDebateStream';
import { api } from '../services/api';
import './DebatePage.css';

const AGENT_NAMES = ['Philosopher Alpha', 'Philosopher Beta'];

export function DebatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingAgentIndex, setStreamingAgentIndex] = useState<0 | 1 | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  const {
    messages,
    isRunning,
    isPaused,
    isEnded,
    isWaitingForNext,
    nextAgentIndex,
    start,
    stop,
    triggerNextTurn,
    updateMessage,
    undoToMessage,
    setMessages,
  } = useDebateStream({
    debateId: id!,
    onToken: (agentIndex, content) => {
      setStreamingAgentIndex(agentIndex);
      setStreamingContent((prev) => prev + content);
    },
    onTurnEnd: () => {
      // Reset streaming state when turn completes
      setStreamingContent('');
      setStreamingAgentIndex(null);
    },
    onDebateEnd: () => {
      loadDebate();
    },
    onError: (message) => {
      console.error('Debate error:', message);
      alert(`Error: ${message}`);
    },
  });

  // Load debate details
  const loadDebate = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getDebate(id);
      setDebate(data.debate);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to load debate:', error);
      navigate('/');
    }
  }, [id, navigate, setMessages]);

  useEffect(() => {
    loadDebate();
  }, [loadDebate]);

  // Auto-start if debate is pending
  useEffect(() => {
    if (debate && debate.status === 'pending' && !isRunning && !hasStartedRef.current) {
      hasStartedRef.current = true;
      console.log('Starting debate:', debate.id);
      start();
    }
  }, [debate, isRunning, start]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleEdit = async (messageId: string, content: string) => {
    await updateMessage(messageId, content);
  };

  const handleUndoToThis = async (messageId: string) => {
    await undoToMessage(messageId);
    await loadDebate();
  };


  if (!debate) {
    return (
      <div className="debate-page loading">
        <p>Loading debate...</p>
      </div>
    );
  }

  return (
    <div className="debate-page">
      <header className="debate-header">
        <Link to="/" className="back-link">← Back</Link>
        <h1>🎭 Philosopher Debate</h1>
      </header>

      <div className="standpoints-bar">
        <div className="standpoint-tag agent-0">
          <strong>{AGENT_NAMES[0]}:</strong> {debate.standpoints[0]}
        </div>
        <span className="vs">VS</span>
        <div className="standpoint-tag agent-1">
          <strong>{AGENT_NAMES[1]}:</strong> {debate.standpoints[1]}
        </div>
      </div>

      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const showNextButton = isLastMessage && isWaitingForNext && nextAgentIndex !== null;

          return (
            <ChatBubble
              key={message.id}
              message={message}
              agentName={AGENT_NAMES[message.agentIndex]}
              editable={isPaused}
              onEdit={(content) => handleEdit(message.id, content)}
              onUndoToThis={() => handleUndoToThis(message.id)}
              showNextButton={showNextButton}
              onNext={showNextButton ? triggerNextTurn : undefined}
              nextAgentName={nextAgentIndex !== null ? AGENT_NAMES[nextAgentIndex] : undefined}
              onStop={showNextButton ? stop : undefined}
            />
          );
        })}

        {/* Streaming message */}
        {streamingAgentIndex !== null && streamingContent && (
          <ChatBubble
            message={{
              id: 'streaming',
              debateId: id!,
              agentIndex: streamingAgentIndex,
              content: streamingContent,
              timestamp: new Date(),
              isEdited: false,
            }}
            agentName={AGENT_NAMES[streamingAgentIndex]}
            isStreaming={true}
          />
        )}

        {messages.length === 0 && !streamingContent && !isRunning && (
          <div className="empty-chat">
            <p>The debate will begin shortly...</p>
          </div>
        )}
      </div>

      {isEnded && (
        <div className="debate-ended-actions">
          <Link to={`/replay/${id}`} className="btn btn-replay">
            ▶️ Watch Replay
          </Link>
          <Link to="/" className="btn btn-home">
            🏠 Back to Home
          </Link>
        </div>
      )}
    </div>
  );
}
