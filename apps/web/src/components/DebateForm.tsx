import { useState } from 'react';
import {
  PersonalityType,
  ResponseLength,
  PERSONALITIES,
  RESPONSE_LENGTHS,
  AgentConfig
} from '@philosopher/shared';
import './DebateForm.css';

interface DebateFormProps {
  onSubmit: (
    agent1Config: AgentConfig,
    agent2Config: AgentConfig,
    timeLimitMinutes: number,
    responseDelaySeconds: number,
    stepByStepMode: boolean,
    maxTurns: number | undefined,
    temperature: number,
    autoPauseEveryNTurns: number | undefined
  ) => void;
  isLoading?: boolean;
}

export function DebateForm({ onSubmit, isLoading = false }: DebateFormProps) {
  // Agent 1 config
  const [standpoint1, setStandpoint1] = useState('God exists');
  const [personality1, setPersonality1] = useState<PersonalityType>('pragmatic');
  const [responseLength1, setResponseLength1] = useState<ResponseLength>('medium');

  // Agent 2 config
  const [standpoint2, setStandpoint2] = useState('God does not exist');
  const [personality2, setPersonality2] = useState<PersonalityType>('analytical');
  const [responseLength2, setResponseLength2] = useState<ResponseLength>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (standpoint1.trim() && standpoint2.trim()) {
      const agent1Config: AgentConfig = {
        standpoint: standpoint1.trim(),
        personality: personality1,
        responseLength: responseLength1,
      };

      const agent2Config: AgentConfig = {
        standpoint: standpoint2.trim(),
        personality: personality2,
        responseLength: responseLength2,
      };

      onSubmit(
        agent1Config,
        agent2Config,
        5,  // timeLimit: 5 minutes (default)
        5,  // responseDelay: 5 seconds (default)
        true,  // stepByStepMode: enabled (default)
        20,  // maxTurns: 20 (default)
        0.7,  // temperature: 0.7 (default)
        undefined  // autoPauseEveryNTurns: disabled (default)
      );
    }
  };

  const getPersonalityTooltip = (personalityType: PersonalityType) => {
    return PERSONALITIES.find(p => p.value === personalityType)?.description || '';
  };

  return (
    <form className="debate-form" onSubmit={handleSubmit}>
      <h2>Start a New Debate</h2>

      <div className="agents-container">
        {/* Agent 1 */}
        <div className="agent-panel">
          <h3>
            <span className="agent-indicator agent-0">Agent 1</span>
          </h3>

          <div className="form-group">
            <label htmlFor="standpoint1">Standpoint</label>
            <textarea
              id="standpoint1"
              value={standpoint1}
              onChange={(e) => setStandpoint1(e.target.value)}
              placeholder="e.g., God exists and is the creator of the universe"
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="personality1">
              Personality
              <span className="info-icon" title={getPersonalityTooltip(personality1)}>ⓘ</span>
            </label>
            <select
              id="personality1"
              value={personality1}
              onChange={(e) => setPersonality1(e.target.value as PersonalityType)}
            >
              {PERSONALITIES.map(p => (
                <option key={p.value} value={p.value} title={p.description}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="responseLength1">
              Response Length: {RESPONSE_LENGTHS.find(l => l.value === responseLength1)?.label}
            </label>
            <input
              type="range"
              id="responseLength1"
              min={0}
              max={2}
              value={RESPONSE_LENGTHS.findIndex(l => l.value === responseLength1)}
              onChange={(e) => setResponseLength1(RESPONSE_LENGTHS[Number(e.target.value)].value)}
            />
            <div className="range-labels">
              {RESPONSE_LENGTHS.map(l => (
                <span key={l.value}>{l.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Agent 2 */}
        <div className="agent-panel">
          <h3>
            <span className="agent-indicator agent-1">Agent 2</span>
          </h3>

          <div className="form-group">
            <label htmlFor="standpoint2">Standpoint</label>
            <textarea
              id="standpoint2"
              value={standpoint2}
              onChange={(e) => setStandpoint2(e.target.value)}
              placeholder="e.g., God does not exist, the universe is a result of natural processes"
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="personality2">
              Personality
              <span className="info-icon" title={getPersonalityTooltip(personality2)}>ⓘ</span>
            </label>
            <select
              id="personality2"
              value={personality2}
              onChange={(e) => setPersonality2(e.target.value as PersonalityType)}
            >
              {PERSONALITIES.map(p => (
                <option key={p.value} value={p.value} title={p.description}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="responseLength2">
              Response Length: {RESPONSE_LENGTHS.find(l => l.value === responseLength2)?.label}
            </label>
            <input
              type="range"
              id="responseLength2"
              min={0}
              max={2}
              value={RESPONSE_LENGTHS.findIndex(l => l.value === responseLength2)}
              onChange={(e) => setResponseLength2(RESPONSE_LENGTHS[Number(e.target.value)].value)}
            />
            <div className="range-labels">
              {RESPONSE_LENGTHS.map(l => (
                <span key={l.value}>{l.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={isLoading}>
        {isLoading ? 'Creating...' : '🎭 Start Debate'}
      </button>
    </form>
  );
}
