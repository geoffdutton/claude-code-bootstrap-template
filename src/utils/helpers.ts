import type { ErrorResponse } from '../types';

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

export function validateAgentRequest(body: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof body !== 'object' || body === null) {
    errors.push('Request body must be a valid JSON object');
    return { isValid: false, errors };
  }

  const request = body as Record<string, unknown>;

  if (typeof request.message !== 'string' || request.message.trim().length === 0) {
    errors.push('Message is required and must be a non-empty string');
  }

  if (request.conversationId !== undefined && typeof request.conversationId !== 'string') {
    errors.push('conversationId must be a string if provided');
  }

  if (request.userId !== undefined && typeof request.userId !== 'string') {
    errors.push('userId must be a string if provided');
  }

  if (
    request.metadata !== undefined &&
    (typeof request.metadata !== 'object' || request.metadata === null)
  ) {
    errors.push('metadata must be an object if provided');
  }

  return {
    isValid: errors.length === 0,
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
