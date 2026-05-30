/**
 * ============================================================
 * PEER EVALUATION CACHE — Cache en memoria con TTL
 * ============================================================
 *
 * Cachea scores de evaluación de peers basado en hash SHA256
 * del output del agente. Evita re-evaluar el mismo contenido
 * múltiples veces si el agente produce idéntico output.
 *
 * TTL: 5 segundos (si el agente genera output idéntico en 5s,
 * reutilizamos el score; después de 5s, re-evaluamos)
 */

import crypto from 'crypto';

interface CacheEntry {
  score: number;
  timestamp: number;
}

const PEER_EVAL_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5000; // 5 segundos
const CLEANUP_INTERVAL_MS = 30000; // Limpiar cada 30 segundos

let cleanupIntervalHandle: NodeJS.Timeout | null = null;

/**
 * Genera un hash SHA256 del output del agente
 */
export function hashAgentOutput(output: string): string {
  return crypto.createHash('sha256').update(output).digest('hex');
}

/**
 * Obtiene el score cacheado si existe y no ha expirado
 */
export function getCachedPeerEvalScore(agentOutput: string): number | null {
  const hash = hashAgentOutput(agentOutput);
  const cached = PEER_EVAL_CACHE.get(hash);

  if (!cached) return null;

  // Verificar TTL
  const ageMs = Date.now() - cached.timestamp;
  if (ageMs > CACHE_TTL_MS) {
    PEER_EVAL_CACHE.delete(hash);
    return null;
  }

  return cached.score;
}

/**
 * Guarda un score en el caché
 */
export function cachePeerEvalScore(agentOutput: string, score: number): void {
  const hash = hashAgentOutput(agentOutput);
  PEER_EVAL_CACHE.set(hash, {
    score,
    timestamp: Date.now(),
  });

  // Iniciar cleanup si no está corriendo
  if (!cleanupIntervalHandle) {
    startCleanupInterval();
  }
}

/**
 * Limpia entradas expiradas del caché
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [hash, entry] of PEER_EVAL_CACHE) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      PEER_EVAL_CACHE.delete(hash);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[PeerEvalCache] Limpiadas ${cleaned} entradas expiradas (${PEER_EVAL_CACHE.size} activas)`);
  }
}

/**
 * Inicia el intervalo de limpieza automático
 */
function startCleanupInterval(): void {
  cleanupIntervalHandle = setInterval(() => {
    cleanupExpiredEntries();

    // Detener el intervalo si el caché está vacío
    if (PEER_EVAL_CACHE.size === 0) {
      if (cleanupIntervalHandle) {
        clearInterval(cleanupIntervalHandle);
        cleanupIntervalHandle = null;
      }
    }
  }, CLEANUP_INTERVAL_MS);

  cleanupIntervalHandle!.unref(); // No bloquear salida del proceso
}

/**
 * Obtiene estadísticas del caché
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ hash: string; ageMs: number; score: number }>;
} {
  const now = Date.now();
  const entries = Array.from(PEER_EVAL_CACHE.entries()).map(([hash, entry]) => ({
    hash: hash.slice(0, 8) + '...', // Mostrar solo primeros 8 caracteres
    ageMs: now - entry.timestamp,
    score: entry.score,
  }));

  return {
    size: PEER_EVAL_CACHE.size,
    entries,
  };
}

/**
 * Limpia todo el caché (útil para testing o reset)
 */
export function clearCache(): void {
  const size = PEER_EVAL_CACHE.size;
  PEER_EVAL_CACHE.clear();

  if (cleanupIntervalHandle) {
    clearInterval(cleanupIntervalHandle);
    cleanupIntervalHandle = null;
  }

  if (size > 0) {
    console.log(`[PeerEvalCache] Caché limpiado (${size} entradas removidas)`);
  }
}
