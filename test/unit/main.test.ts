import { describe, it, expect, vi } from 'vitest';

import worker from '../../src/index';
import { createMockEnvironment, createMockRequest } from '../helpers/mocks';

describe('Main Worker Handler', () => {
  const mockEnv = createMockEnvironment();

  describe('CORS handling', () => {
    it('should handle OPTIONS requests', async () => {
      const request = createMockRequest('https://example.com/agent', { method: 'OPTIONS' });
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
    });
  });

  describe('Health check endpoint', () => {
    it('should return health status', async () => {
      const request = createMockRequest('https://example.com/health');
      const response = await worker.fetch(request, mockEnv);

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
      // Mock database stats
      const mockFirstCall = vi.fn().mockResolvedValue({ count: 5 });
      const mockPrepare = vi.fn(() => ({
        first: mockFirstCall,
        bind: vi.fn().mockReturnThis(),
        run: vi.fn(),
        all: vi.fn(),
        raw: vi.fn(),
      }));
      mockEnv.DB.prepare = mockPrepare;

      const request = createMockRequest('https://example.com/stats');
      const response = await worker.fetch(request, mockEnv);

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
      // Mock KV get
      const mockGet = vi.fn().mockResolvedValue(null);
      mockEnv.CACHE.get = mockGet;

      const request = createMockRequest('https://example.com/rate-limit?id=test-user');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.remaining).toBeDefined();
      expect(data.resetTime).toBeDefined();
      expect(data.blocked).toBeDefined();
    });

    it('should return 400 for missing identifier', async () => {
      const request = createMockRequest('https://example.com/rate-limit');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(400);
      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBe('Missing identifier parameter');
    });
  });

  describe('Method not allowed handling', () => {
    it('should return 405 for wrong method on agent endpoint', async () => {
      const request = createMockRequest('https://example.com/agent', { method: 'GET' });
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('POST, OPTIONS');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBe('Method Not Allowed');
    });

    it('should return 405 for wrong method on health endpoint', async () => {
      const request = createMockRequest('https://example.com/health', { method: 'POST' });
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, OPTIONS');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBe('Method Not Allowed');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const request = createMockRequest('https://example.com/unknown-endpoint');
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBe('Not Found');
      expect(data.availableEndpoints).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Mock environment to cause an error
      const badEnv = {
        ...mockEnv,
        CACHE: undefined,
      } as unknown as typeof mockEnv;

      const request = createMockRequest('https://example.com/health');
      const response = await worker.fetch(request, badEnv);

      // Should still return a response even if internal error occurs
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });
});
