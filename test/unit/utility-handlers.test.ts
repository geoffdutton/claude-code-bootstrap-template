import { describe, it, expect, beforeEach } from 'vitest';
import { env, createExecutionContext } from 'cloudflare:test';
import { UtilityHandlers } from '../../src/handlers/utility';

describe('UtilityHandlers', () => {
  let utilityHandlers: UtilityHandlers;

  beforeEach(() => {
    utilityHandlers = new UtilityHandlers(env);
  });

  describe('handleOptions', () => {
    it('should return CORS headers for OPTIONS requests', async () => {
      const response = await utilityHandlers.handleOptions();

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });
  });

  describe('handleHealthCheck', () => {
    it('should return health status', async () => {
      const response = await utilityHandlers.handleHealthCheck(env);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.version).toBe('1.0.0');
      expect(data.environment).toBeDefined();
    });
  });

  describe('handleStats', () => {
    it('should return conversation and message statistics', async () => {
      const response = await utilityHandlers.handleStats();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.totalConversations).toBeDefined();
      expect(data.totalMessages).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(typeof data.totalConversations).toBe('number');
      expect(typeof data.totalMessages).toBe('number');
    });
  });

  describe('handleRateLimitStatus', () => {
    it('should return rate limit status for valid identifier', async () => {
      const request = new Request('https://example.com/rate-limit?id=test-user');
      const response = await utilityHandlers.handleRateLimitStatus(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.remaining).toBeDefined();
      expect(data.resetTime).toBeDefined();
      expect(data.blocked).toBeDefined();
      expect(typeof data.remaining).toBe('number');
      expect(typeof data.blocked).toBe('boolean');
    });

    it('should return 400 for missing identifier', async () => {
      const request = new Request('https://example.com/rate-limit');
      const response = await utilityHandlers.handleRateLimitStatus(request);

      expect(response.status).toBe(400);
      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBe('Missing identifier parameter');
    });

    it('should return 400 for empty identifier', async () => {
      const request = new Request('https://example.com/rate-limit?id=');
      const response = await utilityHandlers.handleRateLimitStatus(request);

      expect(response.status).toBe(400);
      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBe('Missing identifier parameter');
    });
  });

  describe('handleMethodNotAllowed', () => {
    it('should return 405 with allowed methods', async () => {
      const allowedMethods = ['GET', 'POST', 'OPTIONS'];
      const response = await utilityHandlers.handleMethodNotAllowed(allowedMethods);

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, POST, OPTIONS');
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBe('Method Not Allowed');
      expect(data.message).toContain('GET, POST, OPTIONS');
    });
  });

  describe('handleNotFound', () => {
    it('should return 404 with available endpoints', async () => {
      const response = await utilityHandlers.handleNotFound();

      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = (await response.json()) as Record<string, unknown>;
      expect(data.error).toBe('Not Found');
      expect(data.availableEndpoints).toBeDefined();
      expect(Array.isArray(data.availableEndpoints)).toBe(true);
    });
  });
});