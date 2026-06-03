import type { GitHubSyncResult, Brain } from '../types';
import { getBrainFactory } from '../core/BrainFactory';

/**
 * Sincroniza documentación desde GitHub automáticamente
 * Monitorea archivos en la carpeta /docs de GitHub
 */
export class GitHubSync {
  private static GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || 'Desarrollointegral1';
  private static GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || '-app-desarrollo-integral';
  private static GITHUB_BRANCH = 'main';
  private static DOCS_PATH = 'web/docs';

  /**
   * Sincroniza todos los brains con sus correspondientes archivos en GitHub
   */
  static async syncAllBrains(): Promise<void> {
    const factory = getBrainFactory();
    const brains = await factory.listBrains();

    console.log(`📡 Iniciando sincronización de ${brains.length} brains con GitHub...`);

    for (const brain of brains) {
      await this.syncBrain(brain);
    }

    console.log('✅ Sincronización completada');
  }

  /**
   * Sincroniza un brain específico con GitHub
   */
  static async syncBrain(brain: Brain): Promise<GitHubSyncResult> {
    const factory = getBrainFactory();

    try {
      const domainFiles: Record<string, string> = {
        nutrition: `${this.DOCS_PATH}/nutrition.md`,
        training: `${this.DOCS_PATH}/training.md`,
        physiotherapy: `${this.DOCS_PATH}/physiotherapy.md`,
        development: `${this.DOCS_PATH}/development-integral.md`,
      };

      const filePath = domainFiles[brain.domain];
      if (!filePath) {
        return {
          status: 'error',
          documentsAdded: 0,
          documentsUpdated: 0,
          documentsDeleted: 0,
          timestamp: new Date(),
          error: `No file mapping for domain ${brain.domain}`,
        };
      }

      // Obtener contenido del archivo desde GitHub
      const content = await this.fetchGitHubFile(filePath);
      if (!content) {
        return {
          status: 'error',
          documentsAdded: 0,
          documentsUpdated: 0,
          documentsDeleted: 0,
          timestamp: new Date(),
          error: `Could not fetch file from GitHub: ${filePath}`,
        };
      }

      // Agregar como documento al brain
      await factory.addDocument(
        brain.id,
        `${brain.domain} Documentation`,
        content,
        'github',
        `https://github.com/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/blob/${this.GITHUB_BRANCH}/${filePath}`
      );

      return {
        status: 'success',
        documentsAdded: 1,
        documentsUpdated: 0,
        documentsDeleted: 0,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`Error syncing brain ${brain.id}:`, error);
      return {
        status: 'error',
        documentsAdded: 0,
        documentsUpdated: 0,
        documentsDeleted: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtiene un archivo desde GitHub usando la API
   */
  private static async fetchGitHubFile(filePath: string): Promise<string | null> {
    try {
      const url = `https://api.github.com/repos/${this.GITHUB_OWNER}/${this.GITHUB_REPO}/contents/${filePath}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN || ''}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      });

      if (!response.ok) {
        console.warn(`GitHub API error: ${response.status} ${response.statusText}`);
        return null;
      }

      return await response.text();
    } catch (error) {
      console.error(`Error fetching GitHub file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Configura sincronización automática cada N horas
   */
  static async setupAutoSync(intervalHours: number = 6): Promise<NodeJS.Timeout> {
    console.log(`⏰ Configurando auto-sync de GitHub cada ${intervalHours} horas...`);

    // Sincronizar inmediatamente
    await this.syncAllBrains();

    // Luego cada N horas
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const timer = setInterval(() => {
      this.syncAllBrains().catch(console.error);
    }, intervalMs);

    return timer;
  }

  /**
   * Detecta cambios en GitHub comparando con la última sincronización
   * (Fase 2: integración con webhooks)
   */
  static async detectChanges(brainId: string): Promise<boolean> {
    // TODO: Implementar webhooks de GitHub
    // Por ahora, asumir que hay cambios si lastSyncedAt fue hace más de 6 horas
    return true;
  }
}

// Auto-sync en el servidor (opcional - se ejecuta una sola vez)
let syncTimer: NodeJS.Timeout | null = null;

export async function initializeGitHubSync(): Promise<void> {
  if (syncTimer) return; // Ya inicializado
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 GitHub sync inicializado (desarrollo)');
    syncTimer = await GitHubSync.setupAutoSync(1); // Cada 1 hora en dev
  } else {
    console.log('🔄 GitHub sync inicializado (producción)');
    syncTimer = await GitHubSync.setupAutoSync(6); // Cada 6 horas en prod
  }
}

export function stopGitHubSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('⛔ GitHub sync detenido');
  }
}
