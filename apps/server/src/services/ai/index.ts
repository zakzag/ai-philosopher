import { AIProvider } from './AIProvider.js';
import { GroqProvider } from './GroqProvider.js';
import { OpenRouterProvider } from './OpenRouterProvider.js';
import { aiConfig } from '../../config/index.js';
import { AIProviderType } from '@philosopher/shared';

export class AIProviderFactory {
  private static providers: Map<AIProviderType, AIProvider> = new Map();

  static getProvider(type?: AIProviderType): AIProvider {
    const providerType = type || aiConfig.provider;

    if (!this.providers.has(providerType)) {
      const provider = this.createProvider(providerType);
      this.providers.set(providerType, provider);
    }

    return this.providers.get(providerType)!;
  }

  private static createProvider(type: AIProviderType): AIProvider {
    switch (type) {
      case 'groq':
        return new GroqProvider();
      case 'openrouter':
        return new OpenRouterProvider();
      default:
        throw new Error(`Unknown AI provider: ${type}`);
    }
  }
}

export { AIProvider, AIContext } from './AIProvider.js';
export { GroqProvider } from './GroqProvider.js';
export { OpenRouterProvider } from './OpenRouterProvider.js';
