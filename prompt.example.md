# Example Bootstrap Prompt

Replace this file with `prompt.md` containing your specific requirements.

## Example: Cloudflare Worker AI Agent

Create a Cloudflare Worker that functions as an AI-powered assistant with the following features:

### Core Functionality
- Accept HTTP POST requests with user messages
- Integrate with Cloudflare AI (Workers AI) for LLM responses  
- Store conversation history in Cloudflare D1 database
- Implement rate limiting using Cloudflare KV
- CORS support for frontend integration

### Technical Requirements
- TypeScript with latest Cloudflare Worker types
- Input validation and sanitization
- Comprehensive error handling and logging
- Environment variable configuration
- Unit tests with Miniflare

### Development Setup
- Local development environment with Wrangler
- Pre-commit hooks for code quality (Prettier, ESLint)
- GitHub Actions for automated deployment
- Comprehensive documentation and README

### Optional Advanced Features
- Streaming responses for better UX
- Support for multiple AI models
- Usage analytics stored in D1
- WebSocket support for real-time chat
- Authentication with Cloudflare Access

Generate a production-ready codebase that follows Cloudflare Workers be nd includes all necessary configuration files for immediate deployment.
