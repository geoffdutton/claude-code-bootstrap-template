export interface Environment {
  // Cloudflare bindings
  AI: Ai;
  CACHE: KVNamespace;
  DB: D1Database;

  // Environment variables
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  RATE_LIMIT_PER_MINUTE: string;
  MAX_CONVERSATION_HISTORY: string;

  // Secrets
  CONTEXT7_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

export interface AgentRequest {
  message: string;
  conversationId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  response: string;
  conversationId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown> | undefined;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  blocked: boolean;
}

export interface Context7MCPRequest {
  method: string;
  params: Record<string, unknown>;
}

export interface Context7MCPResponse {
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  requestId?: string;
}
