/**
 * Token Security Manager
 * 
 * Comprehensive token detection and redaction system that prevents sensitive tokens
 * from being passed through the MCP server or logged, following MCP security best practices.
 */
import { logger } from './logger.js';
import { randomBytes } from 'crypto';

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Token patterns for detection and redaction
 */
const TOKEN_PATTERNS = {
  // API Keys
  apiKey: /(?:api[_-]?key|key)[=:\s]+([a-zA-Z0-9_-]{20,})/gi,
  
  // Bearer Tokens
  bearerToken: /Bearer\s+([a-zA-Z0-9_.-]{20,})/gi,
  
  // JWT Tokens
  jwtToken: /eyJ[a-zA-Z0-9_.-]+/gi,
  
  // OAuth Tokens
  accessToken: /(?:access[_-]?token)[=:\s]+([a-zA-Z0-9_-]{20,})/gi,
  refreshToken: /(?:refresh[_-]?token)[=:\s]+([a-zA-Z0-9_-]{20,})/gi,
  
  // Session Tokens
  sessionToken: /(?:session[_-]?token|sess[_-]?id)[=:\s]+([a-zA-Z0-9_-]{20,})/gi,
  
  // Database URLs with credentials
  mongoUrl: /(mongodb:\/\/[^:]+:[^@]+@[^\/]+)/gi,
  postgresUrl: /(postgres(?:ql)?:\/\/[^:]+:[^@]+@[^\/]+)/gi,
  mysqlUrl: /(mysql:\/\/[^:]+:[^@]+@[^\/]+)/gi,
  
  // AWS Credentials
  awsAccessKey: /AKIA[0-9A-Z]{16}/gi,
  awsSecretKey: /(?:aws[_-]?secret[_-]?access[_-]?key)[=:\s]+([a-zA-Z0-9\/+=]{40})/gi,
  
  // GitHub Tokens
  githubToken: /ghp_[a-zA-Z0-9]{36}/gi,
  githubTokenField: /(?:github[_-]?token)[=:\s]+([a-zA-Z0-9_-]{20,})/gi,
  
  // Generic secrets and passwords
  secret: /(?:secret|password|pwd|pass)[=:\s]+([a-zA-Z0-9_!@#$%^&*()-+=]{8,})/gi,
  
  // Authorization headers
  authHeader: /(?:authorization)[=:\s]+([a-zA-Z0-9_.-]{20,})/gi,
};

/**
 * Sensitive field names that should be redacted
 */
const SENSITIVE_FIELDS = [
  'api_key', 'apiKey', 'api-key',
  'token', 'access_token', 'accessToken', 'refresh_token', 'refreshToken',
  'secret', 'password', 'pwd', 'pass',
  'authorization', 'auth', 'credential', 'credentials',
  'session_token', 'sessionToken', 'sess_id', 'sessionId',
  'github_token', 'githubToken',
  'aws_secret_access_key', 'awsSecretAccessKey',
  'private_key', 'privateKey',
  'client_secret', 'clientSecret'
];

/**
 * Session management interface
 */
interface SessionMetadata {
  [key: string]: any;
}

interface SessionEntry {
  id: string;
  metadata: SessionMetadata;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number;
}

/**
 * Token Security Manager Class
 */
export class TokenSecurityManager {
  private static instance: TokenSecurityManager;
  private sessionStore = new Map<string, SessionEntry>();
  private readonly sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private readonly maxSessions = 1000;
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 minutes
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startCleanupProcess();
    logger.info('Token Security Manager initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TokenSecurityManager {
    if (!TokenSecurityManager.instance) {
      TokenSecurityManager.instance = new TokenSecurityManager();
    }
    return TokenSecurityManager.instance;
  }

  /**
   * Detect and redact sensitive tokens from any input
   */
  redactSensitiveTokens(input: any): any {
    if (input === null || input === undefined) {
      return input;
    }

    // Handle strings
    if (typeof input === 'string') {
      return this.redactTokensFromString(input);
    }

    // Handle arrays
    if (Array.isArray(input)) {
      return input.map(item => this.redactSensitiveTokens(item));
    }

    // Handle objects
    if (typeof input === 'object') {
      const redacted: any = {};
      
      for (const [key, value] of Object.entries(input)) {
        // Check if field name is sensitive
        if (this.isSensitiveField(key)) {
          redacted[key] = '[REDACTED]';
          logger.warn(`Sensitive field detected and redacted: ${key}`);
        } else {
          // Recursively redact nested objects/arrays
          redacted[key] = this.redactSensitiveTokens(value);
        }
      }
      
      return redacted;
    }

    return input;
  }

  /**
   * Validate that no tokens are being passed through
   */
  validateNoTokenPassthrough(input: any, context: string): void {
    const tokens = this.detectTokens(input);
    
    if (tokens.length > 0) {
      logger.error(`Token passthrough attempt detected in ${context}: ${tokens.map(t => t.type).join(', ')}`);
      throw new SecurityError(`Token passthrough detected in ${context}. Sensitive data cannot be passed through the MCP server.`);
    }
  }

  /**
   * Detect tokens in input without redacting
   */
  private detectTokens(input: any): Array<{ type: string; value: string }> {
    const tokens: Array<{ type: string; value: string }> = [];

    if (typeof input === 'string') {
      // Check string patterns
      for (const [type, pattern] of Object.entries(TOKEN_PATTERNS)) {
        const matches = input.match(pattern);
        if (matches) {
          matches.forEach(match => {
            tokens.push({ type, value: match });
          });
        }
      }
    } else if (typeof input === 'object' && input !== null) {
      // Check object fields
      for (const [key, value] of Object.entries(input)) {
        if (this.isSensitiveField(key) && typeof value === 'string' && value.length > 8) {
          tokens.push({ type: 'sensitive_field', value: key });
        }
        
        // Recursively check nested objects
        if (typeof value === 'object' || Array.isArray(value)) {
          tokens.push(...this.detectTokens(value));
        }
      }
    } else if (Array.isArray(input)) {
      // Check array elements
      input.forEach(item => {
        tokens.push(...this.detectTokens(item));
      });
    }

    return tokens;
  }

  /**
   * Redact tokens from a string
   */
  private redactTokensFromString(text: string): string {
    let redacted = text;

    for (const [type, pattern] of Object.entries(TOKEN_PATTERNS)) {
      redacted = redacted.replace(pattern, (match, ...groups) => {
        logger.debug(`Token detected and redacted: ${type}`);
        
        // For Bearer tokens, keep the "Bearer " prefix
        if (type === 'bearerToken') {
          return 'Bearer [REDACTED]';
        }
        
        // For field-based patterns, keep the field name
        if (match.includes('=') || match.includes(':')) {
          const separator = match.includes('=') ? '=' : ':';
          const parts = match.split(separator);
          return `${parts[0]}${separator}[REDACTED]`;
        }
        
        // For standalone tokens, redact completely
        return '[REDACTED]';
      });
    }

    return redacted;
  }

  /**
   * Check if a field name is sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return SENSITIVE_FIELDS.some(sensitive => 
      lowerField.includes(sensitive.toLowerCase())
    );
  }

  /**
   * Create a new secure session
   */
  createSession(metadata: SessionMetadata = {}): string {
    // Check session limits
    if (this.sessionStore.size >= this.maxSessions) {
      this.cleanupExpiredSessions();
      
      if (this.sessionStore.size >= this.maxSessions) {
        throw new SecurityError('Maximum number of sessions reached');
      }
    }

    // Generate secure session ID
    const sessionId = this.generateSecureSessionId();
    const now = Date.now();

    // Redact any sensitive data from metadata
    const redactedMetadata = this.redactSensitiveTokens(metadata);

    const session: SessionEntry = {
      id: sessionId,
      metadata: redactedMetadata,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + this.sessionTimeout
    };

    this.sessionStore.set(sessionId, session);
    
    logger.debug(`Session created: ${sessionId.substring(0, 12)}...`);
    return sessionId;
  }

  /**
   * Validate and refresh a session
   */
  validateSession(sessionId: string): boolean {
    const session = this.sessionStore.get(sessionId);
    
    if (!session) {
      return false;
    }

    const now = Date.now();
    
    // Check if expired
    if (now > session.expiresAt) {
      this.sessionStore.delete(sessionId);
      logger.debug(`Session expired: ${sessionId.substring(0, 12)}...`);
      return false;
    }

    // Refresh session (sliding window)
    session.lastAccessedAt = now;
    session.expiresAt = now + this.sessionTimeout;
    
    logger.debug(`Session validated and refreshed: ${sessionId.substring(0, 12)}...`);
    return true;
  }

  /**
   * Get session metadata
   */
  getSessionMetadata(sessionId: string): SessionMetadata | null {
    const session = this.sessionStore.get(sessionId);
    
    if (!session || !this.validateSession(sessionId)) {
      return null;
    }

    return { ...session.metadata };
  }

  /**
   * Update session metadata
   */
  updateSessionMetadata(sessionId: string, metadata: SessionMetadata): boolean {
    const session = this.sessionStore.get(sessionId);
    
    if (!session || !this.validateSession(sessionId)) {
      return false;
    }

    // Redact sensitive data from new metadata
    const redactedMetadata = this.redactSensitiveTokens(metadata);
    
    session.metadata = { ...session.metadata, ...redactedMetadata };
    session.lastAccessedAt = Date.now();
    
    logger.debug(`Session metadata updated: ${sessionId.substring(0, 12)}...`);
    return true;
  }

  /**
   * Destroy a session
   */
  destroySession(sessionId: string): boolean {
    const existed = this.sessionStore.has(sessionId);
    this.sessionStore.delete(sessionId);
    
    if (existed) {
      logger.debug(`Session destroyed: ${sessionId.substring(0, 12)}...`);
    }
    
    return existed;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): { total: number; active: number; expired: number } {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const session of this.sessionStore.values()) {
      if (now > session.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.sessionStore.size,
      active,
      expired
    };
  }

  /**
   * Generate a cryptographically secure session ID
   * Uses crypto.randomBytes for secure random generation as required by MCP spec
   */
  private generateSecureSessionId(): string {
    // Use cryptographically secure random generation
    const secureRandomBytes = randomBytes(32);
    const timestamp = Date.now().toString(36);
    const secureRandom = secureRandomBytes.toString('hex');
    
    return `sess_${timestamp}_${secureRandom}`;
  }

  /**
   * Start the automatic cleanup process
   */
  private startCleanupProcess(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.cleanupInterval);
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessionStore.entries()) {
      if (now > session.expiresAt) {
        this.sessionStore.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  /**
   * Shutdown the token security manager
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    this.sessionStore.clear();
    logger.info('Token Security Manager shutdown');
  }
}

// Export singleton instance
export const tokenSecurityManager = TokenSecurityManager.getInstance();

// Export utility functions
export const redactSensitiveTokens = (input: any) => tokenSecurityManager.redactSensitiveTokens(input);
export const validateNoTokenPassthrough = (input: any, context: string) => tokenSecurityManager.validateNoTokenPassthrough(input, context);

// Session management exports
export const sessionManager = {
  create: (metadata?: SessionMetadata) => tokenSecurityManager.createSession(metadata),
  validate: (sessionId: string) => tokenSecurityManager.validateSession(sessionId),
  getMetadata: (sessionId: string) => tokenSecurityManager.getSessionMetadata(sessionId),
  updateMetadata: (sessionId: string, metadata: SessionMetadata) => tokenSecurityManager.updateSessionMetadata(sessionId, metadata),
  destroy: (sessionId: string) => tokenSecurityManager.destroySession(sessionId),
  getStats: () => tokenSecurityManager.getSessionStats()
};
