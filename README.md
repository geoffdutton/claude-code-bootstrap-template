# Cloudflare Agent

🤖 An intelligent Cloudflare Worker agent with Context7 MCP integration, powered by Cloudflare AI and built with TypeScript.

## Features

- 🧠 **AI-Powered Conversations** - Leverages Cloudflare AI for intelligent responses
- 🔍 **Context7 Integration** - Enhanced contextual understanding via MCP protocol
- 💾 **Persistent Memory** - Conversation history stored in D1 database
- ⚡ **Rate Limiting** - Built-in rate limiting using KV storage
- 🔒 **Type Safety** - Strict TypeScript with no `any` types allowed
- 🧪 **Comprehensive Testing** - Unit tests with Vitest
- 🎯 **Production Ready** - Complete CI/CD pipeline and monitoring

## Quick Start

### Prerequisites

- Node.js 20+
- Cloudflare account
- Wrangler CLI
- Context7 API key

### 1. Installation

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Configure your secrets
wrangler secret put CONTEXT7_API_KEY
# Optional: wrangler secret put ANTHROPIC_API_KEY
```

### 3. Set up Cloudflare Resources

```bash
# Create KV namespace for caching
wrangler kv:namespace create "CACHE"

# Create D1 database for conversations
wrangler d1 create agent-conversations

# Update wrangler.toml with your IDs
```

### 4. Deploy Database Schema

```bash
# Run database migrations
wrangler d1 execute agent-conversations --file=./schema.sql
```

### 5. Development

```bash
# Start local development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

### 6. Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

## API Endpoints

### `POST /agent`

Main conversation endpoint for interacting with the AI agent.

**Request:**

```json
{
  "message": "Hello, how are you?",
  "conversationId": "optional-conversation-id",
  "userId": "optional-user-id",
  "metadata": {
    "source": "web"
  }
}
```

**Response:**

```json
{
  "response": "I'm doing well, thank you! How can I help you today?",
  "conversationId": "uuid-v4",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "requestId": "uuid-v4",
    "hasContext": true,
    "messageCount": 1
  }
}
```

### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### `GET /stats`

Usage statistics endpoint.

**Response:**

```json
{
  "totalConversations": 150,
  "totalMessages": 1247,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 0
}
```

### `GET /rate-limit?id=<identifier>`

Check rate limit status for an identifier.

**Response:**

```json
{
  "remaining": 45,
  "resetTime": 1704067200000,
  "blocked": false
}
```

## Configuration

### Environment Variables

| Variable                   | Description            | Default       |
| -------------------------- | ---------------------- | ------------- |
| `ENVIRONMENT`              | Deployment environment | `development` |
| `LOG_LEVEL`                | Logging level          | `info`        |
| `RATE_LIMIT_PER_MINUTE`    | Rate limit per minute  | `60`          |
| `MAX_CONVERSATION_HISTORY` | Max messages to keep   | `50`          |

### Secrets

| Secret              | Description                  | Required |
| ------------------- | ---------------------------- | -------- |
| `CONTEXT7_API_KEY`  | Context7 MCP API key         | ✅       |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional) | ❌       |

### Cloudflare Bindings

| Binding | Type | Description               |
| ------- | ---- | ------------------------- |
| `AI`    | AI   | Cloudflare AI binding     |
| `CACHE` | KV   | Rate limiting and caching |
| `DB`    | D1   | Conversation storage      |

## Development

### Project Structure

```
src/
├── handlers/          # Request handlers
│   ├── agent.ts      # Main agent logic
│   └── utility.ts    # Health, stats, etc.
├── services/         # Business logic
│   ├── ai.ts         # Cloudflare AI integration
│   ├── context7.ts   # Context7 MCP client
│   ├── database.ts   # D1 database operations
│   └── rateLimit.ts  # Rate limiting logic
├── types/            # TypeScript definitions
│   └── index.ts      # Shared types
├── utils/            # Utility functions
│   └── helpers.ts    # Common helpers
└── index.ts          # Main entry point

test/
├── helpers/          # Test utilities
│   └── mocks.ts      # Mock objects
└── unit/             # Unit tests
    ├── helpers.test.ts
    └── main.test.ts
```

### Code Quality

This project enforces strict code quality standards:

- **No `any` types** - All TypeScript must be fully typed
- **ESLint** - Strict linting rules for code consistency
- **Prettier** - Automatic code formatting
- **Pre-commit hooks** - Quality checks before commits
- **100% test coverage** - Comprehensive test suite

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run deploy       # Deploy to Cloudflare Workers
npm run test         # Run tests
npm run test:coverage # Run tests with coverage
npm run type-check   # TypeScript type checking
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## Context7 Integration

This agent integrates with Context7's MCP (Model Context Protocol) for enhanced contextual understanding:

- **Automatic Context Search** - Searches relevant context for each query
- **Context Storage** - Stores conversation history for future reference
- **Content Analysis** - Analyzes content for better understanding
- **Contextual Responses** - Uses retrieved context to improve AI responses

## Error Handling

The agent implements comprehensive error handling:

- **Graceful Degradation** - Continues operation even if services fail
- **Detailed Logging** - Structured JSON logging for debugging
- **User-Friendly Errors** - Clear error messages for API users
- **Rate Limiting** - Prevents abuse with intelligent rate limiting

## Security

- **Input Sanitization** - All user inputs are sanitized
- **Rate Limiting** - Per-user and per-IP rate limiting
- **CORS Headers** - Proper CORS configuration
- **Secret Management** - Secrets stored securely in Cloudflare
- **Type Safety** - Runtime type validation

## Monitoring

- **Health Checks** - `/health` endpoint for uptime monitoring
- **Usage Statistics** - Track conversations and messages
- **Structured Logging** - JSON logs for analysis
- **Error Tracking** - Detailed error reporting

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all quality checks pass
5. Submit a pull request

## Support

For support or questions:

- Open an issue on GitHub
- Check the documentation
- Review the test files for examples
