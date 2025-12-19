/**
 * CodeRide MCP Installation Wizard
 * Interactive CLI for configuring MCP clients
 */
import chalk from 'chalk';
import open from 'open';
import { detectInstalledClients, getClientHandlerById } from './client-detector.js';
import { writeConfigToClients } from './config-writer.js';
import { promptForApiKey, promptForClientSelection, validateApiKey } from './prompts.js';

// CodeRide brand colors - only two colors for clean UI
const CODERIDE_CYAN = '#53CADE';
const CODERIDE_PURPLE = '#7867EE';

const cyan = chalk.hex(CODERIDE_CYAN);
const purple = chalk.hex(CODERIDE_PURPLE);

const API_KEY_URL = 'https://app.coderide.ai/dashboard/account/api-keys';

interface WizardOptions {
  openBrowser?: boolean;
  forceAllClients?: boolean;
}

function formatTitle(): void {
  console.log(cyan.bold('== CodeRide =='));
}

function formatFoundClients(count: number, names: string[]): void {
  const joined = names.join(', ');
  console.log(`  Found (${count}): ${joined}`);
}

function formatStatus(
  label: string,
  path: string,
  status: 'ok' | 'unchanged' | 'fail'
): void {
  const statusText =
    status === 'ok'
      ? chalk.green('[OK]')
      : status === 'unchanged'
        ? chalk.blue('[UNCHANGED]')
        : chalk.red('[FAIL]');
  console.log(`  ${statusText} ${label}  ${path}`);
}

/**
 * Main wizard entry point
 */
export async function runWizard(options: WizardOptions = {}): Promise<void> {
  const openBrowser = options.openBrowser !== false;
  const forceAllClients = options.forceAllClients === true;

  console.log();
  formatTitle();
  console.log();

  // Step 1: Detect installed clients
  console.log(purple('> Detecting clients'));
  const detectedClients = detectInstalledClients(forceAllClients);
  const detectedNames = detectedClients.map(c => c.handler.name);

  if (detectedClients.length === 0) {
    console.log('  No MCP clients detected.');
    console.log('  Supported: Cursor, Claude Desktop, Claude Code, VS Code, Codex CLI');
    console.log('  Install a client, then re-run this wizard.');
    console.log();
    process.exit(1);
  }

  formatFoundClients(detectedClients.length, detectedNames);
  console.log();

  // Step 2: Select clients
  console.log(purple('> Select clients (Space toggle, Enter confirm, A toggle all, Ctrl+C cancel)'));
  const selectedClientIds = await promptForClientSelection(detectedClients);

  if (selectedClientIds.length === 0) {
    console.log('  No clients selected. Exiting.');
    console.log();
    process.exit(0);
  }

  // Step 3: Get API key
  console.log();
  console.log(purple('> API key'));
  console.log('  Opening dashboard for API key (or open manually):');
  console.log(`  ${cyan(API_KEY_URL)}`);

  // Try to open browser
  if (openBrowser) {
    try {
      await open(API_KEY_URL);
    } catch {
      console.log('  (Browser not opened; copy URL above)');
    }
  } else {
    console.log('  (Browser open skipped by flag)');
  }

  let apiKey = '';
  while (true) {
    apiKey = await promptForApiKey();
    const validation = validateApiKey(apiKey);
    if (validation === true) {
      break;
    }
    console.log(`  ${chalk.red(typeof validation === 'string' ? validation : 'Invalid API key')}`);
  }
  console.log('  API key validated');

  // Step 4: Write configurations
  console.log();
  console.log(purple('> Write configs'));

  const selectedHandlers = selectedClientIds
    .map(id => getClientHandlerById(id))
    .filter((h): h is NonNullable<typeof h> => h !== undefined);

  const results = writeConfigToClients(selectedHandlers, apiKey);

  // Print results
  console.log();
  for (const result of results) {
    if (result.status === 'ok') {
      formatStatus(result.clientName, result.configPath, 'ok');
    } else if (result.status === 'unchanged') {
      formatStatus(result.clientName, `${result.configPath}  (already configured, unchanged)`, 'unchanged');
    } else {
      formatStatus(result.clientName, `${result.configPath}  (${result.error ?? 'error'})`, 'fail');
    }
  }

  // Summary
  const writtenCount = results.filter(r => r.status === 'ok').length;
  const unchangedCount = results.filter(r => r.status === 'unchanged').length;
  const failCount = results.filter(r => r.status === 'fail').length;

  console.log();
  console.log(purple('> Summary'));

  if (writtenCount + unchangedCount > 0) {
    console.log(`  Configured ${writtenCount}; unchanged ${unchangedCount}; failed ${failCount}.`);
    console.log('  Restart your IDE(s) to start using CodeRide.');
  }

  if (failCount > 0) {
    console.log(`  ${failCount} client(s) failed. See errors above.`);
  }

  console.log();
}

export { detectInstalledClients, writeConfigToClients };
