import type { ErrorResponse } from '../types';
import { z } from 'zod';

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function createErrorResponse(
  error: string,
  code: string,
  requestId?: string
): ErrorResponse {
  const response: ErrorResponse = {
    error,
    code,
    timestamp: getCurrentTimestamp(),
  };

  if (requestId) {
    response.requestId = requestId;
  }

  return response;
}

// Zod schema for agent request validation
const AgentRequestSchema = z.object({
  message: z.string().min(1, 'Message is required and must be a non-empty string'),
  conversationId: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export function validateAgentRequest(body: unknown): {
  isValid: boolean;
  errors: string[];
  data?: z.infer<typeof AgentRequestSchema>;
} {
  const result = AgentRequestSchema.safeParse(body);
  
  if (result.success) {
    return {
      isValid: true,
      errors: [],
      data: result.data,
    };
  }
  
  const errors = result.error.errors.map(err => err.message);
  return {
    isValid: false,
    errors,
  };
}

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim()
    .slice(0, 10000); // Limit length
}

export function createCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function logWithLevel(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>
): void {
  const logData = {
    level,
    message,
    timestamp: getCurrentTimestamp(),
    ...data,
  };

  // In production, you might want to send logs to an external service
  console.log(JSON.stringify(logData));
}
