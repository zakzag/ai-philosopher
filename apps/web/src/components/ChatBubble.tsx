import { useState, useRef, useEffect } from 'react';
import { Message } from '@philosopher/shared';
import './ChatBubble.css';

interface ChatBubbleProps {
  message: Message;
  agentName: string;
  isStreaming?: boolean;
  onEdit?: (content: string) => void;
  onUndoToThis?: () => void;
  editable?: boolean;
  showNextButton?: boolean;
  onNext?: () => Promise<void>;
  nextAgentName?: string;
  onStop?: () => Promise<void>;
}

export function ChatBubble({
  message,
  agentName,
  isStreaming = false,
  onEdit,
  onUndoToThis,
  editable = false,
  showNextButton = false,
  onNext,
  nextAgentName,
  onStop,
}: ChatBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [isStopLoading, setIsStopLoading] = useState(false);
  const [actionsHidden, setActionsHidden] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditContent(message.content);
  }, [message.content]);

  useEffect(() => {
    if (showNextButton) {
      setActionsHidden(false);
    }
  }, [showNextButton]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveEdit = () => {
    if (onEdit && editContent !== message.content) {
      onEdit(editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleNext = async () => {
    if (onNext) {
      setIsNextLoading(true);
      setActionsHidden(true);
      try {
        await onNext();
      } finally {
        setIsNextLoading(false);
      }
    }
  };

  const handleStop = async () => {
    if (onStop) {
      setIsStopLoading(true);
      setActionsHidden(true);
      try {
        await onStop();
      } finally {
        setIsStopLoading(false);
      }
    }
  };

  return (
    <div className={`chat-bubble agent-${message.agentIndex}`}>
      <div className="chat-bubble-header">
        <span className="agent-name">{agentName}</span>
        {message.isEdited && <span className="edited-badge">edited</span>}
        {!isStreaming && (
          <div className="menu-container" ref={menuRef}>
            <button
              className="menu-button"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Message options"
            >
              ⋯
            </button>
            {showMenu && (
              <div className="context-menu">
                {editable && onEdit && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
                {onUndoToThis && (
                  <button
                    onClick={() => {
                      onUndoToThis();
                      setShowMenu(false);
                    }}
                  >
                    ↩️ Undo to this
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="edit-container">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={5}
          />
          <div className="edit-actions">
            <button className="btn-save" onClick={handleSaveEdit}>Save</button>
            <button className="btn-cancel" onClick={handleCancelEdit}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="chat-bubble-content">
          {message.content}
          {isStreaming && <span className="cursor">▋</span>}
        </div>
      )}

      {showNextButton && !isStreaming && (onNext || onStop) && !actionsHidden && (
        <div className="next-button-container">
          {onNext && (
            <button
              className="next-button"
              onClick={handleNext}
              disabled={isNextLoading}
            >
              {isNextLoading ? (
                <>
                  <span className="spinner">⏳</span> Loading...
                </>
              ) : (
                <>
                  Next: {nextAgentName} ➜
                </>
              )}
            </button>
          )}
          {onStop && (
            <button
              className="stop-button"
              onClick={handleStop}
              disabled={isStopLoading}
            >
              {isStopLoading ? 'Stopping...' : 'Stop'}
            </button>
          )}
        </div>
      )}

      <div className="chat-bubble-time">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
