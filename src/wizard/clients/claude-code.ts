/**
 * Claude Code MCP client configuration handler
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ClientHandler, ClientConfig } from './types.js';

export class ClaudeCodeHandler implements ClientHandler {
  name = 'Claude Code';
  id = 'claude-code';

  getConfigPath(): string | null {
    // Claude Code uses ~/.claude/settings.json
    return path.join(os.homedir(), '.claude', 'settings.json');
  }

  isInstalled(): boolean {
    // Check if .claude directory exists
    const claudeDir = path.join(os.homedir(), '.claude');
    return fs.existsSync(claudeDir);
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
      throw new Error('Could not determine Claude Code config path');
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
