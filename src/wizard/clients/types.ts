/**
 * Shared types for MCP client configuration handlers
 */

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface ClientConfig {
  mcpServers?: Record<string, MCPServerConfig>;
  servers?: Record<string, MCPServerConfig>;  // VS Code uses 'servers' instead
}

export interface ClientHandler {
  name: string;
  id: string;
  getConfigPath(): string | null;
  isInstalled(): boolean;
  readConfig(): ClientConfig | null;
  writeConfig(config: ClientConfig): void;
  getConfigKey(): 'mcpServers' | 'servers';
}

export interface DetectedClient {
  handler: ClientHandler;
  configPath: string;
  hasExistingConfig: boolean;
}

export const CODERIDE_SERVER_NAME = 'CodeRide';

export function createCodeRideServerConfig(apiKey: string): MCPServerConfig {
  return {
    command: 'npx',
    args: ['-y', '@coderide/mcp', 'server'],
    env: {
      CODERIDE_API_KEY: apiKey,
    },
  };
}
