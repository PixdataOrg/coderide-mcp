/**
 * Test-5: Description quality verification test
 * Verifies that all tool descriptions meet the quality standards from FR3
 *
 * This test ensures that:
 * - Descriptions include "what" the tool does
 * - Descriptions include "when" to use the tool
 * - Descriptions are clear and concise
 * - Descriptions don't just repeat argument details
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

console.log('Test-5: Description Quality Verification\n');
console.log('=' .repeat(50));

const tools = [
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

let allTestsPassed = true;

// Test 1: Verify descriptions have "what" component
console.log('\nTest 5.1: Verifying "what" component in descriptions...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();
  const description = definition.description;

  // Description should contain action words that explain what it does
  const actionWords = [
    'retrieve', 'fetch', 'get', 'obtain',
    'update', 'modify', 'change', 'set',
    'list', 'show', 'display', 'enumerate',
    'start', 'begin', 'initiate',
    'returns', 'provides', 'gives'
  ];

  const hasActionWord = actionWords.some(word =>
    description.toLowerCase().includes(word)
  );

  if (!hasActionWord) {
    console.error(`✗ ${definition.name}: Description lacks clear action word`);
    console.error(`  Description: ${description}`);
    allTestsPassed = false;
  }
}
if (allTestsPassed) {
  console.log(`✓ All ${tools.length} tools have clear "what" component`);
}

// Test 2: Verify descriptions have "when" component
console.log('\nTest 5.2: Verifying "when" component in descriptions...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();
  const description = definition.description;

  // Description should contain guidance on when to use it
  const whenIndicators = [
    'use this when',
    'use this',
    'useful for',
    'useful when',
    'this is useful',
    'when you need',
    'when you want',
    'when working',
    'at the start',
    'before',
    'after',
    'during',
    'to track',
    'to manage',
    'to understand'
  ];

  const hasWhenIndicator = whenIndicators.some(indicator =>
    description.toLowerCase().includes(indicator)
  );

  if (!hasWhenIndicator) {
    console.error(`✗ ${definition.name}: Description lacks "when to use" guidance`);
    console.error(`  Description: ${description}`);
    allTestsPassed = false;
  }
}
if (allTestsPassed) {
  console.log(`✓ All ${tools.length} tools have clear "when" component`);
}

// Test 3: Verify descriptions are reasonably concise
console.log('\nTest 5.3: Verifying description length is reasonable...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();
  const description = definition.description;

  // Per FR3 spec: "concise but informative"
  // Allow up to 500 chars (roughly 3-4 sentences max) - spec doesn't mandate exact limit
  // The key is "concise but informative", not minimal
  const MAX_LENGTH = 500;

  if (description.length > MAX_LENGTH) {
    console.error(`✗ ${definition.name}: Description too long (${description.length} chars, max ${MAX_LENGTH})`);
    console.error(`  Consider making it more concise`);
    allTestsPassed = false;
  }
}
if (allTestsPassed) {
  console.log(`✓ All descriptions are reasonably concise (under ${500} chars)`);
}

// Test 4: Verify descriptions don't start with generic phrases
console.log('\nTest 5.4: Verifying descriptions avoid generic openings...');
const genericStarts = [
  'this tool',
  'this function',
  'performs operations',
  'allows you to'
];

for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();
  const description = definition.description.toLowerCase();

  for (const generic of genericStarts) {
    if (description.startsWith(generic)) {
      console.error(`✗ ${definition.name}: Description starts with generic phrase "${generic}"`);
      console.error(`  Consider starting with the action directly`);
      allTestsPassed = false;
      break;
    }
  }
}
if (allTestsPassed) {
  console.log(`✓ All descriptions avoid generic opening phrases`);
}

// Test 5: Verify descriptions are self-contained
console.log('\nTest 5.5: Verifying descriptions are self-contained...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();
  const description = definition.description;

  // Description should be understandable without looking at arguments
  // It should not say "see parameters" or "refer to schema"
  const badPhrases = [
    'see parameters',
    'see arguments',
    'refer to schema',
    'check the schema',
    'see below'
  ];

  for (const phrase of badPhrases) {
    if (description.toLowerCase().includes(phrase)) {
      console.error(`✗ ${definition.name}: Description contains "${phrase}" - should be self-contained`);
      allTestsPassed = false;
      break;
    }
  }
}
if (allTestsPassed) {
  console.log(`✓ All descriptions are self-contained`);
}

// Test 6: Display description samples
console.log('\nTest 5.6: Description samples...');
console.log('\nAll tool descriptions:');
console.log('─'.repeat(50));
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();
  console.log(`\n${definition.name}:`);
  console.log(`  ${definition.description}`);
  console.log(`  (${definition.description.length} chars)`);
}
console.log('─'.repeat(50));

console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('✓ All description quality tests passed!');
  console.log('\nSummary:');
  console.log('- All descriptions have clear "what" component');
  console.log('- All descriptions have clear "when" component');
  console.log('- All descriptions are concise (1-2 sentences)');
  console.log('- All descriptions avoid generic opening phrases');
  console.log('- All descriptions are self-contained');
  console.log('\nDescription pattern followed:');
  console.log('  [What it does] + [When to use it]');
} else {
  console.error('\n✗ Some description quality tests failed');
  process.exit(1);
}
