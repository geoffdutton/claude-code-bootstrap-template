import { vi, beforeEach } from 'vitest';

import type { Environment } from '../../src/types';

// Mock Cloudflare bindings
export const createMockEnvironment = (): Environment => ({
  AI: {
    run: vi.fn(),
  } as unknown as Ai,
  CACHE: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  } as unknown as KVNamespace,
  DB: {
    prepare: vi.fn(() => ({
      bind: vi.fn().mockReturnThis(),
      run: vi.fn(),
      all: vi.fn(),
      first: vi.fn(),
      raw: vi.fn(),
    })),
    exec: vi.fn(),
    batch: vi.fn(),
    dump: vi.fn(),
  } as unknown as D1Database,
  ENVIRONMENT: 'test',
  LOG_LEVEL: 'debug',
  RATE_LIMIT_PER_MINUTE: '60',
  MAX_CONVERSATION_HISTORY: '50',
  CONTEXT7_API_KEY: 'test-context7-key',
  ANTHROPIC_API_KEY: 'test-anthropic-key',
});

export const createMockRequest = (url: string, options: RequestInit = {}): Request =>
  new Request(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '192.168.1.1',
    },
    ...options,
  });

export const createMockAgentRequest = (overrides: Record<string, unknown> = {}) => ({
  message: 'Hello, how are you?',
  conversationId: 'test-conversation-123',
  userId: 'test-user-456',
  metadata: { source: 'test' },
  ...overrides,
});

// Global mocks for Web APIs not available in Node.js test environment
declare global {
  interface GlobalThis {
    crypto: Crypto;
    fetch: typeof fetch;
  }
}

// Use vi.stubGlobal for better compatibility
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'mock-uuid-123'),
});

vi.stubGlobal('fetch', vi.fn());

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
