import type { Environment, ConversationMessage } from '../types';
import { generateId, getCurrentTimestamp, logWithLevel } from '../utils/helpers';

export class DatabaseService {
  private readonly db: D1Database;
  private readonly maxHistoryLength: number;

  constructor(env: Environment) {
    this.db = env.DB;
    this.maxHistoryLength = parseInt(env.MAX_CONVERSATION_HISTORY, 10) || 50;
  }

  async initializeDatabase(): Promise<void> {
    try {
      // Create conversations table if it doesn't exist
      await this.db
        .prepare(
          `CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`
        )
        .run();

      // Create index for efficient conversation retrieval
      await this.db
        .prepare(
          `CREATE INDEX IF NOT EXISTS idx_conversation_id_timestamp 
           ON conversations(conversation_id, timestamp DESC)`
        )
        .run();

      logWithLevel('info', 'Database initialized successfully');
    } catch (error) {
      logWithLevel('error', 'Failed to initialize database', { error });
      throw new Error('Database initialization failed');
    }
  }

  async storeMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<ConversationMessage> {
    const message: ConversationMessage = {
      id: generateId(),
      conversationId,
      role,
      content,
      timestamp: getCurrentTimestamp(),
    };

    if (metadata) {
      message.metadata = metadata;
    }

    try {
      await this.db
        .prepare(
          `INSERT INTO conversations (id, conversation_id, role, content, timestamp, metadata)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(
          message.id,
          message.conversationId,
          message.role,
          message.content,
          message.timestamp,
          metadata ? JSON.stringify(metadata) : null
        )
        .run();

      // Clean up old messages if conversation is getting too long
      await this.cleanupConversation(conversationId);

      logWithLevel('debug', 'Message stored', {
        conversationId,
        messageId: message.id,
        role,
      });

      return message;
    } catch (error) {
      logWithLevel('error', 'Failed to store message', { error, conversationId, role });
      throw new Error('Failed to store conversation message');
    }
  }

  async getConversationHistory(conversationId: string): Promise<ConversationMessage[]> {
    try {
      const { results } = await this.db
        .prepare(
          `SELECT id, conversation_id, role, content, timestamp, metadata
           FROM conversations
           WHERE conversation_id = ?
           ORDER BY timestamp ASC
           LIMIT ?`
        )
        .bind(conversationId, this.maxHistoryLength)
        .all();

      const messages: ConversationMessage[] = results.map(row => {
        const message: ConversationMessage = {
          id: row.id as string,
          conversationId: row.conversation_id as string,
          role: row.role as 'user' | 'assistant',
          content: row.content as string,
          timestamp: row.timestamp as string,
        };

        if (row.metadata) {
          message.metadata = JSON.parse(row.metadata as string) as Record<string, unknown>;
        }

        return message;
      });

      logWithLevel('debug', 'Retrieved conversation history', {
        conversationId,
        messageCount: messages.length,
      });

      return messages;
    } catch (error) {
      logWithLevel('error', 'Failed to get conversation history', { error, conversationId });
      return [];
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await this.db
        .prepare('DELETE FROM conversations WHERE conversation_id = ?')
        .bind(conversationId)
        .run();

      logWithLevel('info', 'Conversation deleted', { conversationId });
    } catch (error) {
      logWithLevel('error', 'Failed to delete conversation', { error, conversationId });
      throw new Error('Failed to delete conversation');
    }
  }

  private async cleanupConversation(conversationId: string): Promise<void> {
    try {
      // Keep only the most recent messages
      await this.db
        .prepare(
          `DELETE FROM conversations
           WHERE conversation_id = ?
           AND id NOT IN (
             SELECT id FROM conversations
             WHERE conversation_id = ?
             ORDER BY timestamp DESC
             LIMIT ?
           )`
        )
        .bind(conversationId, conversationId, this.maxHistoryLength)
        .run();
    } catch (error) {
      logWithLevel('warn', 'Failed to cleanup old messages', { error, conversationId });
      // Non-critical error, don't throw
    }
  }

  async getConversationStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
  }> {
    try {
      const conversationsResult = await this.db
        .prepare('SELECT COUNT(DISTINCT conversation_id) as count FROM conversations')
        .first();

      const messagesResult = await this.db
        .prepare('SELECT COUNT(*) as count FROM conversations')
        .first();

      return {
        totalConversations: (conversationsResult?.count as number) || 0,
        totalMessages: (messagesResult?.count as number) || 0,
      };
    } catch (error) {
      logWithLevel('error', 'Failed to get conversation stats', { error });
      return { totalConversations: 0, totalMessages: 0 };
    }
  }
}
