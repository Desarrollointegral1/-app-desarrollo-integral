import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMExecutionInput, SkillResult } from './types';

export class GeminiExecutor {
  private client: GoogleGenerativeAI;
  private model: string;
  private timeout: number;

  constructor(apiKey: string, model: string = 'gemini-1.5-flash', timeout: number = 300000) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
    this.timeout = timeout;
  }

  async execute(input: LLMExecutionInput): Promise<SkillResult> {
    const startTime = Date.now();

    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      const systemPrompt = input.systemPrompt || this.getDefaultSystemPrompt(input);
      const userPrompt = this.buildPrompt(input);

      const response = await Promise.race([
        model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          systemInstruction: systemPrompt,
          generationConfig: {
            maxOutputTokens: input.maxTokens || 4096,
            temperature: input.temperature || 1,
          },
        }),
        this.createTimeout(),
      ]);

      const text = response.response.text();
      if (!text) {
        throw new Error('No content in Gemini response');
      }

      // Gemini API returns usage info in response
      const usageMetadata = response.response.usageMetadata;
      const inputTokens = usageMetadata?.promptTokenCount || 0;
      const outputTokens = usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = inputTokens + outputTokens;

      return {
        success: true,
        output: {
          result: text,
          skillId: typeof input.skill === 'string' ? input.skill : input.skill.id,
          input: input.input,
        },
        tokensUsed: totalTokens,
        inputTokens,
        outputTokens,
        llmProvider: 'gemini',
        executionTime: Date.now() - startTime,
        retryCount: 0,
        stopReason: response.response.candidates?.[0]?.finishReason || 'STOP',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Gemini API error: ${message}`);
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
