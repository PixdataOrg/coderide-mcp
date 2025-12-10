/**
 * Codex CLI MCP client configuration handler
 * Note: Codex uses TOML format at ~/.codex/config.toml
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as TOML from '@iarna/toml';
import { ClientHandler, ClientConfig, MCPServerConfig, CODERIDE_SERVER_NAME } from './types.js';

interface CodexTomlConfig {
  mcp_servers?: Record<string, {
    command: string;
    args: string[];
    startup_timeout_sec?: number;
    env?: Record<string, string>;
  }>;
  [key: string]: unknown;
}

export class CodexCLIHandler implements ClientHandler {
  name = 'Codex CLI';
  id = 'codex-cli';

  getConfigPath(): string | null {
    return path.join(os.homedir(), '.codex', 'config.toml');
  }

  isInstalled(): boolean {
    // Check if .codex directory exists
    const codexDir = path.join(os.homedir(), '.codex');
    return fs.existsSync(codexDir);
  }

  readConfig(): ClientConfig | null {
    const configPath = this.getConfigPath();
    if (!configPath || !fs.existsSync(configPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const tomlConfig = TOML.parse(content) as CodexTomlConfig;

      // Convert TOML format to ClientConfig format
      if (tomlConfig.mcp_servers) {
        const mcpServers: Record<string, MCPServerConfig> = {};
        for (const [name, server] of Object.entries(tomlConfig.mcp_servers)) {
          mcpServers[name] = {
            command: server.command,
            args: server.args,
            env: server.env,
          };
        }
        return { mcpServers };
      }
      return { mcpServers: {} };
    } catch {
      return null;
    }
  }

  writeConfig(config: ClientConfig): void {
    const configPath = this.getConfigPath();
    if (!configPath) {
      throw new Error('Could not determine Codex CLI config path');
    }

    // Ensure directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Read existing config to preserve other settings
    let existingConfig: CodexTomlConfig = {};
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        existingConfig = TOML.parse(content) as CodexTomlConfig;

        // Backup existing config
        const backupPath = `${configPath}.backup`;
        fs.copyFileSync(configPath, backupPath);
      } catch {
        // If parsing fails, start fresh but still backup
        const backupPath = `${configPath}.backup`;
        fs.copyFileSync(configPath, backupPath);
      }
    }

    // Convert ClientConfig to TOML format and merge
    const mcpServers = config.mcpServers || {};
    existingConfig.mcp_servers = existingConfig.mcp_servers || {};

    for (const [name, server] of Object.entries(mcpServers)) {
      existingConfig.mcp_servers[name] = {
        command: server.command,
        args: server.args,
        startup_timeout_sec: 20.0,
        env: server.env,
      };
    }

    const tomlString = TOML.stringify(existingConfig as TOML.JsonMap);
    // Write with restrictive permissions (user-only readable/writable)
    fs.writeFileSync(configPath, tomlString, { mode: 0o600 });
  }

  getConfigKey(): 'mcpServers' | 'servers' {
    return 'mcpServers';  // We handle the TOML conversion internally
  }

  /**
   * Write CodeRide config specifically for Codex (uses different format)
   */
  writeCodeRideConfig(apiKey: string): void {
    const configPath = this.getConfigPath();
    if (!configPath) {
      throw new Error('Could not determine Codex CLI config path');
    }

    // Ensure directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Read existing config to preserve other settings
    let existingConfig: CodexTomlConfig = {};
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        existingConfig = TOML.parse(content) as CodexTomlConfig;

        // Backup existing config
        const backupPath = `${configPath}.backup`;
        fs.copyFileSync(configPath, backupPath);
      } catch {
        // If parsing fails, backup and start fresh for mcp_servers
        if (fs.existsSync(configPath)) {
          const backupPath = `${configPath}.backup`;
          fs.copyFileSync(configPath, backupPath);
        }
      }
    }

    // Add CodeRide server config
    existingConfig.mcp_servers = existingConfig.mcp_servers || {};
    existingConfig.mcp_servers[CODERIDE_SERVER_NAME] = {
      command: 'npx',
      args: ['-y', '@coderide/mcp', 'server'],
      startup_timeout_sec: 20.0,
      env: {
        CODERIDE_API_KEY: apiKey,
      },
    };

    const tomlString = TOML.stringify(existingConfig as TOML.JsonMap);
    // Write with restrictive permissions (user-only readable/writable)
    fs.writeFileSync(configPath, tomlString, { mode: 0o600 });
  }
}
