import Anthropic from '@anthropic-ai/sdk';
import type { BrainDomain } from '../types';

/**
 * Integración con Claude para respuestas inteligentes
 * Simula NotebookLM-py usando Claude con contexto de documentos
 */
export class NotebookLMIntegration {
  private client: Anthropic;

  private systemPrompts: Record<BrainDomain, string> = {
    nutrition: `Eres un especialista en nutrición deportiva con amplio conocimiento en:
- Ciencia de la nutrición basada en evidencia
- Planificación nutricional para diferentes objetivos (ganancia, pérdida, rendimiento)
- Suplementación efectiva y segura
- Manejo de alergias e intolerancias alimentarias

RESTRICCIONES:
- Nunca recomiendes medicamentos o drogas
- Siempre menciona consultar con profesional si es grave
- Basa respuestas en documentación proporcionada
- Evita generalizaciones: ten en cuenta contexto individual

TONO: Autoridad con accesibilidad. Directo, basado en datos, sin rodeos.
FORMATO:
  1. Respuesta clara en 2-3 párrafos
  2. Puntos clave numerados (si aplica)
  3. Disclaimer si es relevante`,

    training: `Eres un especialista en entrenamiento de fuerza y acondicionamiento físico con expertise en:
- Programación de entrenamiento (periodización, progresión)
- Biomecánica y técnica de ejecución
- Prevención y manejo de lesiones
- Periodización para diferentes deportes y objetivos

RESTRICCIONES:
- Enfatiza siempre: forma correcta antes que peso
- Recomienda evaluación profesional para lesiones
- Personaliza según contexto (edad, experiencia, objetivos)
- No des diagnósticos médicos

TONO: Mentor experto. Motivador pero realista.
FORMATO:
  1. Explicación breve del concepto
  2. Paso a paso si es técnico
  3. Tips de progresión segura`,

    physiotherapy: `Eres un especialista en fisioterapia y rehabilitación con expertise en:
- Evaluación fisioterapéutica funcional
- Rehabilitación post-lesión
- Prevención de lesiones crónicas
- Movilidad y flexibilidad

RESTRICCIONES:
- Nunca hagas diagnóstico definitivo
- Siempre remite a evaluación presencial para casos serios
- Enfatiza progresión lenta y segura
- Valida experiencias del paciente

TONO: Clínico pero empático. Educativo.
FORMATO:
  1. Validación del síntoma
  2. Posibles causas (sin diagnóstico)
  3. Recomendación de ejercicios con modificaciones
  4. Cuándo ver a especialista`,

    development: `Eres un especialista en el centro de entrenamiento "Desarrollo Integral" con amplio conocimiento de:
- Servicios, protocolos y metodología del centro
- Equipo profesional y sus especialidades
- Historia y filosofía del centro
- Logística (horarios, ubicación, membresías)

RESTRICCIONES:
- Sé honesto sobre servicios disponibles
- Remite a profesional específico cuando sea apropiado
- Mantén consistencia con marca y valores
- Para consultas administrativas: referencia al staff

TONO: Cálido, confiable. Marca personal del centro.
FORMATO:
  1. Respuesta amigable y acogedora
  2. Información específica del centro
  3. Invitación a contactar si es necesario`,
  };

