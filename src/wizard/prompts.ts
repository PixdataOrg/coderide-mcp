/**
 * Inquirer prompt definitions for the setup wizard
 */
import inquirer from 'inquirer';
import { DetectedClient } from './clients/index.js';

/**
 * Validate API key format
 */
export function validateApiKey(input: string): boolean | string {
  if (!input || input.trim() === '') {
    return 'API key is required';
  }
  if (!input.startsWith('CR_API_KEY_')) {
    return 'Invalid API key format. Key should start with CR_API_KEY_';
  }
  return true;
}

/**
 * Prompt for API key
 */
export async function promptForApiKey(): Promise<string> {
  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Paste in your CodeRide API key:',
      mask: '*',
      validate: validateApiKey,
    },
  ]);
  return apiKey;
}

/**
 * Prompt for client selection
 */
export async function promptForClientSelection(
  detectedClients: DetectedClient[]
): Promise<string[]> {
  if (detectedClients.length === 0) {
    return [];
  }

  const choices = detectedClients.map(client => ({
    name: client.handler.name,
    value: client.handler.id,
    checked: false, // Don't pre-select - let user explicitly choose
  }));

  const { selectedClients } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedClients',
      message: '(Toggle: Space, Confirm: Enter, Toggle All: A, Cancel: CTRL + C)',
      choices,
      validate: (answer: string[]) => {
        if (answer.length === 0) {
          return 'Select at least one client';
        }
        return true;
      },
    },
  ]);

  return selectedClients;
}

/**
 * Prompt for confirmation before writing configs
 */
export async function promptForConfirmation(
  clientNames: string[]
): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Configure CodeRide MCP for: ${clientNames.join(', ')}?`,
      default: true,
    },
  ]);
  return confirmed;
}
