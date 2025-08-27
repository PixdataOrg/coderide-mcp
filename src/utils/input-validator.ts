/**
 * Comprehensive input validation and sanitization utilities
 * Implements MCP security best practices for input validation
 */
import { logger } from './logger.js';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Input validation utilities following MCP security best practices
 */
export class InputValidator {
  /**
   * Rate limit store for in-memory tracking
   */
  private static rateLimitStore: Map<string, { count: number; resetTime: number }>;

  /**
   * Generate a unique request ID for tracking
   */
  static generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 11);
    return `req_${timestamp}_${randomPart}`;
  }

  /**
   * Validate user permissions and detect suspicious content
   * Priority 4: Permission validation and security checks
   */
  static validateUserPermissions(input: any, context: string): void {
    // Check for suspicious patterns that might indicate privilege escalation or injection attacks
    const suspiciousPatterns = [
      // System/admin patterns (very specific to avoid false positives)
      /\/admin\//i, /\/root\//i, /\/system\//i, /sudo\s+[a-z]/i, /superuser\s/i,
      
      // Path traversal patterns (more specific)
      /\.\.\/[a-z]/i, /\/etc\/[a-z]/i, /\/var\/[a-z]/i, /\/usr\/[a-z]/i, /\/bin\/[a-z]/i, /\/sbin\/[a-z]/i,
      
      // Script injection patterns (more specific)
      /<script[\s>]/i, /javascript:\s*[a-z]/i, /vbscript:\s*[a-z]/i,
      
      // SQL injection patterns (more specific)
      /union\s+select\s/i, /drop\s+table\s/i, /delete\s+from\s/i, /insert\s+into\s/i,
      
      // Command injection patterns (more specific to avoid false positives)
      /\$\([a-z]/i, /`[a-z]/i, /\|\|\s*[a-z]/i, /&&\s*[a-z]/i, /;\s*(rm|del|cat|ls|dir|echo|curl|wget|nc|netcat)\s/i,
      
      // Protocol handlers (more specific)
      /file:\/\/[a-z]/i, /ftp:\/\/[a-z]/i, /ldap:\/\/[a-z]/i, /gopher:\/\/[a-z]/i,
      
      // Encoding attempts (more specific)
      /%2e%2e%2f/i, /%2f[a-z]/i, /%5c[a-z]/i, /\\x[0-9a-f]{2}/i, /\\u[0-9a-f]{4}/i,
      
      // Template injection (more specific)
      /\{\{[a-z]/i, /\}\}[a-z]/i, /\$\{[a-z]/i, /<%[a-z]/i, /%>[a-z]/i
    ];
    
    const inputStr = JSON.stringify(input);
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(inputStr)) {
        logger.error(`Suspicious content detected in ${context}: pattern ${pattern.source} matched`);
        throw new SecurityError(`Suspicious content detected in ${context}. Content may contain malicious patterns.`);
      }
    }
    
    // Check for excessively long strings that might indicate buffer overflow attempts
    const maxFieldLength = 50000; // Overall safety limit
    if (inputStr.length > maxFieldLength) {
      logger.error(`Oversized input detected in ${context}: ${inputStr.length} characters`);
      throw new SecurityError(`Input too large in ${context}. Maximum size exceeded.`);
    }
    
    // Check for deeply nested objects that might cause stack overflow
    const maxDepth = 10;
    const checkDepth = (obj: any, depth = 0): number => {
      if (depth > maxDepth) return depth;
      if (typeof obj === 'object' && obj !== null) {
        let maxChildDepth = depth;
        for (const value of Object.values(obj)) {
          const childDepth = checkDepth(value, depth + 1);
          maxChildDepth = Math.max(maxChildDepth, childDepth);
        }
        return maxChildDepth;
      }
      return depth;
    };
    
    const actualDepth = checkDepth(input);
    if (actualDepth > maxDepth) {
      logger.error(`Deeply nested object detected in ${context}: depth ${actualDepth}`);
      throw new SecurityError(`Object nesting too deep in ${context}. Maximum depth exceeded.`);
    }
  }

  /**
   * Basic rate limiting validation (in-memory implementation)
   * Priority 4: Rate limiting for update operations
   */
  static validateRateLimit(toolName: string, identifier: string): void {
    // Simple in-memory rate limiting
    const key = `${toolName}:${identifier}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const maxRequests = 10; // Max 10 updates per minute per identifier
    
    // Initialize rate limit store if not exists
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }
    
    // Get current request count for this key
    const requestData = this.rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
    
    // Reset counter if window has expired
    if (now > requestData.resetTime) {
      requestData.count = 0;
      requestData.resetTime = now + windowMs;
    }
    
    // Check if rate limit exceeded
    if (requestData.count >= maxRequests) {
      logger.warn(`Rate limit exceeded for ${toolName} by ${identifier}: ${requestData.count} requests`);
      throw new SecurityError(`Rate limit exceeded for ${toolName}. Please wait before making more requests.`);
    }
    
    // Increment counter
    requestData.count++;
    this.rateLimitStore.set(key, requestData);
    
    // Cleanup old entries periodically (simple approach)
    if (Math.random() < 0.01) { // 1% chance to cleanup
      this.cleanupRateLimitStore();
    }
  }

  /**
   * Cleanup expired rate limit entries
   */
  private static cleanupRateLimitStore(): void {
    if (!this.rateLimitStore) return;
    
    const now = Date.now();
    for (const [key, data] of this.rateLimitStore.entries()) {
      if (now > data.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Validate project slug format
   * Must be exactly 3 letters (case insensitive, converted to uppercase)
   */
  static validateProjectSlug(slug: unknown): string {
    if (!slug || typeof slug !== 'string') {
      throw new ValidationError('Project slug is required and must be a string');
    }
    
    // Remove any whitespace
    const cleanSlug = slug.trim();
    
    // Validate format: exactly 3 letters (case insensitive, will be converted to uppercase)
    if (!/^[A-Za-z]{3}$/.test(cleanSlug)) {
      throw new ValidationError('Project slug must be exactly 3 letters');
    }
    
    // Convert to uppercase for consistency
    const validatedSlug = cleanSlug.toUpperCase();
    
    logger.debug(`Validated project slug: ${slug} -> ${validatedSlug}`);
    return validatedSlug;
  }

  /**
   * Validate task number format
   * Must follow format: ABC-123 (3 letters, hyphen, numbers)
   */
  static validateTaskNumber(taskNumber: unknown): string {
    if (!taskNumber || typeof taskNumber !== 'string') {
      throw new ValidationError('Task number is required and must be a string');
    }
    
    // Remove any whitespace
    const cleanTaskNumber = taskNumber.trim();
    
    // Validate format: 3 letters, hyphen, numbers (case insensitive)
    if (!/^[A-Za-z]{3}-\d+$/.test(cleanTaskNumber)) {
      throw new ValidationError('Task number must follow format: ABC-123 (3 letters, hyphen, numbers)');
    }
    
    // Convert project part to uppercase for consistency
    const parts = cleanTaskNumber.split('-');
    const validatedTaskNumber = `${parts[0].toUpperCase()}-${parts[1]}`;
    
    logger.debug(`Validated task number: ${taskNumber} -> ${validatedTaskNumber}`);
    return validatedTaskNumber;
  }

  /**
   * Validate task status
   * Must be one of the allowed statuses
   */
  static validateTaskStatus(status: unknown): string {
    if (!status || typeof status !== 'string') {
      throw new ValidationError('Task status is required and must be a string');
    }
    
    const allowedStatuses = ['to-do', 'in-progress', 'completed'];
    const cleanStatus = status.trim().toLowerCase();
    
    if (!allowedStatuses.includes(cleanStatus)) {
      throw new ValidationError(`Status must be one of: ${allowedStatuses.join(', ')}`);
    }
    
    logger.debug(`Validated task status: ${status} -> ${cleanStatus}`);
    return cleanStatus;
  }

  /**
   * Sanitize and validate description text
   * Removes potentially dangerous content and limits length
   */
  static sanitizeDescription(description: unknown): string {
    if (description === null || description === undefined) {
      return '';
    }
    
    if (typeof description !== 'string') {
      throw new ValidationError('Description must be a string');
    }
    
    // Remove potentially dangerous content
    let sanitized = description
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove javascript: URLs
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove data: URLs (potential for data exfiltration)
      .replace(/data:/gi, '')
      // Trim whitespace
      .trim();
    
    // Limit length to prevent abuse
    const maxLength = 5000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      logger.warn(`Description truncated to ${maxLength} characters`);
    }
    
    logger.debug(`Sanitized description: ${description.length} -> ${sanitized.length} characters`);
    return sanitized;
  }

  /**
   * Validate and sanitize JSON input
   * Ensures valid JSON and reasonable size limits
   */
  static validateJsonInput(input: unknown): any {
    if (input === null || input === undefined) {
      return null;
    }
    
    try {
      let validatedObject: any;
      let sizeToCheck: number;
      
      if (typeof input === 'string') {
        // Handle string input - parse as JSON
        validatedObject = JSON.parse(input);
        sizeToCheck = input.length;
      } else if (typeof input === 'object') {
        // Handle object input - validate directly without re-parsing
        validatedObject = input;
        // Calculate size by stringifying for size check only
        sizeToCheck = JSON.stringify(input).length;
      } else {
        throw new ValidationError('Input must be a JSON string or object');
      }
      
      // Check size limit (100KB)
      const maxSize = 100 * 1024; // 100KB
      if (sizeToCheck > maxSize) {
        throw new ValidationError(`JSON input too large. Maximum size: ${maxSize} bytes`);
      }
      
      // Additional security checks
      this.validateJsonSecurity(validatedObject);
      
      logger.debug(`Validated JSON input: ${sizeToCheck} bytes`);
      return validatedObject;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof SecurityError) {
        throw error;
      }
      // Provide more specific error information for debugging
      const errorMsg = error instanceof Error ? error.message : 'Unknown parsing error';
      logger.error(`JSON validation failed: ${errorMsg}`);
      throw new ValidationError(`Invalid JSON input: ${errorMsg}`);
    }
  }

  /**
   * Validate JSON content for security issues
   */
  private static validateJsonSecurity(obj: any, depth = 0): void {
    // Prevent deep nesting attacks
    const maxDepth = 10;
    if (depth > maxDepth) {
      throw new SecurityError('JSON nesting too deep');
    }
    
    // Prevent prototype pollution - only check for dangerous assignments
    if (obj && typeof obj === 'object') {
      // Check for dangerous prototype pollution patterns
      // Only flag if these keys have suspicious values that could modify prototypes
      if ('__proto__' in obj && obj.__proto__ !== null && typeof obj.__proto__ === 'object') {
        // Check if __proto__ contains suspicious modifications
        const proto = obj.__proto__;
        const suspiciousProtoKeys = ['constructor', 'toString', 'valueOf', 'hasOwnProperty'];
        for (const key of suspiciousProtoKeys) {
          if (key in proto && typeof proto[key] !== 'function') {
            throw new SecurityError(`Dangerous prototype pollution detected: ${key}`);
          }
        }
      }
      
      // Check for constructor pollution
      if ('constructor' in obj && obj.constructor && typeof obj.constructor === 'object') {
        if ('prototype' in obj.constructor) {
          throw new SecurityError('Dangerous constructor pollution detected');
        }
      }
      
      // Recursively check nested objects
      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
          this.validateJsonSecurity(value, depth + 1);
        }
      }
    }
  }

  /**
   * Validate API endpoint path
   * Prevents path traversal and ensures allowed endpoints
   */
  static validateEndpoint(endpoint: unknown): string {
    if (!endpoint || typeof endpoint !== 'string') {
      throw new ValidationError('Endpoint must be a string');
    }
    
    const cleanEndpoint = endpoint.trim();
    
    // Prevent path traversal
    if (cleanEndpoint.includes('..') || cleanEndpoint.includes('//')) {
      throw new SecurityError('Invalid endpoint path: path traversal detected');
    }
    
    // Ensure it starts with /
    if (!cleanEndpoint.startsWith('/')) {
      throw new SecurityError('Endpoint must start with /');
    }
    
    // Whitelist allowed CodeRide API endpoint patterns
    const allowedPatterns = [
      // Project endpoints
      /^\/project\/slug\/[A-Z]{3}$/,                           // /project/slug/ABC
      /^\/project\/slug\/[A-Z]{3}\/first-task$/,               // /project/slug/ABC/first-task
      /^\/project\/list$/,                                     // /project/list
      
      // Task endpoints
      /^\/task\/number\/[A-Z]{3}-\d+$/,                        // /task/number/ABC-123
      /^\/task\/number\/[A-Z]{3}-\d+\/prompt$/,                // /task/number/ABC-123/prompt
      /^\/task\/number\/[A-Z]{3}-\d+\/next$/,                  // /task/number/ABC-123/next
      /^\/task\/project\/slug\/[A-Z]{3}$/,                     // /task/project/slug/ABC
      
      // Health check
      /^\/api\/health$/                                        // /api/health
    ];
    
    const isAllowed = allowedPatterns.some(pattern => pattern.test(cleanEndpoint));
    if (!isAllowed) {
      throw new SecurityError(`Endpoint not allowed: ${cleanEndpoint}`);
    }
    
    logger.debug(`Validated endpoint: ${endpoint} -> ${cleanEndpoint}`);
    return cleanEndpoint;
  }

  /**
   * Validate API key format
   * Ensures proper format without exposing the actual key
   */
  static validateApiKey(apiKey: unknown): string {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new ValidationError('API key is required and must be a string');
    }
    
    const cleanKey = apiKey.trim();
    
    // Basic format validation (adjust based on your API key format)
    // This example assumes alphanumeric keys of at least 32 characters
    if (!/^[a-zA-Z0-9_-]{32,}$/.test(cleanKey)) {
      throw new ValidationError('Invalid API key format');
    }
    
    logger.debug('API key format validated');
    return cleanKey;
  }

  /**
   * Sanitize output data to remove sensitive information
   */
  static sanitizeOutput(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const sensitiveKeys = [
      'api_key', 'apiKey', 'token', 'password', 'secret', 'auth',
      'authorization', 'credential', 'key'
    ];
    
    const sanitized = JSON.parse(JSON.stringify(data));
    
    function sanitizeRecursive(obj: any): void {
      if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
            obj[key] = '[REDACTED]';
          } else if (value && typeof value === 'object') {
            sanitizeRecursive(value);
          }
        }
      }
    }
    
    sanitizeRecursive(sanitized);
    return sanitized;
  }
}
