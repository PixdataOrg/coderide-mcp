/**
 * VS Code MCP client configuration handler
 * Note: VS Code uses workspace-level configuration in .vscode/mcp.json
 */
import * as fs from 'fs';
import * as path from 'path';
import { ClientHandler, ClientConfig } from './types.js';

export class VSCodeHandler implements ClientHandler {
  name = 'VS Code';
  id = 'vscode';

  getConfigPath(): string | null {
    // VS Code uses workspace-level config at .vscode/mcp.json
    // We use the current working directory as the workspace
    return path.join(process.cwd(), '.vscode', 'mcp.json');
  }

  isInstalled(): boolean {
    // VS Code is considered "installed" if we're in a directory with .vscode
    // or if the user wants to create the config
    // For the wizard, we'll always show VS Code as an option
    return true;
  }

  readConfig(): ClientConfig | null {
    const configPath = this.getConfigPath();
    if (!configPath || !fs.existsSync(configPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content) as ClientConfig;
    } catch {
      return null;
    }
  }

  writeConfig(config: ClientConfig): void {
    const configPath = this.getConfigPath();
    if (!configPath) {
      throw new Error('Could not determine VS Code config path');
    }

    // Ensure .vscode directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Backup existing config if it exists
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup`;
      fs.copyFileSync(configPath, backupPath);
    }

    // Write with restrictive permissions (user-only readable/writable)
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
  }

  getConfigKey(): 'mcpServers' | 'servers' {
    // VS Code uses 'servers' instead of 'mcpServers'
    return 'servers';
  }
}
