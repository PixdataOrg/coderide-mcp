/**
 * Test-3: Required fields verification test
 * Verifies that all tools have the required fields per MCP specification
 *
 * This test ensures that:
 * - All tools have name, description, and inputSchema
 * - Field types are correct
 * - No required fields are missing
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

console.log('Test-3: Required Fields Verification\n');
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

// Test 1: Verify name field
console.log('\nTest 3.1: Verifying name field on all tools...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();

  if (!definition.name) {
    console.error(`✗ ${tool.constructor.name}: Missing name field`);
    allTestsPassed = false;
    continue;
  }

  if (typeof definition.name !== 'string') {
    console.error(`✗ ${tool.constructor.name}: name is not a string (got ${typeof definition.name})`);
    allTestsPassed = false;
    continue;
  }

  if (definition.name.trim().length === 0) {
    console.error(`✗ ${tool.constructor.name}: name is empty`);
    allTestsPassed = false;
    continue;
  }

  // Verify naming convention (action_target pattern)
  if (!/^[a-z]+_[a-z_]+$/.test(definition.name)) {
    console.error(`✗ ${tool.constructor.name}: name "${definition.name}" doesn't follow action_target pattern`);
    allTestsPassed = false;
  }
}
if (allTestsPassed) {
  console.log(`✓ All ${tools.length} tools have valid name field`);
}

// Test 2: Verify description field
console.log('\nTest 3.2: Verifying description field on all tools...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();

  if (!definition.description) {
    console.error(`✗ ${definition.name}: Missing description field`);
    allTestsPassed = false;
    continue;
  }

  if (typeof definition.description !== 'string') {
    console.error(`✗ ${definition.name}: description is not a string (got ${typeof definition.description})`);
    allTestsPassed = false;
    continue;
  }

  if (definition.description.trim().length === 0) {
    console.error(`✗ ${definition.name}: description is empty`);
    allTestsPassed = false;
    continue;
  }

  // Description should be reasonably substantial (at least 20 characters)
  if (definition.description.length < 20) {
    console.error(`✗ ${definition.name}: description too short (${definition.description.length} chars)`);
    allTestsPassed = false;
  }
}
if (allTestsPassed) {
  console.log(`✓ All ${tools.length} tools have valid description field`);
}

// Test 3: Verify inputSchema field
console.log('\nTest 3.3: Verifying inputSchema field on all tools...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();

  if (!definition.inputSchema) {
    console.error(`✗ ${definition.name}: Missing inputSchema field`);
    allTestsPassed = false;
    continue;
  }

  if (typeof definition.inputSchema !== 'object') {
    console.error(`✗ ${definition.name}: inputSchema is not an object (got ${typeof definition.inputSchema})`);
    allTestsPassed = false;
    continue;
  }

  // Verify inputSchema has required properties
  if (!definition.inputSchema.type) {
    console.error(`✗ ${definition.name}: inputSchema missing type field`);
    allTestsPassed = false;
  }

  if (definition.inputSchema.type !== 'object') {
    console.error(`✗ ${definition.name}: inputSchema type is not "object" (got "${definition.inputSchema.type}")`);
    allTestsPassed = false;
  }

  // inputSchema should have properties or be an empty object
  if (definition.inputSchema.properties && typeof definition.inputSchema.properties !== 'object') {
    console.error(`✗ ${definition.name}: inputSchema.properties is not an object`);
    allTestsPassed = false;
  }
}
if (allTestsPassed) {
  console.log(`✓ All ${tools.length} tools have valid inputSchema field`);
}

// Test 4: Verify inputSchema property descriptions
console.log('\nTest 3.4: Verifying inputSchema property descriptions...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();

  if (!definition.inputSchema.properties) {
    // Tools like list_projects have no properties - this is valid
    continue;
  }

  for (const [propName, propSchema] of Object.entries(definition.inputSchema.properties)) {
    // Each property should have a description (per FR4)
    if (!propSchema.description || typeof propSchema.description !== 'string') {
      console.error(`✗ ${definition.name}: Property "${propName}" missing description`);
      allTestsPassed = false;
      continue;
    }

    // Description should be substantial (at least 10 characters)
    if (propSchema.description.length < 10) {
      console.error(`✗ ${definition.name}: Property "${propName}" description too short`);
      allTestsPassed = false;
    }

    // Property names should be descriptive (not single char)
    if (propName.length === 1) {
      console.error(`✗ ${definition.name}: Property name "${propName}" is too short (single character)`);
      allTestsPassed = false;
    }
  }
}
if (allTestsPassed) {
  console.log('✓ All input properties have valid descriptions');
}

// Test 5: Verify required field consistency
console.log('\nTest 3.5: Verifying required field consistency...');
for (const tool of tools) {
  const definition = tool.getMCPToolDefinition();

  if (definition.inputSchema.required) {
    if (!Array.isArray(definition.inputSchema.required)) {
      console.error(`✗ ${definition.name}: inputSchema.required is not an array`);
      allTestsPassed = false;
      continue;
    }

    // All required fields should exist in properties
    for (const requiredField of definition.inputSchema.required) {
      if (!definition.inputSchema.properties || !definition.inputSchema.properties[requiredField]) {
        console.error(`✗ ${definition.name}: Required field "${requiredField}" not found in properties`);
        allTestsPassed = false;
      }
    }
  }
}
if (allTestsPassed) {
  console.log('✓ All required field references are valid');
}

console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('✓ All required field tests passed!');
  console.log('\nSummary:');
  console.log('- All tools have valid name fields (action_target pattern)');
  console.log('- All tools have substantial description fields');
  console.log('- All tools have valid inputSchema fields');
  console.log('- All input properties have descriptions');
  console.log('- All required field references are valid');
} else {
  console.error('\n✗ Some required field tests failed');
  process.exit(1);
}
