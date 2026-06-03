import type { BrainDomain } from '../types';
import { getBrainFactory } from './BrainFactory';

/**
 * Sistema de Auto-Captura Avanzada
 * Detecta automáticamente cuándo guardar contenido en brains
 * Funciona con skills, conversaciones y resultados
 */
export class SkillCapture {
  /**
   * Detecta el dominio basado en keywords de la tarea
   */
  static detectDomain(skillName: string, taskDescription: string): BrainDomain | null {
    const combined = `${skillName} ${taskDescription}`.toLowerCase();

    // Palabras clave por dominio
    const domainKeywords: Record<BrainDomain, string[]> = {
      nutrition: [
        'nutrición', 'proteína', 'carbohidrato', 'grasa', 'dieta', 'alimentación',
        'calórico', 'macronutriente', 'micronutriente', 'suplemento', 'vitamina',
        'mineral', 'comida', 'alimento', 'nutriente', 'calorías', 'proteína',
      ],
      training: [
        'entrenamiento', 'ejercicio', 'fuerza', 'musculo', 'periódización',
        'programa', 'serie', 'repetición', 'peso', 'técnica', 'levantamiento',
        'cross fit', 'condición física', 'fitness', 'deportista', 'atleta',
      ],
      physiotherapy: [
        'fisioterapia', 'lesión', 'rehabilitación', 'dolor', 'movimiento',
        'movilidad', 'estiramiento', 'ejercicio terapéutico', 'fisio',
        'recuperación', 'terapia', 'articulación', 'músculo', 'rango',
      ],
      development: [
        'desarrollo integral', 'centro', 'gimnasio', 'entrenador',
        'profesional', 'membresía', 'clase', 'servicio', 'ubicación',
        'horario', 'staff', 'equipo', 'belgrano', 'buenos aires',
      ],
    };

    // Contar keywords por dominio
    let maxScore = 0;
    let detectedDomain: BrainDomain | null = null;

    for (const [domain, keywords] of Object.entries(domainKeywords) as Array<[BrainDomain, string[]]>) {
      const score = keywords.filter(k => combined.includes(k)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedDomain = domain;
      }
    }

    // Solo devolver dominio si hay al menos 2 keywords (mínimo 2 para evitar falsos positivos)
    return maxScore >= 2 ? detectedDomain : null;
  }

  /**
   * Captura automáticamente contenido de un skill
   * Se llama después de que un skill termina
   */
  static async captureFromSkill(
    skillName: string,
    taskDescription: string,
    skillOutput: string,
    metadata?: {
      timestamp?: Date;
      context?: string;
      sourceUrl?: string;
    }
  ): Promise<void> {
    try {
      // 1. Detectar dominio
      const domain = this.detectDomain(skillName, taskDescription);
      if (!domain) {
        console.log(`⏭️  Skill "${skillName}" no pertenece a ningún dominio específico`);
        return;
      }

      // 2. Obtener o crear brain para el dominio
      const factory = getBrainFactory();
      let brains = await factory.listBrains();
      let brain = brains.find((b) => b.domain === domain);

      if (!brain) {
        console.log(`📊 Creando brain para dominio: ${domain}`);
        brain = await factory.createBrain(
          `Brain - ${domain}`,
          domain,
          `Conocimiento automático del dominio ${domain}`,
          {
            autoSync: true,
            syncInterval: 360, // 6 horas
          }
        );
      }

      // 3. Procesar el contenido para hacerlo más limpio
      const cleanedContent = this.cleanContent(skillOutput);

      // 4. Crear título descriptivo
      const title = `Output: ${skillName} - ${new Date().toLocaleDateString()}`;

      // 5. Agregar documento al brain
      await factory.addDocument(
        brain.id,
        title,
        cleanedContent,
        'skill',
        metadata?.sourceUrl
      );

      console.log(`✅ Contenido capturado del skill "${skillName}" → Brain ${domain}`);
      console.log(`   Dominio detectado: ${domain}`);
      console.log(`   Brain ID: ${brain.id}`);
    } catch (error) {
      console.error('Error capturando skill:', error);
      // No lanzar error, solo loguear - auto-captura no debe bloquear
    }
  }

  /**
   * Captura automáticamente contenido de conversaciones
   * Se llama después de interacciones importantes
   */
  static async captureFromConversation(
    topic: string,
    conversation: string,
    insights: string
  ): Promise<void> {
    try {
      const domain = this.detectDomain(topic, conversation);
      if (!domain) return;

      const factory = getBrainFactory();
      let brains = await factory.listBrains();
      let brain = brains.find((b) => b.domain === domain);

      if (!brain) {
        brain = await factory.createBrain(
          `Brain - ${domain}`,
          domain,
          `Conocimiento del dominio ${domain}`
        );
      }

      await factory.addDocument(
        brain.id,
        `Conversación: ${topic}`,
        insights,
        'conversation'
      );

      console.log(`✅ Insights capturados de conversación → Brain ${domain}`);
    } catch (error) {
      console.error('Error capturando conversación:', error);
    }
  }

  /**
   * Limpia el contenido para hacerlo más utilizable
   */
  private static cleanContent(content: string): string {
    // Remover líneas en blanco excesivas
    let cleaned = content.replace(/\n{3,}/g, '\n\n');

    // Remover ciertos prefijos comunes
    cleaned = cleaned.replace(/^```[\w]*\n/gm, '');
    cleaned = cleaned.replace(/\n```$/gm, '');

    // Remover metadatos de ejecución (típico en outputs de code)
    cleaned = cleaned.replace(/^>\s.*$/gm, '');

    // Limpiar espacios al inicio/final
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Detecta cambios importantes en documentación
   * Usado para actualizar brains con información nueva
   */
  static async captureFromDocumentChange(
    fileOrUrl: string,
    oldContent: string,
    newContent: string
  ): Promise<void> {
    try {
      // Detectar dominio del archivo
      const domain = this.detectDomain(fileOrUrl, newContent);
      if (!domain) return;

      // Encontrar diferencias significativas
      const diff = this.calculateDiff(oldContent, newContent);
      if (diff.addedLines < 50) {
        // Cambio muy pequeño, ignorar
        return;
      }

      const factory = getBrainFactory();
      let brains = await factory.listBrains();
      let brain = brains.find((b) => b.domain === domain);

      if (!brain) {
        brain = await factory.createBrain(
          `Brain - ${domain}`,
          domain,
          `Conocimiento del dominio ${domain}`
        );
      }

      // Capturar solo las líneas nuevas/modificadas
      await factory.addDocument(
        brain.id,
        `Actualización: ${fileOrUrl}`,
        newContent,
        'url',
        fileOrUrl
      );

      console.log(`✅ Documento actualizado capturado → Brain ${domain}`);
    } catch (error) {
      console.error('Error capturando cambio de documento:', error);
    }
  }

  /**
   * Calcula diferencias simples entre contenido
   */
  private static calculateDiff(
    oldContent: string,
    newContent: string
  ): { addedLines: number; removedLines: number } {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    // Cálculo simple: diferencia de líneas
    const addedLines = Math.max(0, newLines.length - oldLines.length);
    const removedLines = Math.max(0, oldLines.length - newLines.length);

    return { addedLines, removedLines };
  }
}

// Exportar función helper para usar en otros lugares
export async function autoCaptureSkillOutput(
  skillName: string,
  taskDescription: string,
  output: string
): Promise<void> {
  return SkillCapture.captureFromSkill(skillName, taskDescription, output);
}
