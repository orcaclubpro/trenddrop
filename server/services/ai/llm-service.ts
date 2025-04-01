/**
 * LLM Service
 * 
 * Provides a unified interface to interact with various LLM providers.
 */

import axios from 'axios';
import { OpenAI } from 'openai';
import { log } from '../../vite.js';
import { LLMEndpoint } from './interfaces.js';

export class LLMService {
  private static instance: LLMService;
  private openaiClient: OpenAI | null = null;
  private lmStudioEndpoint: LLMEndpoint | null = null;
  private grokEndpoint: LLMEndpoint | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  /**
   * Initialize the LLM service with available providers
   */
  public async initialize(): Promise<boolean> {
    try {
      log('Initializing LLM Service', 'llm-service');

      // Initialize OpenAI if API key is available
      if (process.env.OPENAI_API_KEY) {
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        log('OpenAI client initialized', 'llm-service');
      } else {
        log('No OpenAI API key provided. OpenAI will not be available.', 'llm-service');
      }

      // Initialize LM Studio endpoint
      if (process.env.LMSTUDIO_API_URL) {
        this.lmStudioEndpoint = {
          url: process.env.LMSTUDIO_API_URL,
          model: process.env.LMSTUDIO_MODEL || 'default'
        };
        log('LM Studio endpoint configured', 'llm-service');
      } else {
        // Default local endpoint for LM Studio
        this.lmStudioEndpoint = {
          url: 'http://localhost:1234/v1/chat/completions',
          model: 'local-model'
        };
        log('Using default local LM Studio endpoint', 'llm-service');
      }

      // Initialize Grok endpoint if available
      if (process.env.GROK_API_URL && process.env.GROK_API_KEY) {
        this.grokEndpoint = {
          url: process.env.GROK_API_URL,
          headers: {
            'Authorization': `Bearer ${process.env.GROK_API_KEY}`
          },
          model: process.env.GROK_MODEL || 'grok-1'
        };
        log('Grok endpoint configured', 'llm-service');
      } else {
        log('No Grok credentials provided. Grok will not be available.', 'llm-service');
      }

      return true;
    } catch (error) {
      log(`Error initializing LLM Service: ${error}`, 'llm-service');
      return false;
    }
  }

  /**
   * Check if at least one LLM provider is available
   */
  public isAvailable(): boolean {
    return !!(this.openaiClient || this.lmStudioEndpoint || this.grokEndpoint);
  }

  /**
   * Get status of available LLM providers
   */
  public getStatus(): any {
    return {
      openai: !!this.openaiClient,
      lmstudio: !!this.lmStudioEndpoint,
      grok: !!this.grokEndpoint,
      isAvailable: this.isAvailable()
    };
  }

  /**
   * Send a prompt to the available LLM providers with failover
   */
  public async sendPrompt(
    systemPrompt: string, 
    userPrompt: string, 
    options: {
      temperature?: number; 
      maxTokens?: number; 
      preferProvider?: 'openai' | 'lmstudio' | 'grok';
      forceProvider?: 'openai' | 'lmstudio' | 'grok';
    } = {}
  ): Promise<string> {
    // Set default options
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 1500;
    const preferProvider = options.preferProvider || 'lmstudio'; // Default to local first
    
    // If a specific provider is forced, try only that one
    if (options.forceProvider) {
      switch (options.forceProvider) {
        case 'openai':
          if (!this.openaiClient) {
            throw new Error('OpenAI client is not initialized');
          }
          return this.sendPromptToOpenAI(systemPrompt, userPrompt, temperature, maxTokens);
        case 'lmstudio':
          if (!this.lmStudioEndpoint) {
            throw new Error('LM Studio endpoint is not configured');
          }
          return this.sendPromptToLMStudio(systemPrompt, userPrompt, temperature, maxTokens);
        case 'grok':
          if (!this.grokEndpoint) {
            throw new Error('Grok endpoint is not configured');
          }
          return this.sendPromptToGrok(systemPrompt, userPrompt, temperature, maxTokens);
      }
    }

    // Try providers in preferred order with fallbacks
    const providers = this.getProvidersInOrder(preferProvider);
    
    let lastError: Error | null = null;
    for (const provider of providers) {
      try {
        switch (provider) {
          case 'openai':
            if (this.openaiClient) {
              return await this.sendPromptToOpenAI(systemPrompt, userPrompt, temperature, maxTokens);
            }
            break;
          case 'lmstudio':
            if (this.lmStudioEndpoint) {
              return await this.sendPromptToLMStudio(systemPrompt, userPrompt, temperature, maxTokens);
            }
            break;
          case 'grok':
            if (this.grokEndpoint) {
              return await this.sendPromptToGrok(systemPrompt, userPrompt, temperature, maxTokens);
            }
            break;
        }
      } catch (error) {
        lastError = error as Error;
        log(`Error using ${provider}: ${error}. Trying next provider...`, 'llm-service');
      }
    }

    // If we get here, all providers failed
    throw lastError || new Error('No LLM providers available');
  }

