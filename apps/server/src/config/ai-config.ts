import { AIProviderType } from '@philosopher/shared';

export interface AIConfig {
  provider: AIProviderType;
  groq: {
    apiKey: string;
    model: string;
  };
  openrouter: {
    apiKey: string;
    model: string;
  };
  defaultTemperature: number;
}

export const aiConfig: AIConfig = {
  provider: (process.env.AI_PROVIDER as AIProviderType) || 'openrouter',
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'stepfun/step-3.5-flash:free',
  },
  defaultTemperature: 0.7,
};
