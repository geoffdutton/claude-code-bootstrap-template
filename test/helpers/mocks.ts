// Helper functions for testing - minimal utilities that work with @cloudflare/vitest-pool-workers

export const createAgentRequestBody = (overrides: Record<string, unknown> = {}) => ({
  message: 'Hello, how are you?',
  conversationId: 'test-conversation-123',
  userId: 'test-user-456',
  metadata: { source: 'test' },
  ...overrides,
});

export const createRequestWithBody = (url: string, method = 'POST', body?: unknown, headers: Record<string, string> = {}) => {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '192.168.1.1',
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(url, requestInit);
};

// Test utilities for common patterns
export const expectJsonResponse = async (response: Response, expectedStatus: number) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers.get('Content-Type')).toBe('application/json');
  return (await response.json()) as Record<string, unknown>;
};

export const expectCorsHeaders = (response: Response) => {
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
};
