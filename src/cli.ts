#!/usr/bin/env node
/**
 * CodeRide MCP CLI Entry Point
 *
 * Usage:
 *   npx @coderide/mcp add     - Run the installation wizard
 *   npx @coderide/mcp server  - Start the MCP server (default)
 *   npx @coderide/mcp         - Start the MCP server
 */
import { Command } from 'commander';
import { runWizard } from './wizard/index.js';

const program = new Command();

program
  .name('coderide-mcp')
  .description('CodeRide MCP Server - AI-native task management for coding assistants')
  .version('0.9.3');

program
  .command('add')
  .description('Install CodeRide MCP to your AI coding assistants')
  .action(async () => {
    await runWizard();
  });

program
  .command('server', { isDefault: true })
  .description('Start the MCP server')
  .action(async () => {
    // Dynamically import to avoid loading server code during wizard
    const { startServer } = await import('./index.js');
    await startServer();
  });

program.parse();
