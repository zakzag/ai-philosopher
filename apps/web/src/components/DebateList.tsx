import { Debate } from '@philosopher/shared';
import { Link } from 'react-router-dom';
import './DebateList.css';

interface DebateListProps {
  debates: Debate[];
  onDelete?: (id: string) => void;
}

export function DebateList({ debates, onDelete }: DebateListProps) {
  const getStatusBadge = (debate: Debate) => {
    switch (debate.status) {
      case 'running':
        return <span className="badge badge-running">🎭 Running</span>;
      case 'paused':
        return <span className="badge badge-paused">⏸️ Paused</span>;
      case 'completed':
        return <span className="badge badge-completed">✓ Completed</span>;
      default:
        return <span className="badge badge-pending">⏳ Pending</span>;
    }
  };

  const getEndReasonBadge = (debate: Debate) => {
    if (debate.status !== 'completed') return null;
    switch (debate.endReason) {
      case 'timeout':
        return <span className="badge badge-timeout">⏰ Timeout</span>;
      case 'manual':
        return <span className="badge badge-manual">🛑 Stopped</span>;
      default:
        return null;
    }
  };

  if (debates.length === 0) {
    return (
      <div className="debate-list-empty">
        <p>No debates yet. Start your first debate above!</p>
      </div>
    );
  }

  return (
    <div className="debate-list">
      <h3>Past Debates</h3>
      {debates.map((debate) => (
        <div key={debate.id} className="debate-card">
          <div className="debate-card-header">
            <div className="debate-badges">
              {getStatusBadge(debate)}
              {getEndReasonBadge(debate)}
            </div>
            <span className="debate-date">
              {new Date(debate.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="debate-standpoints">
            <div className="standpoint standpoint-0">
              <span className="standpoint-label">Agent 1:</span>
              {debate.standpoints[0]}
            </div>
            <div className="vs">VS</div>
            <div className="standpoint standpoint-1">
              <span className="standpoint-label">Agent 2:</span>
              {debate.standpoints[1]}
            </div>
          </div>

          <div className="debate-card-actions">
            {debate.status === 'completed' ? (
              <Link to={`/replay/${debate.id}`} className="btn btn-replay">
                ▶️ Replay
              </Link>
            ) : debate.status === 'running' || debate.status === 'paused' ? (
              <Link to={`/debate/${debate.id}`} className="btn btn-view">
                👀 View
              </Link>
            ) : (
              <Link to={`/debate/${debate.id}`} className="btn btn-continue">
                ▶️ Start
              </Link>
            )}
            {onDelete && (
              <button
                className="btn btn-delete"
                onClick={() => onDelete(debate.id)}
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
