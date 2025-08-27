/**
 * Clean configuration handling for Smithery MCP deployment
 * Security-focused approach with no hardcoded secrets or complex patterns
 */
import { logger } from './logger.js';

/**
 * API configuration interface for type safety
 */
export interface ApiConfig {
  readonly CODERIDE_API_KEY: string;
  readonly CODERIDE_API_URL: string;
  readonly LOG_LEVEL: string;
}

/**
 * Smithery configuration input (from Zod schema)
 */
export interface SmitheryConfig {
  CODERIDE_API_KEY?: string;
}

/**
 * Create API configuration from Smithery config with secure defaults
 * No hardcoded secrets - all sensitive data comes from Smithery's secure config system
 */
export function createApiConfig(smitheryConfig?: SmitheryConfig): ApiConfig {
  const config: ApiConfig = {
    CODERIDE_API_KEY: smitheryConfig?.CODERIDE_API_KEY || '',
    CODERIDE_API_URL: 'https://api.coderide.ai',
    LOG_LEVEL: 'info'
  };

  // Log configuration status without exposing sensitive data
  if (config.CODERIDE_API_KEY) {
    logger.debug('API configuration loaded with provided credentials');
  } else {
    logger.debug('API configuration loaded without credentials (mock mode)');
  }

  return config;
}

/**
 * Validate API configuration for security compliance
 */
export function validateApiConfig(config: ApiConfig): void {
  // Validate API URL security
  if (!config.CODERIDE_API_URL.startsWith('https://')) {
    throw new Error('API URL must use HTTPS for security');
  }

  // Validate URL format
  try {
    new URL(config.CODERIDE_API_URL);
  } catch {
    throw new Error('Invalid API URL format');
  }

  // Log validation success without exposing sensitive data
  logger.debug('API configuration validation passed');
}

/**
 * Determine if configuration indicates production mode
 * Production mode requires a valid CodeRide API key format
 */
export function isProductionMode(config: ApiConfig): boolean {
  return !!(
    config.CODERIDE_API_KEY && 
    config.CODERIDE_API_KEY.length > 10 &&
    config.CODERIDE_API_KEY.startsWith('CR_API_KEY_')
  );
}

/**
 * Legacy support for STDIO deployments
 * Only used when not running in Smithery environment
 */
export function createLegacyConfig(): ApiConfig {
  return createApiConfig({
    CODERIDE_API_KEY: process.env.CODERIDE_API_KEY
  });
}
