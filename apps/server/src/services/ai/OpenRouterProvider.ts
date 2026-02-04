import { AIProvider, AIContext } from './AIProvider.js';
import { aiConfig } from '../../config/index.js';

export class OpenRouterProvider extends AIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    super();
    this.apiKey = aiConfig.openrouter.apiKey;
    this.model = aiConfig.openrouter.model;
  }

  get name(): string {
    return 'openrouter';
  }

  async *streamResponse(
    prompt: string,
    context: AIContext
  ): AsyncGenerator<string, void, unknown> {
    const messages = this.buildMessages(context);

    // Add the current prompt as user message if provided
    if (prompt) {
      messages.push({ role: 'user', content: prompt });
    }

    const temperature = context.temperature ?? aiConfig.defaultTemperature;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Philosopher Debate App',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        temperature,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}
