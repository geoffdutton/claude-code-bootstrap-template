import type { Environment, ConversationMessage } from '../types';
import { logWithLevel } from '../utils/helpers';

export class AIService {
  private readonly ai: Ai;

  constructor(env: Environment) {
    this.ai = env.AI;
  }

  async generateResponse(
    message: string,
    conversationHistory: ConversationMessage[] = [],
    context?: string
  ): Promise<string> {
    try {
      // Build the conversation context
      const messages = this.buildMessagesArray(message, conversationHistory, context);

      logWithLevel('debug', 'Generating AI response', {
        messageCount: messages.length,
        hasContext: Boolean(context),
      });

      // Call Cloudflare AI
      const response = (await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages,
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.9,
      })) as { response: string };

      if (!response.response) {
        throw new Error('AI response was empty');
      }

      logWithLevel('debug', 'AI response generated successfully', {
        responseLength: response.response.length,
      });

      return response.response.trim();
    } catch (error) {
      logWithLevel('error', 'Failed to generate AI response', { error, message });
      throw new Error('Failed to generate AI response');
    }
  }

  private buildMessagesArray(
    currentMessage: string,
    conversationHistory: ConversationMessage[],
    context?: string
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add system message with context if provided
    let systemMessage = `You are a helpful AI assistant integrated with Context7 for enhanced contextual understanding. 
Provide clear, accurate, and helpful responses. Keep your answers concise but comprehensive.`;

    if (context) {
      systemMessage += `\n\nRelevant context for this conversation:\n${context}`;
    }

    messages.push({
      role: 'system',
      content: systemMessage,
    });

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage,
    });

    return messages;
  }

  async summarizeConversation(messages: ConversationMessage[]): Promise<string> {
    if (messages.length === 0) {
      return 'No conversation to summarize.';
    }

    try {
      const conversationText = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

      const summaryMessages = [
        {
          role: 'system',
          content: `Provide a concise summary of the following conversation. 
Focus on key topics, decisions, and important information discussed.`,
        },
        {
          role: 'user',
          content: `Please summarize this conversation:\n\n${conversationText}`,
        },
      ];

      const response = (await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: summaryMessages,
        max_tokens: 512,
        temperature: 0.3,
      })) as { response: string };

      return response.response?.trim() || 'Could not generate summary.';
    } catch (error) {
      logWithLevel('error', 'Failed to summarize conversation', { error });
      return 'Error generating conversation summary.';
    }
  }

  async extractKeywords(text: string): Promise<string[]> {
    try {
      const messages = [
        {
          role: 'system',
          content: `Extract the most important keywords and phrases from the given text. 
Return them as a comma-separated list. Focus on nouns, important concepts, and key topics.`,
        },
        {
          role: 'user',
          content: `Extract keywords from this text: ${text}`,
        },
      ];

      const response = (await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages,
        max_tokens: 256,
        temperature: 0.2,
      })) as { response: string };

      if (!response.response) {
        return [];
      }

      // Parse the comma-separated keywords
      return response.response
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0)
        .slice(0, 10); // Limit to 10 keywords
    } catch (error) {
      logWithLevel('error', 'Failed to extract keywords', { error });
      return [];
    }
  }

  async classifyIntent(message: string): Promise<{
    intent: string;
    confidence: number;
  }> {
    try {
      const messages = [
        {
          role: 'system',
          content: `Classify the intent of the user's message into one of these categories:
- question: User is asking for information
- request: User wants something to be done
- conversation: General conversation or chat
- problem: User has a problem or issue
- other: Does not fit other categories

Respond with just the category name and a confidence score (0-1).
Format: "intent: <category>, confidence: <score>"`,
        },
        {
          role: 'user',
          content: message,
        },
      ];

      const response = (await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages,
        max_tokens: 50,
        temperature: 0.1,
      })) as { response: string };

      // Parse the response
      const match = response.response?.match(/intent:\s*(\w+),\s*confidence:\s*([\d.]+)/i);
      if (match && match[1] && match[2]) {
        return {
          intent: match[1].toLowerCase(),
          confidence: Math.min(1, Math.max(0, parseFloat(match[2]))),
        };
      }

      return { intent: 'other', confidence: 0.5 };
    } catch (error) {
      logWithLevel('error', 'Failed to classify intent', { error });
      return { intent: 'other', confidence: 0.5 };
    }
  }
}
