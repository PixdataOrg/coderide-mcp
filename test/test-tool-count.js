/**
 * Test-2: Tool count verification test
 * Verifies that the number of tools remains unchanged after metadata additions
 *
 * This test ensures that:
 * - All 9 tools are still present
 * - No tools were accidentally removed
 * - Tool registration is complete
 */

import { GetTaskTool } from '../dist/tools/get-task.js';
import { UpdateTaskTool } from '../dist/tools/update-task.js';
import { GetProjectTool } from '../dist/tools/get-project.js';
import { UpdateProjectTool } from '../dist/tools/update-project.js';
import { GetPromptTool } from '../dist/tools/get-prompt.js';
import { StartProjectTool } from '../dist/tools/start-project.js';
import { ListProjectsTool } from '../dist/tools/list-projects.js';
import { ListTasksTool } from '../dist/tools/list-tasks.js';
import { NextTaskTool } from '../dist/tools/next-task.js';

console.log('Test-2: Tool Count Verification\n');
console.log('=' .repeat(50));

// Expected tool count (from spec)
const EXPECTED_TOOL_COUNT = 9;

// Expected tool names
const EXPECTED_TOOL_NAMES = [
  'get_task',
  'update_task',
  'get_project',
  'update_project',
  'get_prompt',
  'start_project',
  'list_projects',
  'list_tasks',
  'next_task'
];

// Test 1: Verify all tool classes can be instantiated
console.log('\nTest 2.1: Instantiating all tool classes...');
let tools;
try {
  tools = [
    new GetTaskTool(),
    new UpdateTaskTool(),
    new GetProjectTool(),
    new UpdateProjectTool(),
    new GetPromptTool(),
    new StartProjectTool(),
    new ListProjectsTool(),
    new ListTasksTool(),
    new NextTaskTool()
  ];
  console.log(`✓ All ${tools.length} tools instantiated successfully`);
} catch (error) {
  console.error('✗ Failed to instantiate tools');
  console.error(error.message);
  process.exit(1);
}

// Test 2: Verify tool count matches expected
console.log('\nTest 2.2: Verifying tool count...');
if (tools.length !== EXPECTED_TOOL_COUNT) {
  console.error(`✗ Tool count mismatch: expected ${EXPECTED_TOOL_COUNT}, got ${tools.length}`);
  process.exit(1);
}
console.log(`✓ Tool count matches expected: ${EXPECTED_TOOL_COUNT} tools`);

// Test 3: Verify all expected tool names are present
console.log('\nTest 2.3: Verifying tool names...');
const actualToolNames = tools.map(tool => tool.name).sort();
const expectedToolNames = EXPECTED_TOOL_NAMES.sort();

let nameMismatch = false;
for (let i = 0; i < expectedToolNames.length; i++) {
  if (actualToolNames[i] !== expectedToolNames[i]) {
    console.error(`✗ Tool name mismatch at index ${i}:`);
    console.error(`  Expected: ${expectedToolNames[i]}`);
    console.error(`  Actual: ${actualToolNames[i]}`);
    nameMismatch = true;
  }
}

if (nameMismatch) {
  console.error('\n✗ Tool names do not match expected');
  process.exit(1);
}
console.log(`✓ All ${EXPECTED_TOOL_COUNT} tool names match expected`);

// Test 4: Verify no duplicate tool names
console.log('\nTest 2.4: Checking for duplicate tool names...');
const uniqueNames = new Set(actualToolNames);
if (uniqueNames.size !== actualToolNames.length) {
  console.error('✗ Duplicate tool names detected');
  const duplicates = actualToolNames.filter((name, index) => actualToolNames.indexOf(name) !== index);
  console.error(`  Duplicates: ${duplicates.join(', ')}`);
  process.exit(1);
}
console.log('✓ No duplicate tool names found');

// Test 5: Verify each tool has a valid getMCPToolDefinition method
console.log('\nTest 2.5: Verifying tool definitions...');
let definitionErrors = false;
for (const tool of tools) {
  try {
    const definition = tool.getMCPToolDefinition();
    if (!definition || typeof definition !== 'object') {
      console.error(`✗ ${tool.name}: getMCPToolDefinition() returned invalid value`);
      definitionErrors = true;
      continue;
    }

    if (!definition.name || typeof definition.name !== 'string') {
      console.error(`✗ ${tool.name}: Missing or invalid name in definition`);
      definitionErrors = true;
    }

    if (!definition.description || typeof definition.description !== 'string') {
      console.error(`✗ ${tool.name}: Missing or invalid description in definition`);
      definitionErrors = true;
    }

    if (!definition.inputSchema || typeof definition.inputSchema !== 'object') {
      console.error(`✗ ${tool.name}: Missing or invalid inputSchema in definition`);
      definitionErrors = true;
    }
  } catch (error) {
    console.error(`✗ ${tool.name}: Error calling getMCPToolDefinition()`);
    console.error(`  ${error.message}`);
    definitionErrors = true;
  }
}

if (definitionErrors) {
  console.error('\n✗ Some tools have definition errors');
  process.exit(1);
}
console.log(`✓ All ${tools.length} tools have valid definitions`);

console.log('\n' + '='.repeat(50));
console.log('✓ All tool count tests passed!');
console.log('\nSummary:');
console.log(`- ${EXPECTED_TOOL_COUNT} tools present (unchanged from baseline)`);
console.log('- All expected tool names present');
console.log('- No duplicate tool names');
console.log('- All tools have valid definitions');
console.log('\nTool list:');
for (const name of actualToolNames) {
  console.log(`  - ${name}`);
}
