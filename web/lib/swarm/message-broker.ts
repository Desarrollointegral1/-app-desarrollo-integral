import { getCentralMemory } from '../central-memory';
import { SwarmMessage } from '@/app/api/orchestrator/swarm-types';

export interface MessageBroker {
  // Publish message to channel
  publish(channel: string, message: SwarmMessage): Promise<void>;

  // Subscribe to channel
  subscribe(
    channel: string,
    callback: (message: SwarmMessage) => void
  ): Promise<string>; // Returns subscription ID

  // Unsubscribe from channel
  unsubscribe(subscriptionId: string): Promise<void>;

  // Get pending messages for a channel
  getPendingMessages(channel: string): Promise<SwarmMessage[]>;

  // Mark message as processed
  markAsProcessed(messageId: string): Promise<void>;

  // Close connection
  close(): Promise<void>;
}

/**
 * Supabase-based message broker (fallback)
 * Uses shared_context table for message storage
 */
export class SupabaseMessageBroker implements MessageBroker {
  private centralMemory = getCentralMemory();
  private subscriptions: Map<string, (msg: SwarmMessage) => void> = new Map();
  private subscriptionId = 0;
  private pollIntervals: Map<string, NodeJS.Timeout> = new Map();

  async publish(channel: string, message: SwarmMessage): Promise<void> {
    try {
      const messageKey = `message:${channel}:${message.id}`;
      await this.centralMemory.setContext(messageKey, {
        ...message,
        processed: false,
        retries: 0,
        createdAt: new Date().toISOString(),
      });

      // Trigger immediate polling for subscribers
      this.notifySubscribers(channel, message);
    } catch (error) {
      console.error(`Failed to publish message to ${channel}:`, error);
      throw error;
    }
  }

  async subscribe(
    channel: string,
    callback: (message: SwarmMessage) => void
  ): Promise<string> {
    const subId = `sub-${++this.subscriptionId}`;
    this.subscriptions.set(subId, callback);

    // Start polling for messages
    const interval = setInterval(async () => {
      try {
        const messages = await this.getPendingMessages(channel);
        messages.forEach((msg) => {
          callback(msg);
          this.markAsProcessed(msg.id).catch((err) =>
            console.warn('Failed to mark message as processed:', err)
          );
        });
      } catch (error) {
        console.warn(`Polling error for channel ${channel}:`, error);
      }
    }, 1000); // Poll every 1 second

    this.pollIntervals.set(subId, interval);

    return subId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    this.subscriptions.delete(subscriptionId);

    const interval = this.pollIntervals.get(subscriptionId);
    if (interval) {
      clearInterval(interval);
      this.pollIntervals.delete(subscriptionId);
    }
  }

  async getPendingMessages(channel: string): Promise<SwarmMessage[]> {
    try {
      const messagesKey = `messages:${channel}`;
      const messages = (await this.centralMemory.getContext(
        messagesKey
      )) as SwarmMessage[];

      if (!Array.isArray(messages)) return [];

      return messages.filter((msg) => {
        const msgWithProcessed = msg as SwarmMessage & { processed?: boolean };
        return !msgWithProcessed.processed;
      });
    } catch (error) {
      console.warn(`Failed to get pending messages for ${channel}:`, error);
      return [];
    }
  }

  async markAsProcessed(messageId: string): Promise<void> {
    try {
      const messageKey = `message:${messageId}`;
      const message = (await this.centralMemory.getContext(
        messageKey
      )) as SwarmMessage & { processed?: boolean };
      if (message) {
        message.processed = true;
        await this.centralMemory.setContext(messageKey, message);
      }
    } catch (error) {
      console.warn(`Failed to mark message ${messageId} as processed:`, error);
    }
  }

  async close(): Promise<void> {
    // Clear all polling intervals
    this.pollIntervals.forEach((interval) => clearInterval(interval));
    this.pollIntervals.clear();
    this.subscriptions.clear();
  }

  private notifySubscribers(
    channel: string,
    message: SwarmMessage
  ): void {
    this.subscriptions.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in message subscriber callback:', error);
      }
    });
  }
}

/**
 * Redis-based message broker (if available)
 * Falls back to Supabase if Redis is not available
 */
export class RedisMessageBroker implements MessageBroker {
  private client: unknown = null; // redis.Redis (optional)
  private subscriptions: Map<string, (msg: SwarmMessage) => void> = new Map();
  private subscriptionId = 0;

  constructor(redisUrl?: string) {
    // Note: Requires redis package to be installed
    // For now, this is a placeholder
    console.warn(
      'RedisMessageBroker: Redis support requires additional setup'
    );
  }

  async publish(channel: string, message: SwarmMessage): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const client = this.client as { publish: (ch: string, msg: string) => Promise<void> };
      await client.publish(channel, JSON.stringify(message));
    } catch (error) {
      console.error(`Failed to publish message to ${channel}:`, error);
      throw error;
    }
  }

  async subscribe(
    channel: string,
    callback: (message: SwarmMessage) => void
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    const subId = `sub-${++this.subscriptionId}`;
    this.subscriptions.set(subId, callback);

    try {
      const client = this.client as { subscribe: (ch: string, cb: (msg: string) => void) => Promise<void> };
      await client.subscribe(channel, (message: string) => {
        try {
          const parsed = JSON.parse(message);
          callback(parsed);
        } catch (error) {
          console.error('Failed to parse Redis message:', error);
        }
      });
    } catch (error) {
      console.error(`Failed to subscribe to ${channel}:`, error);
      throw error;
    }

    return subId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    this.subscriptions.delete(subscriptionId);

    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const client = this.client as { unsubscribe: () => Promise<void> };
      await client.unsubscribe();
    } catch (error) {
      console.warn('Failed to unsubscribe from Redis:', error);
    }
  }

  async getPendingMessages(channel: string): Promise<SwarmMessage[]> {
    // Redis doesn't store messages, only broadcast
    // Messages in flight would need to be tracked separately
    return [];
  }

  async markAsProcessed(messageId: string): Promise<void> {
    // Redis pub/sub doesn't persist messages
    // No need to mark as processed
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        const client = this.client as { quit: () => Promise<void> };
        await client.quit();
      } catch (error) {
        console.warn('Failed to close Redis connection:', error);
      }
    }
    this.subscriptions.clear();
  }
}

/**
 * Factory function to create appropriate message broker
 */
export async function createMessageBroker(
  prefer: 'redis' | 'supabase' = 'supabase'
): Promise<MessageBroker> {
  if (prefer === 'redis') {
    try {
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        return new RedisMessageBroker(redisUrl);
      }
    } catch (error) {
      console.warn('Redis not available, falling back to Supabase:', error);
    }
  }

  // Default to Supabase
  return new SupabaseMessageBroker();
}

// Singleton instance
let brokerInstance: MessageBroker | null = null;

export async function getMessageBroker(): Promise<MessageBroker> {
  if (!brokerInstance) {
    brokerInstance = await createMessageBroker();
  }
  return brokerInstance;
}

export async function resetMessageBroker(): Promise<void> {
  if (brokerInstance) {
    await brokerInstance.close();
    brokerInstance = null;
  }
}