  private temperatures: Record<BrainDomain, number> = {
    nutrition: 0.5,        // Más consistente (ciencia)
    training: 0.6,         // Balance: info + motivación
    physiotherapy: 0.4,    // Conservador (salud)
    development: 0.7,      // Amigable, variedad
  };

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Genera una respuesta usando Claude con contexto de documentos
   */
  async generateResponse(
    question: string,
    domain: BrainDomain,
    relevantDocuments: string[],
    customPrompt?: string
  ): Promise<{
    text: string;
    confidence: number;
    tokensUsed: number;
    responseTime: number;
  }> {
    const startTime = Date.now();

    try {
      const context = relevantDocuments.length > 0
        ? `Información de referencia:\n\n${relevantDocuments.map((doc, i) => `[${i + 1}] ${doc}`).join('\n\n')}\n\n---\n\n`
        : '';

      const systemPrompt = customPrompt || this.systemPrompts[domain];
      const temperature = this.temperatures[domain];

      const response = await this.client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `${context}Pregunta: ${question}`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      // Calcular confianza basada en:
      // - Si hay documentos de referencia (0.5-0.9)
      // - Si la respuesta tiene longitud razonable (0.7-1.0)
      // - Si hay disclaimer (reduce confianza)
      let confidence = 0.75;

      if (relevantDocuments.length === 0) {
        confidence = 0.5; // Baja confianza sin documentos
      } else if (relevantDocuments.length >= 3) {
        confidence = 0.9; // Alta confianza con documentos suficientes
      }

      if (text.length < 100) {
        confidence *= 0.8; // Respuesta muy corta = menos confianza
      }

      if (text.toLowerCase().includes('no encontr') ||
          text.toLowerCase().includes('no disponible') ||
          text.toLowerCase().includes('consulta con')) {
        confidence *= 0.85; // Disclaimer reduce confianza
      }

      const responseTime = Date.now() - startTime;

      return {
        text,
        confidence,
        tokensUsed: response.usage.output_tokens,
        responseTime,
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  /**
   * Detecta gaps en la respuesta (información incompleta)
   */
  detectGap(
    question: string,
    response: string,
    confidence: number
  ): { hasGap: boolean; description?: string } {
    // Gap si confianza baja o respuesta es muy corta o genérica
    if (confidence < 0.7) {
      return {
        hasGap: true,
        description: `Baja confianza en respuesta (${(confidence * 100).toFixed(0)}%)`,
      };
    }

    if (response.length < 150) {
      return {
        hasGap: true,
        description: 'Respuesta incompleta',
      };
    }

    if (response.toLowerCase().includes('no encontr') ||
        response.toLowerCase().includes('no disponible')) {
      return {
        hasGap: true,
        description: 'Información no disponible en documentación',
      };
    }

    return { hasGap: false };
  }

  /**
   * Genera disclaimers automáticos según el dominio y contenido
   */
  generateDisclaimers(domain: BrainDomain, response: string): string[] {
    const disclaimers: string[] = [];

    if (domain === 'nutrition') {
      if (/medicamento|droga|alérgic/i.test(response)) {
        disclaimers.push('Consulta con un nutricionista profesional antes de implementar cambios significativos.');
      }
      if (/embarazo|lactancia|niño/i.test(response)) {
        disclaimers.push('Para embarazo, lactancia o menores, consulta con profesional especializado.');
      }
    }

    if (domain === 'training') {
      if (/dolor|lesión|lesionado/i.test(response)) {
        disclaimers.push('Si tienes dolor o lesión, busca evaluación profesional antes de entrenar.');
      }
    }

    if (domain === 'physiotherapy') {
      if (/dolor|lesión|grave|urgencia/i.test(response)) {
        disclaimers.push('Si el dolor es severo o persiste, busca evaluación profesional urgente.');
      }
    }

    return disclaimers;
  }

  /**
   * Calcula la relevancia de un documento para una pregunta (simple)
   * Fase 2: usar embeddings para mejor relevancia
   */
  calculateRelevance(document: string, question: string): number {
    const docLower = document.toLowerCase();
    const questionLower = question.toLowerCase();

    // Palabras clave de la pregunta
    const keywords = questionLower.split(' ').filter(w => w.length > 3);
    const matchedKeywords = keywords.filter(k => docLower.includes(k));

    // Relevancia simple: porcentaje de palabras clave encontradas
    return keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
  }

  /**
   * Ordena documentos por relevancia
   */
  rankDocuments(
    documents: Array<{ text: string; source: string }>,
    question: string
  ): Array<{ text: string; source: string; relevance: number }> {
    return documents
      .map(doc => ({
        ...doc,
        relevance: this.calculateRelevance(doc.text, question),
      }))
      .sort((a, b) => b.relevance - a.relevance);
  }
}

export function getNotebookLM(): NotebookLMIntegration {
  return new NotebookLMIntegration();
}
