import type { Environment, AgentRequest, AgentResponse } from '../types';
import {
  generateId,
  getCurrentTimestamp,
  createErrorResponse,
  validateAgentRequest,
  sanitizeString,
  logWithLevel,
} from '../utils/helpers';
import { RateLimitService } from '../services/rateLimit';
import { DatabaseService } from '../services/database';
import { AIService } from '../services/ai';
import { Context7Service } from '../services/context7';

export class AgentHandler {
  private readonly rateLimitService: RateLimitService;
  private readonly databaseService: DatabaseService;
  private readonly aiService: AIService;
  private readonly context7Service: Context7Service;

  constructor(env: Environment) {
    this.rateLimitService = new RateLimitService(env);
    this.databaseService = new DatabaseService(env);
    this.aiService = new AIService(env);
    this.context7Service = new Context7Service(env);
  }

  async handleAgentRequest(request: Request): Promise<Response> {
    const requestId = generateId();

    try {
      // Parse request body
      const body = (await request.json()) as unknown;
      const validation = validateAgentRequest(body);

      if (!validation.isValid) {
        return new Response(
          JSON.stringify(
            createErrorResponse(
              `Invalid request: ${validation.errors.join(', ')}`,
              'INVALID_REQUEST',
              requestId
            )
          ),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const agentRequest = body as AgentRequest;

      // Sanitize input
      agentRequest.message = sanitizeString(agentRequest.message);

      // Get client identifier for rate limiting
      const clientId = this.getClientIdentifier(request, agentRequest.userId);

      // Check rate limit
      const rateLimitInfo = await this.rateLimitService.checkRateLimit(clientId);
      if (rateLimitInfo.blocked) {
        return new Response(
          JSON.stringify(
            createErrorResponse(
              'Rate limit exceeded. Please try again later.',
              'RATE_LIMIT_EXCEEDED',
              requestId
            )
          ),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitInfo.resetTime.toString(),
            },
          }
        );
      }

      // Generate conversation ID if not provided
      const conversationId = agentRequest.conversationId || generateId();

      // Initialize database if needed (this is idempotent)
      await this.databaseService.initializeDatabase();

      // Store user message
      await this.databaseService.storeMessage(
        conversationId,
        'user',
        agentRequest.message,
        agentRequest.metadata
      );

      // Get conversation history
      const conversationHistory = await this.databaseService.getConversationHistory(conversationId);

      // Search for relevant context using Context7
      let relevantContext = '';
      try {
        const keywords = await this.aiService.extractKeywords(agentRequest.message);
        if (keywords.length > 0) {
          const searchResponse = await this.context7Service.searchContext(keywords.join(' '), {
            limit: 3,
          });

          if (searchResponse.result && !searchResponse.error) {
            // Extract context from search results
            relevantContext = this.extractContextFromSearchResults(searchResponse.result);
          }
        }
      } catch (error) {
        logWithLevel('warn', 'Context search failed, continuing without context', { error });
      }

      // Generate AI response
      const aiResponse = await this.aiService.generateResponse(
        agentRequest.message,
        conversationHistory.slice(-10), // Use last 10 messages for context
        relevantContext
      );

      // Store assistant response
      await this.databaseService.storeMessage(conversationId, 'assistant', aiResponse);

      // Store conversation context in Context7 for future reference
      try {
        await this.context7Service.storeContext(
          `Conversation: ${agentRequest.message} -> ${aiResponse}`,
          {
            conversationId,
            timestamp: getCurrentTimestamp(),
            type: 'conversation',
          }
        );
      } catch (error) {
        logWithLevel('warn', 'Failed to store context, continuing', { error });
      }

      // Create response
      const response: AgentResponse = {
        response: aiResponse,
        conversationId,
        timestamp: getCurrentTimestamp(),
        metadata: {
          requestId,
          hasContext: relevantContext.length > 0,
          messageCount: conversationHistory.length + 1,
        },
      };

      logWithLevel('info', 'Agent request processed successfully', {
        requestId,
        conversationId,
        clientId,
        responseLength: aiResponse.length,
      });

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
          'X-RateLimit-Reset': rateLimitInfo.resetTime.toString(),
          'X-Request-ID': requestId,
        },
      });
    } catch (error) {
      logWithLevel('error', 'Agent request failed', { error, requestId });

      return new Response(
        JSON.stringify(createErrorResponse('Internal server error', 'INTERNAL_ERROR', requestId)),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  private getClientIdentifier(request: Request, userId?: string): string {
    // Use user ID if provided, otherwise fall back to IP address
    if (userId) {
      return `user:${userId}`;
    }

    const cfConnectingIp = request.headers.get('CF-Connecting-IP');
    const xForwardedFor = request.headers.get('X-Forwarded-For');
    const ip = cfConnectingIp || xForwardedFor?.split(',')[0] || 'unknown';

    return `ip:${ip}`;
  }

  private extractContextFromSearchResults(results: unknown): string {
    try {
      // This depends on the Context7 response format
      // Adjust based on actual API response structure
      if (Array.isArray(results)) {
        return results
          .map((result: unknown) => {
            if (typeof result === 'object' && result !== null && 'content' in result) {
              return (result as { content: string }).content;
            }
            return '';
          })
          .filter(content => content.length > 0)
          .slice(0, 3)
          .join('\n\n');
      }

      return '';
    } catch (error) {
      logWithLevel('warn', 'Failed to extract context from search results', { error });
      return '';
    }
  }
}
