/**
 * Client detection utilities
 * Detects which MCP clients are installed on the system
 */
import {
  ClientHandler,
  DetectedClient,
  ClaudeDesktopHandler,
  CursorHandler,
  ClaudeCodeHandler,
  VSCodeHandler,
  CodexCLIHandler,
} from './clients/index.js';

// All supported client handlers
const ALL_HANDLERS: ClientHandler[] = [
  new CursorHandler(),
  new ClaudeDesktopHandler(),
  new ClaudeCodeHandler(),
  new VSCodeHandler(),
  new CodexCLIHandler(),
];

/**
 * Detect all installed MCP clients
 */
export function detectInstalledClients(): DetectedClient[] {
  const detected: DetectedClient[] = [];

  for (const handler of ALL_HANDLERS) {
    if (handler.isInstalled()) {
      const configPath = handler.getConfigPath();
      if (configPath) {
        detected.push({
          handler,
          configPath,
          hasExistingConfig: handler.readConfig() !== null,
        });
      }
    }
  }

  return detected;
}

/**
 * Get all available client handlers (regardless of installation status)
 */
export function getAllClientHandlers(): ClientHandler[] {
  return ALL_HANDLERS;
}

/**
 * Get a client handler by ID
 */
export function getClientHandlerById(id: string): ClientHandler | undefined {
  return ALL_HANDLERS.find(h => h.id === id);
}
