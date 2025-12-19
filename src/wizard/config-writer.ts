/**
 * Configuration writer utilities
 * Handles writing MCP server configurations to client config files
 */
import {
  ClientHandler,
  ClientConfig,
  MCPServerConfig,
  CODERIDE_SERVER_NAME,
  createCodeRideServerConfig,
} from './clients/index.js';
import { CodexCLIHandler } from './clients/codex-cli.js';

export interface WriteResult {
  clientId: string;
  clientName: string;
  status: 'ok' | 'unchanged' | 'fail';
  configPath: string;
  error?: string;
}

function configsEqual(
  a: MCPServerConfig | undefined,
  b: MCPServerConfig | undefined
): boolean {
  if (!a || !b) return false;
  const sameCommand = a.command === b.command;
  const sameArgs = JSON.stringify(a.args) === JSON.stringify(b.args);
  const sameEnv = JSON.stringify(a.env || {}) === JSON.stringify(b.env || {});
  return sameCommand && sameArgs && sameEnv;
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
      status: 'fail',
      configPath: 'unknown',
      error: 'Could not determine config path',
    };
  }

  try {
    const existingConfig = handler.readConfig() || {};
    const configKey = handler.getConfigKey();
    const serverConfig = createCodeRideServerConfig(apiKey);
    const existingServerConfig = existingConfig[configKey]?.[CODERIDE_SERVER_NAME];

    // Special handling for Codex CLI (TOML format)
    if (handler instanceof CodexCLIHandler) {
      if (configsEqual(existingServerConfig, serverConfig)) {
        return {
          clientId: handler.id,
          clientName: handler.name,
          status: 'unchanged',
          configPath,
        };
      }

      handler.writeCodeRideConfig(apiKey);
      return {
        clientId: handler.id,
        clientName: handler.name,
        status: 'ok',
        configPath,
      };
    }

    // Standard JSON handling for other clients
    if (configsEqual(existingServerConfig, serverConfig)) {
      return {
        clientId: handler.id,
        clientName: handler.name,
        status: 'unchanged',
        configPath,
      };
    }

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
      status: 'ok',
      configPath,
    };
  } catch (error) {
    return {
      clientId: handler.id,
      clientName: handler.name,
      status: 'fail',
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
