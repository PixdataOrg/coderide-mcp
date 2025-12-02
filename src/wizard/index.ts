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

/**
 * Main wizard entry point
 */
export async function runWizard(): Promise<void> {
  console.log();
  console.log(cyan.bold('CodeRide MCP Setup'));
  console.log();

  // Step 1: Detect installed clients
  const detectedClients = detectInstalledClients();

  if (detectedClients.length === 0) {
    console.log(purple('◆'), 'No MCP clients detected on your system.');
    console.log('│');
    console.log('│  Supported clients: Cursor, Claude Desktop, Claude Code, VS Code, Codex CLI');
    console.log('│  Install one of these clients first, then run this wizard again.');
    console.log();
    process.exit(1);
  }

  console.log(purple('◇'), 'Detecting installed MCP clients...');
  console.log('│  Found:', cyan(detectedClients.map(c => c.handler.name).join(', ')));
  console.log('│');

  // Step 2: Select clients
  console.log(purple('◆'), 'Select which MCP clients to configure:');
  const selectedClientIds = await promptForClientSelection(detectedClients);

  if (selectedClientIds.length === 0) {
    console.log('│');
    console.log(purple('◆'), 'No clients selected. Exiting.');
    console.log();
    process.exit(0);
  }

  console.log('│');

  // Step 3: Get API key
  console.log(purple('◆'), 'Opened your project settings. If the link didn\'t open automatically, open the following URL');
  console.log('│  in your browser to get an API key:');
  console.log('│');
  console.log(cyan(API_KEY_URL));
  console.log('│');

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
    console.log(purple('◆'), chalk.red(typeof validation === 'string' ? validation : 'Invalid API key'));
    process.exit(1);
  }

  console.log(purple('◇'), 'API key validated');
  console.log('│');

  // Step 4: Write configurations
  console.log(purple('◆'), 'Writing configuration...');

  const selectedHandlers = selectedClientIds
    .map(id => getClientHandlerById(id))
    .filter((h): h is NonNullable<typeof h> => h !== undefined);

  const results = writeConfigToClients(selectedHandlers, apiKey);

  // Print results
  for (const result of results) {
    if (result.success) {
      console.log(purple('◇'), result.clientName);
      console.log('│ ', cyan(result.configPath));
    } else {
      console.log(purple('◆'), chalk.red(`${result.clientName}: ${result.error}`));
    }
  }

  console.log('│');

  // Summary
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  if (successCount > 0) {
    console.log(cyan.bold('Setup complete'));
    console.log(`Configured ${successCount} client(s). Restart your IDE to start using CodeRide.`);
  }

  if (failCount > 0) {
    console.log();
    console.log(purple('◆'), `${failCount} client(s) failed to configure. Check the errors above.`);
  }

  console.log();
}

export { detectInstalledClients, writeConfigToClients };
