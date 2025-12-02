/**
 * Claude Desktop MCP client configuration handler
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ClientHandler, ClientConfig } from './types.js';

export class ClaudeDesktopHandler implements ClientHandler {
  name = 'Claude Desktop';
  id = 'claude-desktop';

  getConfigPath(): string | null {
    const platform = os.platform();
    let configPath: string;

    if (platform === 'darwin') {
      configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    } else if (platform === 'win32') {
      configPath = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
    } else {
      // Linux - Claude Desktop may not be officially supported yet
      configPath = path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
    }

    return configPath;
  }

  isInstalled(): boolean {
    const configPath = this.getConfigPath();
    if (!configPath) return false;

    // Check if the Claude app directory exists (not just the config file)
    const configDir = path.dirname(configPath);
    return fs.existsSync(configDir);
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
      throw new Error('Could not determine Claude Desktop config path');
    }

    // Ensure directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Backup existing config if it exists
    if (fs.existsSync(configPath)) {
      const backupPath = `${configPath}.backup`;
      fs.copyFileSync(configPath, backupPath);
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  getConfigKey(): 'mcpServers' | 'servers' {
    return 'mcpServers';
  }
}
