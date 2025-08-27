/**
 * Environment variable handling
 */
import * as dotenv from 'dotenv';
import { logger } from './logger.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Required environment variables for the application
 */
export interface EnvironmentVariables {
  CODERIDE_API_URL: string;
  CODERIDE_API_KEY: string;
  LOG_LEVEL?: string;
}

/**
 * Get environment variables with validation
 */
export function getEnv(): EnvironmentVariables {
  const env: Partial<EnvironmentVariables> = {
    CODERIDE_API_URL: 'https://api.coderide.ai',
    CODERIDE_API_KEY: process.env.CODERIDE_API_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL,
  };

  // Validate required environment variables
  const missingVars: string[] = [];
  
  if (!env.CODERIDE_API_KEY) {
    missingVars.push('CODERIDE_API_KEY');
  }

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  return env as EnvironmentVariables;
}

// Export environment variables
export const env = getEnv();
