import { describe, it, expect, vi } from 'vitest';

import {
  generateId,
  getCurrentTimestamp,
  createErrorResponse,
  validateAgentRequest,
  sanitizeString,
  createCorsHeaders,
} from '../../src/utils/helpers';

// Mock crypto.randomUUID for testing environment
declare global {
  interface GlobalThis {
    crypto: Crypto;
  }
}

vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'mock-uuid-123'),
});

describe('Utility Helpers', () => {
  describe('generateId', () => {
    it('should generate a UUID', () => {
      const id = generateId();
      expect(id).toBe('mock-uuid-123');
      expect(crypto.randomUUID).toHaveBeenCalled();
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return ISO timestamp', () => {
      const timestamp = getCurrentTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response object', () => {
      const error = createErrorResponse('Test error', 'TEST_CODE', 'req-123');
      expect(error).toEqual({
        error: 'Test error',
        code: 'TEST_CODE',
        timestamp: expect.any(String),
        requestId: 'req-123',
      });
    });

    it('should work without requestId', () => {
      const error = createErrorResponse('Test error', 'TEST_CODE');
      expect(error).toEqual({
        error: 'Test error',
        code: 'TEST_CODE',
        timestamp: expect.any(String),
      });
    });
  });

  describe('validateAgentRequest', () => {
    it('should validate valid request', () => {
      const validRequest = {
        message: 'Hello world',
        conversationId: 'conv-123',
        userId: 'user-456',
        metadata: { test: true },
      };

      const result = validateAgentRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid request body', () => {
      const result = validateAgentRequest(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Request body must be a valid JSON object');
    });

    it('should reject missing message', () => {
      const invalidRequest = { conversationId: 'conv-123' };
      const result = validateAgentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message is required and must be a non-empty string');
    });

    it('should reject empty message', () => {
      const invalidRequest = { message: '   ' };
      const result = validateAgentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message is required and must be a non-empty string');
    });

    it('should reject invalid conversationId type', () => {
      const invalidRequest = { message: 'Hello', conversationId: 123 };
      const result = validateAgentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('conversationId must be a string if provided');
    });

    it('should reject invalid userId type', () => {
      const invalidRequest = { message: 'Hello', userId: 123 };
      const result = validateAgentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('userId must be a string if provided');
    });

    it('should reject invalid metadata type', () => {
      const invalidRequest = { message: 'Hello', metadata: 'invalid' };
      const result = validateAgentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('metadata must be an object if provided');
    });
  });

  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      const result = sanitizeString('<script>alert("test")</script>');
      expect(result).toBe('scriptalert(test)/script');
    });

    it('should remove quotes', () => {
      const result = sanitizeString('Test "quoted" text');
      expect(result).toBe('Test quoted text');
    });

    it('should trim whitespace', () => {
      const result = sanitizeString('  test  ');
      expect(result).toBe('test');
    });

    it('should limit length', () => {
      const longString = 'a'.repeat(15000);
      const result = sanitizeString(longString);
      expect(result).toHaveLength(10000);
    });
  });

  describe('createCorsHeaders', () => {
    it('should return CORS headers', () => {
      const headers = createCorsHeaders();
      expect(headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      });
    });
  });
});
