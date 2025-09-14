import type { Environment, Context7MCPRequest, Context7MCPResponse } from '../types';
import { logWithLevel } from '../utils/helpers';

export class Context7Service {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://mcp.context7.com/mcp';

  constructor(env: Environment) {
    if (!env.CONTEXT7_API_KEY) {
      throw new Error('CONTEXT7_API_KEY is required for Context7 MCP integration');
    }
    this.apiKey = env.CONTEXT7_API_KEY;
  }

  async callMCP(request: Context7MCPRequest): Promise<Context7MCPResponse> {
    try {
      logWithLevel('debug', 'Calling Context7 MCP', { method: request.method });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          CONTEXT7_API_KEY: this.apiKey,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logWithLevel('error', 'Context7 MCP request failed', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });

        return {
          error: {
            code: response.status,
            message: `Context7 MCP request failed: ${response.statusText}`,
            data: { responseText: errorText },
          },
        };
      }

      const data = (await response.json()) as Context7MCPResponse;
      logWithLevel('debug', 'Context7 MCP response received', { method: request.method });

      return data;
    } catch (error) {
      logWithLevel('error', 'Context7 MCP call failed', { error });
      return {
        error: {
          code: -1,
          message: 'Internal error calling Context7 MCP',
          data: { error: String(error) },
        },
      };
    }
  }

  async searchContext(
    query: string,
    options?: {
      limit?: number;
      filters?: Record<string, unknown>;
    }
  ): Promise<Context7MCPResponse> {
    return this.callMCP({
      method: 'search',
      params: {
        query,
        limit: options?.limit ?? 10,
        filters: options?.filters ?? {},
      },
    });
  }

  async getContextById(id: string): Promise<Context7MCPResponse> {
    return this.callMCP({
      method: 'get',
      params: { id },
    });
  }

  async storeContext(
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<Context7MCPResponse> {
    return this.callMCP({
      method: 'store',
      params: {
        content,
        metadata: metadata ?? {},
      },
    });
  }

  async updateContext(
    id: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<Context7MCPResponse> {
    return this.callMCP({
      method: 'update',
      params: {
        id,
        content,
        metadata: metadata ?? {},
      },
    });
  }

  async deleteContext(id: string): Promise<Context7MCPResponse> {
    return this.callMCP({
      method: 'delete',
      params: { id },
    });
  }

  async analyzeContent(content: string, analysisType?: string): Promise<Context7MCPResponse> {
    return this.callMCP({
      method: 'analyze',
      params: {
        content,
        type: analysisType ?? 'general',
      },
    });
  }
}
