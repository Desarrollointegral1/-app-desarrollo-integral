/**
 * ============================================================
 * COALITION AUTHENTICATION & AUTHORIZATION
 * ============================================================
 *
 * Validates que el usuario es propietario de una coalición
 * antes de permitir operaciones (feedback, updates, etc).
 */

import { getSupabaseAgents } from './supabase-agents';

// Timeout helper (duplicado brevemente, será centralizado después)
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]).finally(() => clearTimeout(timeoutHandle));
}

/**
 * Valida que el usuario es propietario de la coalición
 * Retorna true si el usuario es el propietario, false en caso contrario
 */
export async function validateCoalitionOwnership(
  coalitionId: string,
  userId: string
): Promise<boolean> {
  const db = getSupabaseAgents();

  try {
    // Fetch coalition owner from Supabase
    const coalitionData = await withTimeout(
      (async () => {
        // Access the client directly through the methods
        const result = await (db as any).client
          .from('coalition_history')
          .select('user_id')
          .eq('id', coalitionId)
          .single();
        return result;
      })(),
      5000
    );

    const { data, error } = coalitionData as any;

    if (error || !data) {
      // Log security event
      await db.logEvent({
        event_type: 'coalition_auth_failed',
        agent: 'system',
        coalition_id: coalitionId,
        description: `Coalition not found or access denied for user ${userId}`,
        metadata: {
          reason: 'coalition_not_found',
          coalitionId,
          userId,
        },
      });
      return false;
    }

    const isOwner = data.user_id === userId;

    if (!isOwner) {
      // Log security event for failed auth
      await db.logEvent({
        event_type: 'coalition_auth_failed',
        agent: 'system',
        coalition_id: coalitionId,
        description: `Unauthorized access attempt: user ${userId} is not owner`,
        metadata: {
          reason: 'not_owner',
          coalitionId,
          userId,
          actualOwner: data.user_id,
        },
      });
    }

    return isOwner;
  } catch (error) {
    // Log error event
    await db.logEvent({
      event_type: 'coalition_auth_error',
      agent: 'system',
      coalition_id: coalitionId,
      description: `Error validating coalition ownership: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: {
        coalitionId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return false;
  }
}
