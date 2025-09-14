import type { Environment } from './types';
import { createCorsHeaders, logWithLevel } from './utils/helpers';
import { AgentHandler } from './handlers/agent';
import { UtilityHandlers } from './handlers/utility';

export default {
  async fetch(request: Request, env: Environment): Promise<Response> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // Add CORS headers to all responses
    const corsHeaders = createCorsHeaders();

    try {
      logWithLevel('info', 'Request received', {
        method,
        path,
        userAgent: request.headers.get('User-Agent'),
        cfRay: request.headers.get('CF-Ray'),
      });

      // Initialize handlers
      const agentHandler = new AgentHandler(env);
      const utilityHandlers = new UtilityHandlers(env);

      // Handle CORS preflight requests
      if (method === 'OPTIONS') {
        return utilityHandlers.handleOptions();
      }

      // Route requests
      if (path === '/agent' && method === 'POST') {
        const response = await agentHandler.handleAgentRequest(request);
        // Add CORS headers to agent responses
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }

      if (path === '/health' && method === 'GET') {
        return utilityHandlers.handleHealthCheck(env);
      }

      if (path === '/stats' && method === 'GET') {
        return utilityHandlers.handleStats();
      }

      if (path === '/rate-limit' && method === 'GET') {
        return utilityHandlers.handleRateLimitStatus(request);
      }

      // Handle method not allowed for known endpoints
      if (path === '/agent' && method !== 'POST') {
        return utilityHandlers.handleMethodNotAllowed(['POST', 'OPTIONS']);
      }

      if (['/health', '/stats', '/rate-limit'].includes(path) && method !== 'GET') {
        return utilityHandlers.handleMethodNotAllowed(['GET', 'OPTIONS']);
      }

      // Handle 404 for unknown endpoints
      return utilityHandlers.handleNotFound();
    } catch (error) {
      logWithLevel('error', 'Unhandled error in main handler', { error, method, path });

      const errorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } finally {
      const duration = Date.now() - startTime;
      logWithLevel('info', 'Request completed', {
        method,
        path,
        duration: `${duration}ms`,
      });
    }
  },
} satisfies ExportedHandler<Environment>;
