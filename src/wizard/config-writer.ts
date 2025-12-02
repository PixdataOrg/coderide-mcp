/**
 * Configuration writer utilities
 * Handles writing MCP server configurations to client config files
 */
import {
  ClientHandler,
  ClientConfig,
  CODERIDE_SERVER_NAME,
  createCodeRideServerConfig,
} from './clients/index.js';
import { CodexCLIHandler } from './clients/codex-cli.js';

export interface WriteResult {
  clientId: string;
  clientName: string;
  success: boolean;
  configPath: string;
  error?: string;
}

/**
 * Write CodeRide configuration to a single client
 */
export function writeConfigToClient(
  handler: ClientHandler,
  apiKey: string
): WriteResult {
  const configPath = handler.getConfigPath();
  if (!configPath) {
    return {
      clientId: handler.id,
      clientName: handler.name,
      success: false,
      configPath: 'unknown',
      error: 'Could not determine config path',
    };
  }

  try {
    // Special handling for Codex CLI (TOML format)
    if (handler instanceof CodexCLIHandler) {
      handler.writeCodeRideConfig(apiKey);
      return {
        clientId: handler.id,
        clientName: handler.name,
        success: true,
        configPath,
      };
    }

    // Standard JSON handling for other clients
    const existingConfig = handler.readConfig() || {};
    const configKey = handler.getConfigKey();
    const serverConfig = createCodeRideServerConfig(apiKey);

    // Merge with existing config
    const newConfig: ClientConfig = {
      ...existingConfig,
      [configKey]: {
        ...(existingConfig[configKey] || {}),
        [CODERIDE_SERVER_NAME]: serverConfig,
      },
    };

    handler.writeConfig(newConfig);

    return {
      clientId: handler.id,
      clientName: handler.name,
      success: true,
      configPath,
    };
  } catch (error) {
    return {
      clientId: handler.id,
      clientName: handler.name,
      success: false,
      configPath,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Write CodeRide configuration to multiple clients
 */
export function writeConfigToClients(
  handlers: ClientHandler[],
  apiKey: string
): WriteResult[] {
  return handlers.map(handler => writeConfigToClient(handler, apiKey));
}
