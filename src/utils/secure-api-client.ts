/**
 * Secure API client implementing MCP security best practices
 * Focuses on input validation, proper authentication, and secure request handling
 */
import axios, { AxiosError, AxiosRequestConfig, AxiosInstance } from 'axios';
import { logger } from './logger';
import { env } from './env';
import { InputValidator, ValidationError, SecurityError } from './input-validator';

// Rate limiting store (simple in-memory implementation)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Secure API client with comprehensive security measures
 */
export class SecureApiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly client: AxiosInstance;
  private readonly rateLimitStore = new Map<string, RateLimitEntry>();
  private readonly maxRequestsPerMinute = 100;
  private readonly requestTimeout = 30000; // 30 seconds

  constructor() {
    // Validate and secure API configuration
    this.apiKey = this.validateApiKey(env.CODERIDE_API_KEY);
    this.baseUrl = this.validateBaseUrl(env.CODERIDE_API_URL);
    
    // Create secure axios instance
    this.client = this.createSecureClient();
    
    logger.info('Secure API client initialized');
  }

  /**
   * Validate API key format and security
   */
  private validateApiKey(apiKey: string): string {
    if (!apiKey || typeof apiKey !== 'string') {
      logger.error('Invalid API key configuration');
      throw new SecurityError('API key validation failed');
    }
    
    // Basic format validation for CodeRide API keys
    if (!apiKey.startsWith('CR_API_KEY_')) {
      logger.error('Invalid API key format');
      throw new SecurityError('API key validation failed');
    }
    
    return apiKey;
  }

  /**
   * Validate base URL format and security
   */
  private validateBaseUrl(baseUrl: string): string {
    if (!baseUrl || typeof baseUrl !== 'string') {
      throw new ValidationError('Base URL is required');
    }

    // Ensure HTTPS in production
    if (!baseUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
      throw new SecurityError('HTTPS is required in production');
    }

    // Validate URL format
    try {
      new URL(baseUrl);
    } catch {
      throw new ValidationError('Invalid base URL format');
    }

    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * Create secure axios instance with proper configuration
   */
  private createSecureClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
        'api_key': this.apiKey,
        'User-Agent': 'CodeRide-MCP/0.4.1',
        // Security headers
        'X-Requested-With': 'XMLHttpRequest',
      },
      // Security configurations
      maxRedirects: 0, // Prevent redirect attacks
      validateStatus: (status) => status >= 200 && status < 300,
    });

    // Request interceptor for security logging and validation
    client.interceptors.request.use(
      (config) => {
        const requestId = InputValidator.generateRequestId();
        config.headers['X-Request-ID'] = requestId;
        
        // Validate endpoint
        if (config.url) {
          try {
            InputValidator.validateEndpoint(config.url);
          } catch (error) {
            logger.error(`Invalid endpoint: ${config.url}`, error instanceof Error ? error : new Error(String(error)));
            throw error;
          }
        }

        // Log request (without sensitive data)
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url} [${requestId}]`);

        return config;
      },
      (error) => {
        logger.error('Request interceptor error:', error instanceof Error ? error : new Error(String(error)));
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and logging
    client.interceptors.response.use(
      (response) => {
        const requestId = response.config.headers['X-Request-ID'];
        logger.debug(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          requestId,
          status: response.status
        });
        
        return response.data;
      },
      (error: AxiosError) => {
        const requestId = error.config?.headers?.['X-Request-ID'];
        const status = error.response?.status;
        const endpoint = error.config?.url;
        
        // Log error with context
        logger.error(`API Error: ${error.message} [${requestId}] ${status} ${error.config?.method?.toUpperCase()} ${endpoint}`);

        // Create secure error response
        throw this.createSecureError(error);
      }
    );

    return client;
  }

  /**
   * Sanitize headers for logging (remove sensitive information)
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = ['api_key', 'authorization', 'cookie', 'x-api-key'];
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Create secure error from axios error
   */
  private createSecureError(error: AxiosError): Error {
    const status = error.response?.status;
    
    // Return generic error messages to prevent information leakage
    if (status === 401) {
      return new SecurityError('Authentication failed. Please check your API key.');
    } else if (status === 403) {
      return new SecurityError('Access denied. Insufficient permissions.');
    } else if (status === 404) {
      return new ValidationError('The requested resource was not found.');
    } else if (status === 429) {
      return new SecurityError('Rate limit exceeded. Please try again later.');
    } else if (status && status >= 500) {
      return new Error('Server error. Please try again later.');
    } else {
      return new Error('Request failed. Please check your input and try again.');
    }
  }

  /**
   * Check rate limit for requests
   */
  private async checkRateLimit(identifier: string = 'global'): Promise<void> {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const entry = this.rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return;
    }

    if (entry.count >= this.maxRequestsPerMinute) {
      logger.warn(`Rate limit exceeded for ${identifier}`);
      throw new SecurityError('Rate limit exceeded. Please try again later.');
    }

    // Increment count
    entry.count++;
    this.rateLimitStore.set(identifier, entry);
  }

  /**
   * Make a secure GET request
   */
  async get<T>(endpoint: string, options: { rateLimitId?: string } = {}): Promise<T> {
    // Validate endpoint
    const validatedEndpoint = InputValidator.validateEndpoint(endpoint);
    
    // Check rate limit
    await this.checkRateLimit(options.rateLimitId);
    
    try {
      const response = await this.client.get(validatedEndpoint);
      return response as T;
    } catch (error) {
      logger.error(`GET request failed: ${validatedEndpoint}`);
      throw error;
    }
  }

  /**
   * Make a secure POST request
   */
  async post<T>(endpoint: string, data: any, options: { rateLimitId?: string } = {}): Promise<T> {
    // Validate endpoint
    const validatedEndpoint = InputValidator.validateEndpoint(endpoint);
    
    // Validate and sanitize data
    const validatedData = InputValidator.validateJsonInput(data);
    
    // Check rate limit
    await this.checkRateLimit(options.rateLimitId);
    
    try {
      const response = await this.client.post(validatedEndpoint, validatedData);
      return response as T;
    } catch (error) {
      logger.error(`POST request failed: ${validatedEndpoint}`);
      throw error;
    }
  }

  /**
   * Make a secure PUT request
   */
  async put<T>(endpoint: string, data: any, options: { rateLimitId?: string } = {}): Promise<T> {
    // Validate endpoint
    const validatedEndpoint = InputValidator.validateEndpoint(endpoint);
    
    // Validate and sanitize data
    const validatedData = InputValidator.validateJsonInput(data);
    
    // Check rate limit
    await this.checkRateLimit(options.rateLimitId);
    
    try {
      const response = await this.client.put(validatedEndpoint, validatedData);
      return response as T;
    } catch (error) {
      logger.error(`PUT request failed: ${validatedEndpoint}`);
      throw error;
    }
  }

  /**
   * Make a secure DELETE request
   */
  async delete<T>(endpoint: string, options: { rateLimitId?: string } = {}): Promise<T> {
    // Validate endpoint
    const validatedEndpoint = InputValidator.validateEndpoint(endpoint);
    
    // Check rate limit
    await this.checkRateLimit(options.rateLimitId);
    
    try {
      const response = await this.client.delete(validatedEndpoint);
      return response as T;
    } catch (error) {
      logger.error(`DELETE request failed: ${validatedEndpoint}`);
      throw error;
    }
  }

  /**
   * Get rate limit statistics
   */
  getRateLimitStats(): Record<string, { count: number; resetTime: number }> {
    const stats: Record<string, { count: number; resetTime: number }> = {};
    
    for (const [key, value] of this.rateLimitStore.entries()) {
      stats[key] = { ...value };
    }
    
    return stats;
  }

  /**
   * Clear rate limit for identifier
   */
  clearRateLimit(identifier: string): void {
    this.rateLimitStore.delete(identifier);
    logger.debug(`Rate limit cleared for ${identifier}`);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - adjust endpoint as needed
      await this.get('/api/health');
      return true;
    } catch (error) {
      logger.warn('Health check failed');
      return false;
    }
  }
}

// Export singleton instance
export const secureApiClient = new SecureApiClient();

// API Response Type Definitions
export interface TaskApiResponse {
  id: string;
  number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  project_slug: string;
  created_at: string;
  updated_at: string;
  prompt?: string;
  taskPrompt?: string;
  agent?: string;
  agent_prompt?: string;
  context?: string;
  instructions?: string;
  error?: string;
}

export interface ProjectApiResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  projectKnowledge?: any;
  projectDiagram?: string;
  projectStandards?: any;
  error?: string;
}

export interface StartProjectApiResponse {
  project: ProjectApiResponse;
  task: TaskApiResponse;
  error?: string;
}

export interface NextTaskApiResponse {
  id: string;
  number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  project_slug: string;
  created_at: string;
  updated_at: string;
  prompt?: string;
  context?: string;
  instructions?: string;
  error?: string;
}

export interface ProjectListApiResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  workspace?: any;
}

export interface TaskListApiResponse {
  id: string;
  name: string;
  slug: string;
  status: string;
  project: {
    id: string;
    slug: string;
    name: string;
    description: string;
    status: string;
  };
  columns: Array<{
    id: string;
    name: string;
    status: string;
    tasks: Array<{
      id: string;
      number: string;
      title: string;
      description: string;
      status: string;
      priority: string;
      created_at: string;
      updated_at: string;
      position?: number;
      context?: string;
      instructions?: string;
    }>;
  }>;
  error?: string;
}

export interface UpdateProjectApiResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  project_knowledge?: any;
  project_diagram?: string;
  updated_at: string;
  success?: boolean;
  message?: string;
  project?: any;
  error?: string;
}

export interface UpdateTaskApiResponse {
  id: string;
  number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  project_slug: string;
  updated_at: string;
  success?: boolean;
  message?: string;
  task?: any;
  error?: string;
}
