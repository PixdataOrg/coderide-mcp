/**
 * CodeRide MCP Installation Wizard
 * Interactive CLI for configuring MCP clients
 */
import chalk from 'chalk';
import open from 'open';
import { detectInstalledClients, getClientHandlerById } from './client-detector.js';
import { writeConfigToClients, WriteResult } from './config-writer.js';
import { promptForApiKey, promptForClientSelection, validateApiKey } from './prompts.js';

// CodeRide brand colors
const CODERIDE_CYAN = '#53CADE';
const CODERIDE_PURPLE = '#7867EE';
const CODERIDE_DARK = '#113C69';

const cyan = chalk.hex(CODERIDE_CYAN);
const purple = chalk.hex(CODERIDE_PURPLE);
const darkBlue = chalk.hex(CODERIDE_DARK);

const API_KEY_URL = 'https://app.coderide.ai/dashboard/account/api-keys';

/**
 * Print styled messages
 */
function printInfo(message: string): void {
  console.log(cyan('◆'), message);
}

function printSuccess(message: string): void {
  console.log(purple('✓'), message);
}

function printError(message: string): void {
  console.log(chalk.red('✗'), message);
}

function printWarning(message: string): void {
  console.log(chalk.yellow('!'), message);
}

function printStep(step: number, message: string): void {
  console.log(darkBlue(`[${step}/4]`), message);
}

/**
 * Main wizard entry point
 */
export async function runWizard(): Promise<void> {
  console.log();
  console.log(cyan.bold('CodeRide MCP Setup'));
  console.log(darkBlue('Configure your AI coding assistants to work with CodeRide'));
  console.log();

  // Step 1: Detect installed clients
  printStep(1, 'Detecting installed MCP clients...');
  const detectedClients = detectInstalledClients();

  if (detectedClients.length === 0) {
    console.log();
    printWarning('No MCP clients detected on your system.');
    console.log();
    console.log('  Supported clients:');
    console.log('  - Cursor');
    console.log('  - Claude Desktop');
    console.log('  - Claude Code');
    console.log('  - VS Code');
    console.log('  - Codex CLI');
    console.log();
    console.log('  Install one of these clients first, then run this wizard again.');
    process.exit(1);
  }

  console.log(darkBlue(`  Found ${detectedClients.length} client(s): ${detectedClients.map(c => c.handler.name).join(', ')}`));
  console.log();

  // Step 2: Select clients
  printStep(2, 'Select clients to configure');
  const selectedClientIds = await promptForClientSelection(detectedClients);

  if (selectedClientIds.length === 0) {
    console.log();
    printWarning('No clients selected. Exiting.');
    process.exit(0);
  }

  console.log();

  // Step 3: Get API key
  printStep(3, 'Get your CodeRide API key');
  console.log();
  printInfo('Opening CodeRide settings in your browser...');
  console.log(darkBlue('  If the browser did not open, visit:'));
  console.log(`  ${cyan(API_KEY_URL)}`);
  console.log();

  // Try to open browser
  try {
    await open(API_KEY_URL);
  } catch {
    // Silently fail if browser can't be opened
  }

  const apiKey = await promptForApiKey();

  // Validate API key
  const validation = validateApiKey(apiKey);
  if (validation !== true) {
    printError(typeof validation === 'string' ? validation : 'Invalid API key');
    process.exit(1);
  }

  printSuccess('API key validated');
  console.log();

  // Step 4: Write configurations
  printStep(4, 'Writing configuration files');
  console.log();

  const selectedHandlers = selectedClientIds
    .map(id => getClientHandlerById(id))
    .filter((h): h is NonNullable<typeof h> => h !== undefined);

  const results = writeConfigToClients(selectedHandlers, apiKey);

  // Print results
  for (const result of results) {
    if (result.success) {
      printSuccess(`${result.clientName}`);
      console.log(darkBlue(`    ${result.configPath}`));
    } else {
      printError(`${result.clientName}: ${result.error}`);
    }
  }

  console.log();

  // Summary
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  if (successCount > 0) {
    console.log(cyan.bold('Setup complete'));
    console.log(darkBlue(`Configured ${successCount} client(s). Restart your IDE to start using CodeRide.`));
  }

  if (failCount > 0) {
    console.log();
    printWarning(`${failCount} client(s) failed to configure. Check the errors above.`);
  }

  console.log();
}

export { detectInstalledClients, writeConfigToClients };
