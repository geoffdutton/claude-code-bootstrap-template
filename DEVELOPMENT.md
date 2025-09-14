# Development Guide

This guide helps you set up and contribute to the Cloudflare Agent project.

## Development Environment

### Prerequisites

- Node.js 20+
- npm or yarn
- Git
- VS Code (recommended)

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd cloudflare-agent
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install VS Code extensions** (recommended)
   - TypeScript and JavaScript Language Features
   - ESLint
   - Prettier
   - Cloudflare Workers

4. **Set up pre-commit hooks**
   ```bash
   npm run prepare
   ```

## Code Standards

### TypeScript

- **Strict mode enabled** - No `any` types allowed
- **Explicit return types** - All functions must have return types
- **No unused variables** - All variables must be used
- **Exact optional properties** - Optional properties must be explicitly undefined

Example:

```typescript
// ✅ Good
function processMessage(message: string): Promise<string> {
  return Promise.resolve(message.trim());
}

// ❌ Bad
function processMessage(message: any) {
  return message.trim();
}
```

### Naming Conventions

- **Files**: kebab-case (`rate-limit.ts`)
- **Classes**: PascalCase (`RateLimitService`)
- **Functions**: camelCase (`generateId`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces**: PascalCase with descriptive names (`AgentRequest`)

### Error Handling

```typescript
// ✅ Proper error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logWithLevel('error', 'Operation failed', { error });
  throw new Error('Failed to complete operation');
}

// ❌ Swallowing errors
try {
  await riskyOperation();
} catch {
  // Silent failure
}
```

### Logging

Use structured logging with the `logWithLevel` utility:

```typescript
import { logWithLevel } from '../utils/helpers';

// ✅ Good
logWithLevel('info', 'Processing request', {
  requestId: '123',
  userId: 'user-456',
  duration: '150ms',
});

// ❌ Bad
console.log('Processing request for user-456');
```

## Testing

### Test Structure

- **Unit tests**: `test/unit/` - Test individual functions/classes
- **Integration tests**: `test/integration/` - Test service interactions
- **Test helpers**: `test/helpers/` - Shared test utilities

### Writing Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { generateId } from '../../src/utils/helpers';

describe('generateId', () => {
  it('should generate a unique identifier', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
```

### Test Coverage

- Aim for **100% test coverage**
- Test both success and error cases
- Mock external dependencies
- Use descriptive test names

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm run test:coverage

# Specific test file
npm test helpers.test.ts
```

## Development Workflow

### 1. Branching Strategy

- `main` - Production code
- `develop` - Integration branch
- `feature/feature-name` - Feature branches
- `fix/bug-description` - Bug fixes

### 2. Development Process

1. **Create feature branch**

   ```bash
   git checkout -b feature/add-new-endpoint
   ```

2. **Make changes with tests**
   - Write tests first (TDD)
   - Implement feature
   - Ensure tests pass

3. **Commit with conventional commits**

   ```bash
   git commit -m "feat: add new conversation endpoint"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/add-new-endpoint
   ```

### 3. Code Review Checklist

- [ ] Tests added for new functionality
- [ ] All tests passing
- [ ] TypeScript types are strict (no `any`)
- [ ] Error handling implemented
- [ ] Logging added where appropriate
- [ ] Documentation updated
- [ ] Performance considered

## Available Scripts

### Development

```bash
npm run dev          # Start development server with hot reload
npm run type-check   # Check TypeScript types
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check if code is formatted
```

### Testing

```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Build & Deploy

```bash
npm run build        # Build for production
npm run deploy       # Deploy to Cloudflare Workers
```

## Architecture

### Request Flow

```
Request → Main Handler → Route Handler → Service Layer → External APIs
                      ↓
                   Middleware (CORS, Rate Limiting, Validation)
```

### Service Layer

- **AI Service**: Interfaces with Cloudflare AI
- **Context7 Service**: Handles MCP communication
- **Database Service**: Manages D1 operations
- **Rate Limit Service**: Handles KV-based rate limiting

### Error Handling Strategy

1. **Input Validation**: Validate and sanitize all inputs
2. **Service Errors**: Catch and log service-level errors
3. **Graceful Degradation**: Continue operation when possible
4. **User-Friendly Responses**: Return helpful error messages

## Performance Guidelines

### General

- Minimize external API calls
- Use caching where appropriate
- Implement proper rate limiting
- Monitor response times

### Cloudflare Specific

- Keep bundle size small
- Use streaming for large responses
- Leverage edge caching
- Optimize D1 queries

### Database

```typescript
// ✅ Efficient query
const messages = await db
  .prepare('SELECT * FROM conversations WHERE conversation_id = ? ORDER BY timestamp DESC LIMIT ?')
  .bind(conversationId, limit)
  .all();

// ❌ Inefficient query
const allMessages = await db.prepare('SELECT * FROM conversations').all();
const filtered = allMessages.filter(m => m.conversation_id === conversationId);
```

## Debugging

### Local Development

```bash
# Start with debug logging
LOG_LEVEL=debug npm run dev

# Use VS Code debugger
# Set breakpoints and run "Debug Worker" configuration
```

### Production Debugging

```bash
# View real-time logs
wrangler tail

# Check specific errors
wrangler tail --search="ERROR"
```

### Common Issues

1. **TypeScript errors**: Check `tsconfig.json` settings
2. **Test failures**: Ensure mocks are properly configured
3. **Linting errors**: Run `npm run lint:fix`
4. **Import errors**: Check file paths and extensions

## Contributing

### Before Starting

1. Check existing issues
2. Discuss major changes in issues first
3. Follow the development process
4. Write tests for new features

### Pull Request Process

1. **Create descriptive PR title**
   - Use conventional commit format
   - Be specific about changes

2. **Fill out PR template**
   - Describe what changed
   - Link to related issues
   - Add screenshots for UI changes

3. **Ensure CI passes**
   - All tests pass
   - No linting errors
   - Type checking passes

4. **Request review**
   - At least one reviewer
   - Address feedback promptly

### Release Process

1. **Merge to develop**
   - Deploys to staging automatically
   - Run integration tests

2. **Merge to main**
   - Deploys to production
   - Creates GitHub release
   - Updates documentation

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Context7 MCP Documentation](https://context7.com/docs/)

## Getting Help

- Check the [FAQ](FAQ.md)
- Search existing [GitHub issues](https://github.com/your-repo/issues)
- Create a new issue with detailed information
- Join the discussion in pull requests
