import { Message, AgentConfig, PERSONALITIES, RESPONSE_LENGTHS } from '@philosopher/shared';

export interface AIContext {
  standpoint: string;
  opponentStandpoint: string;
  messages: Message[];
  agentConfig?: AgentConfig;
  temperature?: number;
}

export abstract class AIProvider {
  abstract get name(): string;

  abstract streamResponse(
    prompt: string,
    context: AIContext
  ): AsyncGenerator<string, void, unknown>;

  protected buildSystemPrompt(context: AIContext): string {
    // Get personality description
    let personalityGuidance = '';
    if (context.agentConfig?.personality) {
      const personality = PERSONALITIES.find(p => p.value === context.agentConfig?.personality);
      if (personality) {
        personalityGuidance = `\n\nYour personality style: ${personality.label} - ${personality.description}
Argue according to this personality. Let it shape your reasoning, examples, and approach to arguments.`;
      }
    }

    // Get response length guidance
    let lengthGuidance = '';
    if (context.agentConfig?.responseLength) {
      const length = RESPONSE_LENGTHS.find(l => l.value === context.agentConfig?.responseLength);
      if (length) {
        lengthGuidance = `\n\n**CRITICAL: Response Length Requirement**
Your response MUST be between ${length.wordCount.min} and ${length.wordCount.max} words (${length.wordRange}).
This is a STRICT requirement. Count your words and adjust accordingly.
- If set to SHORT: Be concise and direct (${length.wordCount.min}-${length.wordCount.max} words)
- If set to MEDIUM: Provide moderate detail (${length.wordCount.min}-${length.wordCount.max} words)
- If set to LONG: Give thorough explanations (${length.wordCount.min}-${length.wordCount.max} words)`;
      }
    }

    return `You are a philosopher engaged in a debate. Your position is: "${context.standpoint}"
Your opponent's position is: "${context.opponentStandpoint}"
${personalityGuidance}${lengthGuidance}

Rules:
1. Argue your position thoughtfully and respectfully
2. Respond to your opponent's arguments directly
3. Use logical reasoning and examples
4. Be open to finding common ground while defending your core position
5. Do not repeat arguments you've already made`;
  }

  protected buildMessages(context: AIContext): Array<{ role: string; content: string }> {
    console.info('[AIProvider] buildMessages:start', {
      standpoint: context.standpoint,
      opponentStandpoint: context.opponentStandpoint,
      messageCount: context.messages?.length ?? 0,
    });

    const systemPrompt = this.buildSystemPrompt(context);

    console.info("System Prompt:", systemPrompt);

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    for (const msg of context.messages) {
      const role = msg.agentIndex === 0 ? 'assistant' : 'user';
      // Flip roles based on which agent we're generating for
      messages.push({
        role,
        content: msg.content
      });
    }

    console.info("Message:", messages);

    console.info('[AIProvider] buildMessages:done', { builtCount: messages.length });

    return messages;
  }
}
