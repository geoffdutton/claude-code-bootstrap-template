import type { Environment } from '../types';
import { createCorsHeaders, logWithLevel } from '../utils/helpers';
import { RateLimitService } from '../services/rateLimit';
import { DatabaseService } from '../services/database';

export class UtilityHandlers {
  private readonly rateLimitService: RateLimitService;
  private readonly databaseService: DatabaseService;

  constructor(env: Environment) {
    this.rateLimitService = new RateLimitService(env);
    this.databaseService = new DatabaseService(env);
  }

  async handleOptions(): Promise<Response> {
    return new Response(null, {
      status: 204,
      headers: createCorsHeaders(),
    });
  }

  async handleHealthCheck(env: Environment): Promise<Response> {
    try {
      // Basic health check
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: env.ENVIRONMENT,
      };

      return new Response(JSON.stringify(health), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...createCorsHeaders(),
        },
      });
    } catch (error) {
      logWithLevel('error', 'Health check failed', { error });

      return new Response(
        JSON.stringify({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check failed',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            ...createCorsHeaders(),
          },
        }
      );
    }
  }

  async handleRateLimitStatus(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const identifier = url.searchParams.get('id');

      if (!identifier) {
        return new Response(JSON.stringify({ error: 'Missing identifier parameter' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...createCorsHeaders(),
          },
        });
      }

      const rateLimitInfo = await this.rateLimitService.getRateLimitStatus(identifier);

      return new Response(JSON.stringify(rateLimitInfo), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...createCorsHeaders(),
        },
      });
    } catch (error) {
      logWithLevel('error', 'Rate limit status check failed', { error });

      return new Response(JSON.stringify({ error: 'Failed to check rate limit status' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...createCorsHeaders(),
        },
      });
    }
  }

  async handleStats(): Promise<Response> {
    try {
      const stats = await this.databaseService.getConversationStats();

      const response = {
        ...stats,
        timestamp: new Date().toISOString(),
        uptime: 0, // Cloudflare Workers don't have process.uptime
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...createCorsHeaders(),
        },
      });
    } catch (error) {
      logWithLevel('error', 'Stats request failed', { error });

      return new Response(JSON.stringify({ error: 'Failed to retrieve stats' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...createCorsHeaders(),
        },
      });
    }
  }

  async handleNotFound(): Promise<Response> {
    const notFoundResponse = {
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
      timestamp: new Date().toISOString(),
      availableEndpoints: [
        'POST /agent - Main agent chat endpoint',
        'GET /health - Health check',
        'GET /stats - Usage statistics',
        'GET /rate-limit?id=<identifier> - Rate limit status',
        'OPTIONS /* - CORS preflight',
      ],
    };

    return new Response(JSON.stringify(notFoundResponse), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...createCorsHeaders(),
      },
    });
  }

  async handleMethodNotAllowed(allowedMethods: string[]): Promise<Response> {
    const errorResponse = {
      error: 'Method Not Allowed',
      message: `This endpoint only supports: ${allowedMethods.join(', ')}`,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        Allow: allowedMethods.join(', '),
        ...createCorsHeaders(),
      },
    });
  }
}
