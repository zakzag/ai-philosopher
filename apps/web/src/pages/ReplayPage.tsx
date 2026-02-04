import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Debate, Message } from '@philosopher/shared';
import { ChatBubble, SpeedSlider } from '../components';
import { useReplay } from '../hooks/useReplay';
import { api } from '../services/api';
import './ReplayPage.css';

const AGENT_NAMES = ['Philosopher Alpha', 'Philosopher Beta'];

export function ReplayPage() {
  const { id } = useParams<{ id: string }>();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    displayedMessages,
    isPlaying,
    speed,
    play,
    pause,
    reset,
    setSpeed,
    jumpToEnd,
  } = useReplay({ messages: allMessages });

  useEffect(() => {
    async function loadDebate() {
      if (!id) return;
      try {
        const data = await api.getDebate(id);
        setDebate(data.debate);
        setAllMessages(data.messages);
      } catch (error) {
        console.error('Failed to load debate:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDebate();
  }, [id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [displayedMessages]);

  if (loading) {
    return (
      <div className="replay-page loading">
        <p>Loading replay...</p>
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="replay-page error">
        <p>Debate not found</p>
        <Link to="/">Go back home</Link>
      </div>
    );
  }

  const getEndReasonText = () => {
    switch (debate.endReason) {
      case 'timeout':
        return '⏰ Ended due to timeout';
      case 'manual':
        return '🛑 Stopped manually';
      default:
        return '';
    }
  };

  return (
    <div className="replay-page">
      <header className="replay-header">
        <Link to="/" className="back-link">← Back</Link>
        <h1>🎬 Debate Replay</h1>
        <span className="end-reason">{getEndReasonText()}</span>
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

      <SpeedSlider
        speed={speed}
        onChange={setSpeed}
        isPlaying={isPlaying}
        onPlay={play}
        onPause={pause}
        onReset={reset}
        onJumpToEnd={jumpToEnd}
      />

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${allMessages.length > 0 
              ? (displayedMessages.length / allMessages.length) * 100 
              : 0}%`
          }}
        />
        <span className="progress-text">
          {displayedMessages.length} / {allMessages.length} messages
        </span>
      </div>

      <div className="chat-container" ref={chatContainerRef}>
        {displayedMessages.map((message, index) => (
          <ChatBubble
            key={`${message.id}-${index}`}
            message={message}
            agentName={AGENT_NAMES[message.agentIndex]}
            isStreaming={index === displayedMessages.length - 1 && isPlaying}
          />
        ))}

        {displayedMessages.length === 0 && !isPlaying && (
          <div className="empty-chat">
            <p>Press play to start the replay</p>
          </div>
        )}
      </div>
    </div>
  );
}
