/**
 * Test-4: Metadata presence verification test
 * Verifies that all primary tools have complete metadata
 *
 * This test ensures that:
 * - All tools have metadata field
 * - Metadata has all required fields (category, tags, usage, priority)
 * - Metadata values are valid and meaningful
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

console.log('Test-4: Metadata Presence Verification\n');
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

// Valid category values per implementation plan
const VALID_CATEGORIES = ['task', 'project'];

// Valid priority values per spec
const VALID_PRIORITIES = ['primary', 'advanced', 'internal'];

let allTestsPassed = true;

// Test 1: Verify all tools have metadata
console.log('\nTest 4.1: Verifying metadata presence on all tools...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();

  if (!definition.metadata) {
    console.error(`✗ ${definition.name}: Missing metadata field`);
    allTestsPassed = false;
    continue;
  }

  if (typeof definition.metadata !== 'object') {
    console.error(`✗ ${definition.name}: metadata is not an object (got ${typeof definition.metadata})`);
    allTestsPassed = false;
  }
}
if (allTestsPassed) {
  console.log(`✓ All ${tools.length} tools have metadata field`);
}

// Test 2: Verify metadata.category field
console.log('\nTest 4.2: Verifying metadata.category field...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();

  if (!definition.metadata) continue; // Skip if already failed in Test 1

  if (!definition.metadata.category) {
    console.error(`✗ ${definition.name}: Missing metadata.category`);
    allTestsPassed = false;
    continue;
  }

  if (typeof definition.metadata.category !== 'string') {
    console.error(`✗ ${definition.name}: metadata.category is not a string`);
    allTestsPassed = false;
    continue;
  }

  // Verify category is one of the expected values
  if (!VALID_CATEGORIES.includes(definition.metadata.category)) {
    console.error(`✗ ${definition.name}: metadata.category "${definition.metadata.category}" not in valid list: ${VALID_CATEGORIES.join(', ')}`);
    allTestsPassed = false;
  }
}
if (allTestsPassed) {
  console.log(`✓ All tools have valid metadata.category field`);
}

// Test 3: Verify metadata.tags field
console.log('\nTest 4.3: Verifying metadata.tags field...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();

  if (!definition.metadata) continue;

  if (!definition.metadata.tags) {
    console.error(`✗ ${definition.name}: Missing metadata.tags`);
    allTestsPassed = false;
    continue;
  }

  if (!Array.isArray(definition.metadata.tags)) {
    console.error(`✗ ${definition.name}: metadata.tags is not an array`);
    allTestsPassed = false;
    continue;
  }

  if (definition.metadata.tags.length === 0) {
    console.error(`✗ ${definition.name}: metadata.tags is empty`);
    allTestsPassed = false;
    continue;
  }

  // Per spec and implementation plan, tags should have 2-6 items
  if (definition.metadata.tags.length < 2) {
    console.error(`✗ ${definition.name}: metadata.tags has too few items (${definition.metadata.tags.length}, expected 2-6)`);
    allTestsPassed = false;
  }

  // Verify all tags are strings
  for (const tag of definition.metadata.tags) {
    if (typeof tag !== 'string') {
      console.error(`✗ ${definition.name}: metadata.tags contains non-string value`);
      allTestsPassed = false;
      break;
    }

    if (tag.trim().length === 0) {
      console.error(`✗ ${definition.name}: metadata.tags contains empty string`);
      allTestsPassed = false;
      break;
    }
  }
}
if (allTestsPassed) {
  console.log(`✓ All tools have valid metadata.tags field`);
}

// Test 4: Verify metadata.usage field
console.log('\nTest 4.4: Verifying metadata.usage field...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();

  if (!definition.metadata) continue;

  if (!definition.metadata.usage) {
    console.error(`✗ ${definition.name}: Missing metadata.usage`);
    allTestsPassed = false;
    continue;
  }

  if (typeof definition.metadata.usage !== 'string') {
    console.error(`✗ ${definition.name}: metadata.usage is not a string`);
    allTestsPassed = false;
    continue;
  }

  if (definition.metadata.usage.trim().length === 0) {
    console.error(`✗ ${definition.name}: metadata.usage is empty`);
    allTestsPassed = false;
    continue;
  }

  // Usage should be substantial (at least 20 characters)
  if (definition.metadata.usage.length < 20) {
    console.error(`✗ ${definition.name}: metadata.usage too short (${definition.metadata.usage.length} chars, expected 20+)`);
    allTestsPassed = false;
  }
}
if (allTestsPassed) {
  console.log(`✓ All tools have valid metadata.usage field`);
}

// Test 5: Verify metadata.priority field
console.log('\nTest 4.5: Verifying metadata.priority field...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();

  if (!definition.metadata) continue;

  if (!definition.metadata.priority) {
    console.error(`✗ ${definition.name}: Missing metadata.priority`);
    allTestsPassed = false;
    continue;
  }

  if (typeof definition.metadata.priority !== 'string') {
    console.error(`✗ ${definition.name}: metadata.priority is not a string`);
    allTestsPassed = false;
    continue;
  }

  // Verify priority is one of the expected values
  if (!VALID_PRIORITIES.includes(definition.metadata.priority)) {
    console.error(`✗ ${definition.name}: metadata.priority "${definition.metadata.priority}" not in valid list: ${VALID_PRIORITIES.join(', ')}`);
    allTestsPassed = false;
  }
}
if (allTestsPassed) {
  console.log(`✓ All tools have valid metadata.priority field`);
}

// Test 6: Display metadata summary
console.log('\nTest 4.6: Metadata summary...');
console.log('\nCategory distribution:');
const categoryCount = {};
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();
  if (!definition.metadata) continue;

  const cat = definition.metadata.category;
  categoryCount[cat] = (categoryCount[cat] || 0) + 1;
}
for (const [cat, count] of Object.entries(categoryCount)) {
  console.log(`  ${cat}: ${count} tools`);
}

console.log('\nPriority distribution:');
const priorityCount = {};
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();
  if (!definition.metadata) continue;

  const priority = definition.metadata.priority;
  priorityCount[priority] = (priorityCount[priority] || 0) + 1;
}
for (const [priority, count] of Object.entries(priorityCount)) {
  console.log(`  ${priority}: ${count} tools`);
}

console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('✓ All metadata presence tests passed!');
  console.log('\nSummary:');
  console.log('- All tools have metadata field');
  console.log('- All tools have valid category field');
  console.log('- All tools have valid tags field (2+ tags)');
  console.log('- All tools have substantial usage field');
  console.log('- All tools have valid priority field');
  console.log(`\nCategories used: ${Object.keys(categoryCount).join(', ')}`);
  console.log(`Priorities used: ${Object.keys(priorityCount).join(', ')}`);
} else {
  console.error('\n✗ Some metadata presence tests failed');
  process.exit(1);
}
