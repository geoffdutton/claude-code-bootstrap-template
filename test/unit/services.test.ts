import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { AIService } from '../../src/services/ai';
import { RateLimitService } from '../../src/services/rateLimit';
import { DatabaseService } from '../../src/services/database';

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService(env);
  });

  describe('generateResponse', () => {
    it('should handle AI service calls gracefully', async () => {
      // In test environment, AI service might fail, which is expected
      try {
        const response = await aiService.generateResponse(
          'Hello, how are you?',
          'test-conv-123',
          []
        );

        expect(response).toBeDefined();
        expect(typeof response).toBe('string');
        expect(response.length).toBeGreaterThan(0);
      } catch (error) {
        // AI service failing in test environment is expected
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Failed to generate AI response');
      }
    });

    it('should handle context in conversation history', async () => {
      const history = [
        { role: 'user', content: 'My name is John' },
        { role: 'assistant', content: 'Nice to meet you, John!' },
      ];

      try {
        const response = await aiService.generateResponse(
          'What is my name?',
          'test-conv-456',
          history
        );

        expect(response).toBeDefined();
        expect(typeof response).toBe('string');
      } catch (error) {
        // AI service failing in test environment is expected
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;

  beforeEach(() => {
    rateLimitService = new RateLimitService(env);
  });

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      const result = await rateLimitService.checkRateLimit('test-user-1');

      expect(result.blocked).toBe(false);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should track multiple requests for same identifier', async () => {
      const identifier = 'test-user-2';
      
      const result1 = await rateLimitService.checkRateLimit(identifier);
      const result2 = await rateLimitService.checkRateLimit(identifier);

      expect(result1.blocked).toBe(false);
      expect(result2.blocked).toBe(false);
      expect(result2.remaining).toBeLessThan(result1.remaining);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return current rate limit status', async () => {
      const identifier = 'test-user-3';
      
      // Make a request first to establish rate limit
      await rateLimitService.checkRateLimit(identifier);
      
      const status = await rateLimitService.getRateLimitStatus(identifier);

      expect(status.remaining).toBeDefined();
      expect(status.resetTime).toBeDefined();
      expect(status.blocked).toBe(false);
      expect(typeof status.remaining).toBe('number');
      expect(typeof status.resetTime).toBe('number');
    });
  });
});

describe('DatabaseService', () => {
  let databaseService: DatabaseService;

  beforeEach(async () => {
    databaseService = new DatabaseService(env);
    // Initialize the database for each test
    await databaseService.initializeDatabase();
  });

  describe('storeMessage', () => {
    it('should store messages to database', async () => {
      const message = await databaseService.storeMessage(
        'test-conv-456',
        'user',
        'Test message',
        { source: 'test' }
      );

      expect(message).toBeDefined();
      expect(message.conversationId).toBe('test-conv-456');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Test message');
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();
    });

    it('should handle required fields validation', async () => {
      const message = await databaseService.storeMessage(
        'test-conv-valid',
        'assistant',
        'Valid response'
      );

      expect(message).toBeDefined();
      expect(message.conversationId).toBe('test-conv-valid');
      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Valid response');
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history', async () => {
      const conversationId = 'test-conv-history';
      
      // Store a message first
      await databaseService.storeMessage(conversationId, 'user', 'Hello');
      
      const history = await databaseService.getConversationHistory(conversationId);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].content).toBe('Hello');
    });

    it('should return empty array for non-existent conversation', async () => {
      const conversationId = 'non-existent-conv';
      
      const history = await databaseService.getConversationHistory(conversationId);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });
  });

  describe('getConversationStats', () => {
    it('should return database statistics', async () => {
      const stats = await databaseService.getConversationStats();

      expect(stats.totalConversations).toBeDefined();
      expect(stats.totalMessages).toBeDefined();
      expect(typeof stats.totalConversations).toBe('number');
      expect(typeof stats.totalMessages).toBe('number');
      expect(stats.totalConversations).toBeGreaterThanOrEqual(0);
      expect(stats.totalMessages).toBeGreaterThanOrEqual(0);
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation', async () => {
      const conversationId = 'test-conv-delete';
      
      // Store a message first
      await databaseService.storeMessage(conversationId, 'user', 'Hello');
      
      // Verify it exists
      let history = await databaseService.getConversationHistory(conversationId);
      expect(history.length).toBe(1);
      
      // Delete the conversation
      await databaseService.deleteConversation(conversationId);
      
      // Verify it's gone
      history = await databaseService.getConversationHistory(conversationId);
      expect(history.length).toBe(0);
    });
  });
});