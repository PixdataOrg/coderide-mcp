/**
 * CodeRide MCP Installation Wizard
 * Interactive CLI for configuring MCP clients
 */
import chalk from 'chalk';
import open from 'open';
import { detectInstalledClients, getClientHandlerById } from './client-detector.js';
import { writeConfigToClients, WriteResult } from './config-writer.js';
import { promptForApiKey, promptForClientSelection, validateApiKey } from './prompts.js';

// CodeRide brand color
const CODERIDE_COLOR = '#54CADE';
const coderideCyan = chalk.hex(CODERIDE_COLOR);

const API_KEY_URL = 'https://app.coderide.ai/dashboard/account/api-keys';

/**
 * Print styled message
 */
function printInfo(message: string): void {
  console.log(coderideCyan('◆'), message);
}

function printSuccess(message: string): void {
  console.log(chalk.green('✓'), message);
}

function printError(message: string): void {
  console.log(chalk.red('✗'), message);
}

function printWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Main wizard entry point
 */
export async function runWizard(): Promise<void> {
  console.log();
  console.log(coderideCyan.bold('CodeRide MCP Setup'));
  console.log();

  // Step 1: Detect installed clients
  const detectedClients = detectInstalledClients();

  if (detectedClients.length === 0) {
    printWarning('No MCP clients detected on your system.');
    console.log();
    console.log('Supported clients: Cursor, Claude Desktop, Claude Code, VS Code, Codex CLI');
    console.log('Please install one of these clients first, then run this wizard again.');
    process.exit(1);
  }

  // Step 2: Select clients
  const selectedClientIds = await promptForClientSelection(detectedClients);

  if (selectedClientIds.length === 0) {
    printWarning('No clients selected. Exiting.');
    process.exit(0);
  }

  console.log();

  // Step 3: Open browser for API key
  printInfo('Opened your project settings. If the link didn\'t open automatically, open the following URL');
  console.log('  in your browser to get an API key:');
  console.log();
  console.log(coderideCyan(API_KEY_URL));
  console.log();

  // Try to open browser
  try {
    await open(API_KEY_URL);
  } catch {
    // Silently fail if browser can't be opened
  }

  // Step 4: Get API key
  const apiKey = await promptForApiKey();

  // Validate API key
  const validation = validateApiKey(apiKey);
  if (validation !== true) {
    printError(typeof validation === 'string' ? validation : 'Invalid API key');
    process.exit(1);
  }

  console.log();
  printSuccess('API key validated');
  console.log();

  // Step 5: Write configurations
  printInfo('Writing configuration...');

  const selectedHandlers = selectedClientIds
    .map(id => getClientHandlerById(id))
    .filter((h): h is NonNullable<typeof h> => h !== undefined);

  const results = writeConfigToClients(selectedHandlers, apiKey);

  // Print results
  for (const result of results) {
    if (result.success) {
      printSuccess(result.clientName);
    } else {
      printError(`${result.clientName}: ${result.error}`);
    }
  }

  console.log();

  // Step 6: Summary
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  if (successCount > 0) {
    printInfo('Setup complete! Restart your IDE to start using CodeRide.');
  }

  if (failCount > 0) {
    console.log();
    printWarning(`${failCount} client(s) failed to configure. Check the errors above.`);
  }

  console.log();
}

export { detectInstalledClients, writeConfigToClients };
