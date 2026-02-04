import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Debate, AgentConfig } from '@philosopher/shared';
import { DebateForm, DebateList } from '../components';
import { api } from '../services/api';
import './HomePage.css';

export function HomePage() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDebates();
  }, []);

  const loadDebates = async () => {
    try {
      const data = await api.getDebates();
      setDebates(data);
    } catch (error) {
      console.error('Failed to load debates:', error);
    }
  };

  const handleCreateDebate = async (
    agent1Config: AgentConfig,
    agent2Config: AgentConfig,
    timeLimitMinutes: number,
    responseDelaySeconds: number,
    stepByStepMode: boolean,
    maxTurns: number | undefined,
    temperature: number,
    autoPauseEveryNTurns: number | undefined
  ) => {
    setIsLoading(true);
    try {
      const debate = await api.createDebate({
        standpoints: [agent1Config.standpoint, agent2Config.standpoint],
        timeLimitMinutes,
        agentConfigs: [agent1Config, agent2Config],
        responseDelaySeconds,
        stepByStepMode,
        maxTurns,
        temperature,
        autoPauseEveryNTurns,
      });
      navigate(`/debate/${debate.id}`);
    } catch (error) {
      console.error('Failed to create debate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDebate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this debate?')) return;

    try {
      await api.deleteDebate(id);
      setDebates((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error('Failed to delete debate:', error);
    }
  };

  return (
    <div className="home-page">
      <header className="hero">
        <h1>🎭 Philosopher</h1>
        <p>Watch AI agents debate philosophical topics</p>
      </header>

      <main className="container">
        <DebateForm onSubmit={handleCreateDebate} isLoading={isLoading} />
        <DebateList debates={debates} onDelete={handleDeleteDebate} />
      </main>
    </div>
  );
}
