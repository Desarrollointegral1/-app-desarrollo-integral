import { createClient } from '@supabase/supabase-js';
import type {
  Brain,
  BrainDocument,
  BrainQuery,
  BrainDomain,
  BrainConfig,
  BrainMetrics,
} from '../types';

export class BrainFactory {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  /**
   * Crea un nuevo brain
   */
  async createBrain(
    name: string,
    domain: BrainDomain,
    description: string,
    config?: BrainConfig
  ): Promise<Brain> {
    try {
      const brainId = crypto.randomUUID();

      const brain = {
        id: brainId,
        name,
        domain,
        description,
        status: 'ready' as const,
        totalDocuments: 0,
        embeddingsCount: 0,
        queryCount: 0,
        successRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        githubSource: config?.githubPath,
      };

      const { data, error } = await this.supabase
        .from('brains')
        .insert([brain])
        .select();

      if (error) throw error;

      console.log(`✅ Brain creado: ${name} (${domain})`);
      return data[0];
    } catch (error) {
      console.error('Error creating brain:', error);
      throw error;
    }
  }

  /**
   * Obtiene un brain por ID
   */
  async getBrain(brainId: string): Promise<Brain | null> {
    try {
      const { data, error } = await this.supabase
        .from('brains')
        .select('*')
        .eq('id', brainId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching brain:', error);
      return null;
    }
  }

  /**
   * Lista todos los brains
   */
  async listBrains(): Promise<Brain[]> {
    try {
      const { data, error } = await this.supabase
        .from('brains')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error listing brains:', error);
      return [];
    }
  }

  /**
   * Agrega un documento a un brain
   */
  async addDocument(
    brainId: string,
    title: string,
    content: string,
    source: 'user' | 'github' | 'skill' | 'conversation' | 'url',
    sourceUrl?: string
  ): Promise<BrainDocument> {
    try {
      const documentId = crypto.randomUUID();
      const chunks = this.chunkDocument(content);

      const document = {
        id: documentId,
        brainId,
        title,
        content,
        source,
        sourceUrl,
        chunkCount: chunks.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { data, error } = await this.supabase
        .from('brain_documents')
        .insert([document])
        .select();

      if (error) throw error;

      // Generar embeddings (asincrónico, no bloquea)
      this.generateEmbeddings(brainId, documentId, chunks).catch(console.error);

      // Actualizar contador de documentos en el brain
      await this.updateBrainStats(brainId);

      console.log(`✅ Documento agregado: ${title}`);
      return data[0];
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  /**
   * Divide documento en chunks (simple por párrafos)
   */
  private chunkDocument(content: string, chunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    const paragraphs = content.split('\n\n');

    let currentChunk = '';
    for (const para of paragraphs) {
      if ((currentChunk + para).length > chunkSize) {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    return chunks;
  }

  /**
   * Genera embeddings para un documento (simulated, usar Anthropic API en Fase 2)
   */
  private async generateEmbeddings(
    brainId: string,
    documentId: string,
    chunks: string[]
  ): Promise<void> {
    try {
      // MVP: embeddings simples (será reemplazado por Anthropic API)
      const embeddings = chunks.map((chunk, idx) => ({
        id: crypto.randomUUID(),
        brainId,
        documentId,
        chunkIndex: idx,
        chunkText: chunk,
        embedding: Array(1536).fill(0), // Placeholder para vector 1536-dim
      }));

      await this.supabase.from('brain_embeddings').insert(embeddings);
    } catch (error) {
      console.error('Error generating embeddings:', error);
    }
  }

  /**
   * Consulta un brain con IA (Claude + embeddings)
   */
  async queryBrain(brainId: string, question: string): Promise<BrainQuery> {
    try {
      const queryId = crypto.randomUUID();
      const brain = await this.getBrain(brainId);

      if (!brain) throw new Error('Brain not found');

      // 1. Obtener documentos relevantes (búsqueda simple)
      const { data: documents } = await this.supabase
        .from('brain_documents')
        .select('content, title, source')
        .eq('brainId', brainId)
        .limit(5);

      const relevantDocs = documents?.map(d => d.content) || [];

      // 2. Generar respuesta con Claude + contexto
      const { getNotebookLM } = await import('./NotebookLMIntegration');
      const notebookLM = getNotebookLM();

      const startTime = Date.now();
      const aiResponse = await notebookLM.generateResponse(
        question,
        brain.domain,
        relevantDocs
      );
      const responseTime = Date.now() - startTime;

      // 3. Detectar gaps
      const gap = notebookLM.detectGap(question, aiResponse.text, aiResponse.confidence);

      // 4. Si hay gap, agregar a learning queue
      if (gap.hasGap && gap.description) {
        await this.supabase.from('brain_learning_queue').insert({
          brainId,
          gapType: 'missing_doc',
          priority: 3,
          proposedDocSource: `gap_${Date.now()}`,
          status: 'pending',
        });
      }

      // 5. Guardar query en Supabase
      const query = {
        id: queryId,
        brainId,
        query: question,
        response: aiResponse.text,
        retrievedDocuments: relevantDocs.length,
        confidence: aiResponse.confidence,
        hasGap: gap.hasGap,
        gapDescription: gap.description,
        tokensUsed: aiResponse.tokensUsed,
        responseTime: responseTime,
        createdAt: new Date(),
      };

      await this.supabase.from('brain_queries').insert([query]);

      // 6. Actualizar stats
      await this.updateBrainStats(brainId);

      console.log(`✅ Query procesado: ${question.substring(0, 50)}... (${responseTime}ms)`);
      return query;
    } catch (error) {
      console.error('Error querying brain:', error);
      throw error;
    }
  }

  /**
   * Obtiene métricas de un brain
   */
  async getBrainMetrics(brainId: string): Promise<BrainMetrics | null> {
    try {
      const brain = await this.getBrain(brainId);
      if (!brain) return null;

      const { data: queries } = await this.supabase
        .from('brain_queries')
        .select('*')
        .eq('brainId', brainId);

      const successRate =
        queries && queries.length > 0
          ? queries.filter((q) => !q.has_gap).length / queries.length
          : 0;

      return {
        brainId,
        totalQueries: queries?.length || 0,
        queriesPerDay: Math.round((queries?.length || 0) / 7),
        successRate,
        averageConfidence:
          queries && queries.length > 0
            ? queries.reduce((acc, q) => acc + q.confidence, 0) / queries.length
            : 0,
        gapRate: 1 - successRate,
        totalDocuments: brain.totalDocuments,
        totalTokens: 0, // Será calculado
        avgResponseTime: 500, // Placeholder
        p95ResponseTime: 1000, // Placeholder
      };
    } catch (error) {
      console.error('Error getting metrics:', error);
      return null;
    }
  }

  /**
   * Actualiza estadísticas del brain
   */
  private async updateBrainStats(brainId: string): Promise<void> {
    try {
      const { data: documents } = await this.supabase
        .from('brain_documents')
        .select('id')
        .eq('brainId', brainId);

      const { data: queries } = await this.supabase
        .from('brain_queries')
        .select('id, confidence, has_gap')
        .eq('brainId', brainId);

      const successRate =
        queries && queries.length > 0
          ? queries.filter((q) => !q.has_gap).length / queries.length
          : 0;

      await this.supabase
        .from('brains')
        .update({
          totalDocuments: documents?.length || 0,
          queryCount: queries?.length || 0,
          successRate,
          updatedAt: new Date(),
        })
        .eq('id', brainId);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  /**
   * Sincroniza un brain con GitHub
   */
  async syncBrainFromGitHub(
    brainId: string,
    githubPath: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const brain = await this.getBrain(brainId);
      if (!brain) throw new Error('Brain not found');

      // Actualizar estado a syncing
      await this.supabase
        .from('brains')
        .update({ status: 'syncing' })
        .eq('id', brainId);

      // Aquí irá la lógica de GitHub sync (Fase 2)
      console.log(`📡 Sincronizando brain desde GitHub: ${githubPath}`);

      // Por ahora, solo marcar como sincronizado
      await this.supabase
        .from('brains')
        .update({
          status: 'ready',
          lastSyncedAt: new Date(),
          githubSource: githubPath,
        })
        .eq('id', brainId);

      return { success: true, message: 'Brain sincronizado correctamente' };
    } catch (error) {
      console.error('Error syncing brain:', error);
      await this.supabase
        .from('brains')
        .update({ status: 'error' })
        .eq('id', brainId);

      return {
        success: false,
        message: `Error sincronizando: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Auto-captura: agrega contenido de una skill automáticamente
   */
  async captureFromSkill(
    domain: BrainDomain,
    skillName: string,
    content: string,
    context: string
  ): Promise<void> {
    try {
      // Obtener o crear brain para el dominio
      let brains = await this.listBrains();
      let brain = brains.find((b) => b.domain === domain);

      if (!brain) {
        brain = await this.createBrain(
          `Brain - ${domain}`,
          domain,
          `Conocimiento automático del dominio ${domain}`
        );
      }

      // Agregar contenido
      await this.addDocument(brain.id, `Output de ${skillName}`, content, 'skill', undefined);

      console.log(`✅ Contenido capturado de skill "${skillName}" → Brain ${domain}`);
    } catch (error) {
      console.error('Error capturing from skill:', error);
    }
  }
}

// Singleton
let brainFactory: BrainFactory | null = null;

export function getBrainFactory(): BrainFactory {
  if (!brainFactory) {
    brainFactory = new BrainFactory();
  }
  return brainFactory;
}
