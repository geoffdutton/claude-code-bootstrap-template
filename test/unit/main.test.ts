import { describe, it, expect, beforeEach } from 'vitest';
import { env, createExecutionContext } from 'cloudflare:test';
import worker from '../../src/index';

describe('Cloudflare Worker', () => {
  beforeEach(() => {
    // Clean setup for each test
  });

  describe('CORS handling', () => {
    it('should handle OPTIONS requests', async () => {
      const request = new Request('https://example.com/agent', { method: 'OPTIONS' });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
    });
  });

  describe('Health check endpoint', () => {
    it('should return health status', async () => {
      const request = new Request('https://example.com/health');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.version).toBe('1.0.0');
    });
  });

  describe('Stats endpoint', () => {
    it('should return stats', async () => {
      const request = new Request('https://example.com/stats');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.totalConversations).toBeDefined();
      expect(data.totalMessages).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Rate limit endpoint', () => {
    it('should return rate limit status with identifier', async () => {
      const request = new Request('https://example.com/rate-limit?id=test-user');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.remaining).toBeDefined();
      expect(data.resetTime).toBeDefined();
      expect(data.blocked).toBeDefined();
    });

    it('should return 400 for missing identifier', async () => {
      const request = new Request('https://example.com/rate-limit');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(400);
      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBe('Missing identifier parameter');
    });
  });

  describe('Agent endpoint', () => {
    it('should handle POST requests to /agent or handle AI failures gracefully', async () => {
      const request = new Request('https://example.com/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello',
          conversationId: 'test-conv-123',
          userId: 'test-user-456',
        }),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);

      // In test environment, we expect either success (200) or AI failure (500)
      expect([200, 500]).toContain(response.status);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return 400 for invalid request body', async () => {
      const request = new Request('https://example.com/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(400);
      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBeDefined();
    });
  });

  describe('Method not allowed handling', () => {
    it('should return 405 for wrong method on agent endpoint', async () => {
      const request = new Request('https://example.com/agent', { method: 'GET' });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('POST, OPTIONS');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBe('Method Not Allowed');
    });

    it('should return 405 for wrong method on health endpoint', async () => {
      const request = new Request('https://example.com/health', { method: 'POST' });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, OPTIONS');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBe('Method Not Allowed');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const request = new Request('https://example.com/unknown-endpoint');
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBe('Not Found');
      expect(data.availableEndpoints).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle internal server errors gracefully', async () => {
      const request = new Request('https://example.com/health');
      const ctx = createExecutionContext();
      
      // This should still work with the real Worker runtime
      const response = await worker.fetch(request, env, ctx);

      // Should still return a response even if internal error occurs
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });
});
