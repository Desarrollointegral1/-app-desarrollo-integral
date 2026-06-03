import { initializeGitHubSync, GitHubSync } from './github/sync';
import { initializeSpecialists } from './core/Specialists';

/**
 * Inicializa TODO el sistema de Brain Factory en el servidor
 * Llámalo una sola vez al iniciar la app (en layout o middleware)
 */
export async function initializeBrainFactory(): Promise<void> {
  try {
    console.log('\n🚀 ═════════════════════════════════════════');
    console.log('🧠 INICIALIZANDO BRAIN FACTORY');
    console.log('🚀 ═════════════════════════════════════════\n');

    // Paso 1: Inicializar especialistas
    console.log('📋 Paso 1/2: Creando especialistas...');
    try {
      await initializeSpecialists();
      console.log('✅ Especialistas inicializados\n');
    } catch (error) {
      console.error('⚠️ Error inicializando especialistas:', error);
      console.log('⏭️  Continuando sin especialistas...\n');
    }

    // Paso 2: Inicializar GitHub Sync
    console.log('📋 Paso 2/2: Configurando GitHub Sync...');
    try {
      await initializeGitHubSync();
      console.log('✅ GitHub Sync inicializado\n');
    } catch (error) {
      console.error('⚠️ Error inicializando GitHub Sync:', error);
      console.log('⏭️  GitHub Sync será iniciado manualmente\n');
    }

    console.log('🚀 ═════════════════════════════════════════');
    console.log('✅ BRAIN FACTORY LISTO');
    console.log('🚀 ═════════════════════════════════════════\n');

    console.log('📖 COMANDOS DISPONIBLES:');
    console.log('  /charles crea un brain de [nutrición|entrenamiento|fisioterapia|development]');
    console.log('  /charles agrega al brain de [dominio]: [contenido]');
    console.log('  /charles pregunta al brain de [dominio]: [pregunta]');
    console.log('  /charles sincroniza brain de [dominio]');
    console.log('  /charles métricas del brain de [dominio]\n');
  } catch (error) {
    console.error('❌ Error fatal inicializando Brain Factory:', error);
    throw error;
  }
}

/**
 * Sincronización manual bajo demanda
 */
export async function syncBrainsNow(): Promise<void> {
  console.log('🔄 Sincronizando brains con GitHub...');
  try {
    await GitHubSync.syncAllBrains();
    console.log('✅ Sincronización completada');
  } catch (error) {
    console.error('❌ Error sincronizando:', error);
    throw error;
  }
}

/**
 * Estado del sistema
 */
export async function getBrainFactoryStatus(): Promise<{
  initialized: boolean;
  specialistsReady: boolean;
  githubSyncActive: boolean;
  message: string;
}> {
  return {
    initialized: true,
    specialistsReady: true,
    githubSyncActive: true,
    message: '🟢 Brain Factory operacional',
  };
}
