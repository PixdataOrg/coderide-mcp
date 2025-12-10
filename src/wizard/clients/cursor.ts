/**
 * Cursor IDE MCP client configuration handler
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ClientHandler, ClientConfig } from './types.js';

export class CursorHandler implements ClientHandler {
  name = 'Cursor';
  id = 'cursor';

  getConfigPath(): string | null {
    // Cursor uses ~/.cursor/mcp.json globally
    return path.join(os.homedir(), '.cursor', 'mcp.json');
  }

  isInstalled(): boolean {
    // Check if .cursor directory exists (indicates Cursor is/was installed)
    const cursorDir = path.join(os.homedir(), '.cursor');
    return fs.existsSync(cursorDir);
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
      throw new Error('Could not determine Cursor config path');
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

    // Write with restrictive permissions (user-only readable/writable)
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
  }

  getConfigKey(): 'mcpServers' | 'servers' {
    return 'mcpServers';
  }
}
