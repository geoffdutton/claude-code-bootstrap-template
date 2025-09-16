import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        miniflare: {
          // Use Miniflare for better test isolation and no auth requirements
          compatibilityDate: '2024-10-15',
          compatibilityFlags: ['nodejs_compat'],
          bindings: {
            ENVIRONMENT: 'test',
            LOG_LEVEL: 'debug',
            RATE_LIMIT_PER_MINUTE: '60',
            MAX_CONVERSATION_HISTORY: '50',
            CONTEXT7_API_KEY: 'test-context7-key',
            ANTHROPIC_API_KEY: 'test-anthropic-key',
          },
          // Mock the AI binding
          aiBindings: {
            AI: 'ai',
          },
          // Mock KV namespace
          kvNamespaces: {
            CACHE: 'test-cache',
          },
          // Mock D1 database
          d1Databases: {
            DB: 'test-db',
          },
        },
      },
    },
    globals: true,
    include: ['test/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.wrangler'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.wrangler/',
        'test/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/index.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