  /**
   * Execute a structured task using an LLM with JSON output
   */
  public async executeTask<T>(
    systemPrompt: string,
    userPrompt: string,
    jsonSchema: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      retries?: number;
      preferProvider?: 'openai' | 'lmstudio' | 'grok';
    } = {}
  ): Promise<T> {
    const retries = options.retries || 3;
    const enhancedSystemPrompt = `${systemPrompt}
    
You must respond with valid JSON that matches the following schema:
${jsonSchema}

Your entire response must be valid JSON. DO NOT include any text outside the JSON.`;

    let lastError: Error | null = null;
    
    // Try multiple times in case of parsing errors
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Lower temperature for structured tasks
        const temperature = options.temperature || 0.2;
        
        // Prefer OpenAI for structured JSON tasks as it's more reliable
        const preferProvider = options.preferProvider || 'openai';
        
        const result = await this.sendPrompt(
          enhancedSystemPrompt,
          userPrompt,
          {
            temperature,
            maxTokens: options.maxTokens,
            preferProvider
          }
        );

        try {
          // Attempt to extract JSON if response contains other text
          const jsonMatch = result.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as T;
          }
          
          // If no match, try to parse the whole response
          return JSON.parse(result) as T;
        } catch (parseError) {
          log(`JSON parsing error on attempt ${attempt + 1}/${retries}: ${parseError}`, 'llm-service');
          
          if (attempt === retries - 1) {
            // On last attempt, throw the parsing error
            throw parseError;
          }
          
          // For intermediate attempts, continue to retry
          lastError = parseError as Error;
        }
      } catch (error) {
        log(`Task execution error on attempt ${attempt + 1}/${retries}: ${error}`, 'llm-service');
        lastError = error as Error;
        
        if (attempt === retries - 1) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Failed to execute task');
  }

  /**
   * Sort available providers based on preference
   */
  private getProvidersInOrder(preferProvider: 'openai' | 'lmstudio' | 'grok'): ('openai' | 'lmstudio' | 'grok')[] {
    const allProviders: ('openai' | 'lmstudio' | 'grok')[] = ['openai', 'lmstudio', 'grok'];
    
    // Move preferred provider to front
    const providers = allProviders.filter(p => p !== preferProvider);
    providers.unshift(preferProvider);
    
    return providers;
  }

  /**
   * Send prompt to OpenAI
   */
  private async sendPromptToOpenAI(
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    try {
      log('Sending prompt to OpenAI', 'llm-service');
      
      const response = await this.openaiClient!.chat.completions.create({
        model: maxTokens > 4000 ? 'gpt-4' : 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: maxTokens
      });
      
      return response.choices[0].message.content || '';
    } catch (error) {
      log(`Error sending prompt to OpenAI: ${error}`, 'llm-service');
      throw error;
    }
  }

  /**
   * Send prompt to LM Studio
   */
  private async sendPromptToLMStudio(
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    try {
      log('Sending prompt to LM Studio', 'llm-service');
      
      const response = await axios.post(
        this.lmStudioEndpoint!.url,
        {
          model: this.lmStudioEndpoint!.model || 'local-model',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.lmStudioEndpoint!.headers || {})
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      log(`Error sending prompt to LM Studio: ${error}`, 'llm-service');
      throw error;
    }
  }

  /**
   * Send prompt to Grok
   */
  private async sendPromptToGrok(
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    try {
      log('Sending prompt to Grok', 'llm-service');
      
      const response = await axios.post(
        this.grokEndpoint!.url,
        {
          model: this.grokEndpoint!.model || 'grok-1',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.grokEndpoint!.headers || {})
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      log(`Error sending prompt to Grok: ${error}`, 'llm-service');
      throw error;
    }
  }
}

// Export singleton instance
export default LLMService.getInstance();