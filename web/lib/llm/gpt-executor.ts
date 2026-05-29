import OpenAI from 'openai';
import { LLMExecutionInput, SkillResult } from './types';

export class GPTExecutor {
  private client: OpenAI;
  private model: string;
  private timeout: number;

  constructor(apiKey: string, model: string = 'gpt-4-mini', timeout: number = 300000) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.timeout = timeout;
  }

  async execute(input: LLMExecutionInput): Promise<SkillResult> {
    const startTime = Date.now();

    try {
      const systemPrompt = input.systemPrompt || this.getDefaultSystemPrompt(input);
      const userPrompt = this.buildPrompt(input);

      const response = await Promise.race([
        this.client.chat.completions.create({
          model: this.model,
          max_tokens: input.maxTokens || 4096,
          temperature: input.temperature || 1,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
        this.createTimeout(),
      ]);

      const choice = response.choices[0];
      if (!choice.message.content) {
        throw new Error('No content in GPT response');
      }

      const totalTokens = response.usage?.total_tokens || 0;
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;

      return {
        success: true,
        output: {
          result: choice.message.content,
          skillId: typeof input.skill === 'string' ? input.skill : input.skill.id,
          input: input.input,
        },
        tokensUsed: totalTokens,
        inputTokens,
        outputTokens,
        llmProvider: 'gpt',
        executionTime: Date.now() - startTime,
        retryCount: 0,
        stopReason: choice.finish_reason || 'stop',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`GPT API error: ${message}`);
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
