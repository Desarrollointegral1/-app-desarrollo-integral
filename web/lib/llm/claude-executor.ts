import Anthropic from '@anthropic-ai/sdk';
import { LLMExecutionInput, SkillResult } from './types';

export class ClaudeExecutor {
  private client: Anthropic;
  private model: string;
  private timeout: number;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022', timeout: number = 300000) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.timeout = timeout;
  }

  async execute(input: LLMExecutionInput): Promise<SkillResult> {
    const startTime = Date.now();

    try {
      const prompt = this.buildPrompt(input);

      const response = await Promise.race([
        this.client.messages.create({
          model: this.model,
          max_tokens: input.maxTokens || 4096,
          temperature: input.temperature || 1,
          system: input.systemPrompt || this.getDefaultSystemPrompt(input),
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        this.createTimeout(),
      ]);

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      return {
        success: true,
        output: {
          result: content.text,
          skillId: typeof input.skill === 'string' ? input.skill : input.skill.id,
          input: input.input,
        },
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        llmProvider: 'claude',
        executionTime: Date.now() - startTime,
        retryCount: 0,
        stopReason: response.stop_reason,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Claude API error: ${message}`);
    }
  }

  private buildPrompt(input: LLMExecutionInput): string {
    const skillId = typeof input.skill === 'string' ? input.skill : input.skill.id;
    const skillDescription =
      typeof input.skill === 'string'
        ? `Execute skill: ${skillId}`
        : `Execute skill: ${input.skill.name}\n\nDescription: ${input.skill.description}`;

    let prompt = `${skillDescription}\n\n`;

    if (typeof input.skill !== 'string' && input.skill.examples && input.skill.examples.length > 0) {
      prompt += `Examples:\n`;
      input.skill.examples.forEach((example, index) => {
        prompt += `\nExample ${index + 1}:\n`;
        prompt += `Input: ${JSON.stringify(example.input, null, 2)}\n`;
        prompt += `Output: ${JSON.stringify(example.output, null, 2)}\n`;
      });
      prompt += '\n';
    }

    prompt += `Input:\n${JSON.stringify(input.input, null, 2)}\n\n`;

    if (input.context) {
      prompt += `Context:\n${JSON.stringify(input.context, null, 2)}\n\n`;
    }

    prompt += `Please execute this skill and return a valid JSON response.`;

    return prompt;
  }

  private getDefaultSystemPrompt(input: LLMExecutionInput): string {
    return `You are an expert AI assistant executing a specific skill.
Your task is to process the given input and produce accurate, structured output.
Always return valid JSON when requested.
Focus on quality and accuracy.`;
  }

  private createTimeout(): Promise<any> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${this.timeout}ms`)), this.timeout)
    );
  }
}
