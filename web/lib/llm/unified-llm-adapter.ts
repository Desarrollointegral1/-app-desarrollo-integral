/**
 * ============================================================
 * UNIFIED LLM ADAPTER — Single Interface for All LLMs
 * ============================================================
 *
 * Propósito: Abstracción única para trabajar con:
 *   - Anthropic (primario)
 *   - OpenAI (fallback)
 *   - Google Generative AI (fallback)
 *
 * Estrategia: Primario → Fallback → Local (FFmpeg)
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export interface UnifiedLLMRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: 'anthropic' | 'openai' | 'google';
}

export interface UnifiedLLMResponse {
  provider: 'anthropic' | 'openai' | 'google' | 'fallback';
  content: string;
  tokensUsed: number;
  stopReason: string;
}

export class UnifiedLLMAdapter {
  private anthropic: Anthropic;
  private openai: OpenAI;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Ejecuta request con fallback automático
   */
  async execute(request: UnifiedLLMRequest): Promise<UnifiedLLMResponse> {
    const preferred = request.model || 'anthropic';

    // 1. Intentar con provider preferido
    try {
      if (preferred === 'anthropic') {
        return await this.executeAnthropicWithFallback(request);
      } else if (preferred === 'openai') {
        return await this.executeOpenAIWithFallback(request);
      }
    } catch (error) {
      console.warn(`[LLM] ${preferred} failed, trying fallback:`, error instanceof Error ? error.message : String(error));
    }

    // 2. Fallback automático
    try {
      return await this.executeAnthropicWithFallback(request);
    } catch (error) {
      console.warn('[LLM] Anthropic fallback failed:', error);
    }

    // 3. Último recurso: OpenAI
    try {
      return await this.executeOpenAIWithFallback(request);
    } catch (error) {
      console.warn('[LLM] OpenAI fallback failed:', error);
    }

    // 4. Fallback local (útil para casos donde no hay conexión)
    return {
      provider: 'fallback',
      content: 'Local fallback: unable to reach LLMs. Returning default response.',
      tokensUsed: 0,
      stopReason: 'offline',
    };
  }

  /**
   * Ejecuta con Anthropic
   */
  private async executeAnthropicWithFallback(request: UnifiedLLMRequest): Promise<UnifiedLLMResponse> {
    const response = await this.anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: request.maxTokens || 2048,
      temperature: request.temperature || 1,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.userPrompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    return {
      provider: 'anthropic',
      content: content.text,
      tokensUsed: response.usage?.input_tokens || 0 + (response.usage?.output_tokens || 0),
      stopReason: response.stop_reason || 'end_turn',
    };
  }

  /**
   * Ejecuta con OpenAI
   */
  private async executeOpenAIWithFallback(request: UnifiedLLMRequest): Promise<UnifiedLLMResponse> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: request.maxTokens || 2048,
      temperature: request.temperature || 1,
      messages: [
        {
          role: 'system',
          content: request.systemPrompt,
        },
        {
          role: 'user',
          content: request.userPrompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return {
      provider: 'openai',
      content,
      tokensUsed: response.usage?.total_tokens || 0,
      stopReason: response.choices[0]?.finish_reason || 'stop',
    };
  }
}

// Singleton
let adapter: UnifiedLLMAdapter | null = null;

export function getUnifiedLLMAdapter(): UnifiedLLMAdapter {
  if (!adapter) {
    adapter = new UnifiedLLMAdapter();
  }
  return adapter;
}
