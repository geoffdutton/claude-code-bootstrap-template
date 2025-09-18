import { beforeAll, afterEach } from 'vitest';
import { createExecutionContext, env, fetchMock } from 'cloudflare:test';

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
});

// Helper to create test execution context
export function createTestExecutionContext() {
  return createExecutionContext();
}

// Helper to get test environment with proper bindings
export function getTestEnv() {
  return env;
}