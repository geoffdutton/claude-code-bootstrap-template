import type { Environment } from '../types';
import { logWithLevel } from '../utils/helpers';
import { MCPClientManager } from 'agents/mcp';

export class Context7Service {
  private readonly mcpClient: MCPClientManager;
  private isConnected = false;

  constructor(env: Environment) {
    if (!env.CONTEXT7_API_KEY) {
      throw new Error('CONTEXT7_API_KEY is required for Context7 MCP integration');
    }
    
    this.mcpClient = new MCPClientManager('quantum-mcp-agent', '1.0.0');
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.mcpClient.connect('https://mcp.context7.com/mcp', {
          transport: { type: 'streamable-http' }
        });
        this.isConnected = true;
        logWithLevel('info', 'Connected to Context7 MCP server');
      } catch (error) {
        logWithLevel('error', 'Failed to connect to Context7 MCP server', { error });
        throw new Error('Failed to connect to Context7 MCP server');
      }
    }
  }

  async callTool(toolName: string, toolArguments: Record<string, unknown>): Promise<unknown> {
    try {
      await this.ensureConnected();

      logWithLevel('debug', 'Calling Context7 MCP tool', { 
        toolName, 
        argumentKeys: Object.keys(toolArguments) 
      });

      const result = await this.mcpClient.callTool({
        serverId: 'context7-server',
        name: toolName,
        arguments: toolArguments
      });

      logWithLevel('debug', 'Context7 MCP tool response received', { toolName });
      return result;
    } catch (error) {
      logWithLevel('error', 'Context7 MCP tool call failed', { 
        error, 
        toolName, 
        argumentKeys: Object.keys(toolArguments) 
      });
      throw new Error(`Context7 MCP tool call failed: ${error}`);
    }
  }

  async enhanceContext(message: string, conversationHistory: string[]): Promise<string> {
    try {
      const result = await this.callTool('enhance-context', {
        message,
        history: conversationHistory,
        maxResults: 5
      });

      if (typeof result === 'string') {
        return result;
      }

      // Handle structured response
      if (result && typeof result === 'object' && 'enhancedContext' in result) {
        return (result as { enhancedContext: string }).enhancedContext;
      }

      return '';
    } catch (error) {
      logWithLevel('warn', 'Failed to enhance context, proceeding without enhancement', { error });
      return '';
    }
  }

  async extractKeywords(text: string): Promise<string[]> {
    try {
      const result = await this.callTool('extract-keywords', {
        text,
        maxKeywords: 10
      });

      if (Array.isArray(result)) {
        return result.filter(item => typeof item === 'string');
      }

      // Handle structured response
      if (result && typeof result === 'object' && 'keywords' in result) {
        const keywords = (result as { keywords: unknown }).keywords;
        if (Array.isArray(keywords)) {
          return keywords.filter(item => typeof item === 'string');
        }
      }

      return [];
    } catch (error) {
      logWithLevel('warn', 'Failed to extract keywords via Context7, falling back to local extraction', { error });
      return [];
    }
  }

  async searchContext(query: string, options?: { limit?: number; filters?: Record<string, unknown> }): Promise<unknown> {
    return this.callTool('search', {
      query,
      limit: options?.limit ?? 10,
      filters: options?.filters ?? {},
    });
  }

  async storeContext(content: string, metadata?: Record<string, unknown>): Promise<unknown> {
    return this.callTool('store', {
      content,
      metadata: metadata ?? {},
    });
  }

  async analyzeContent(content: string, analysisType?: string): Promise<unknown> {
    return this.callTool('analyze', {
      content,
      type: analysisType ?? 'general',
    });
  }
}