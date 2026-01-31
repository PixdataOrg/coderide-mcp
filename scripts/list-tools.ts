#!/usr/bin/env tsx
/**
 * List Tools Script
 * 
 * Enumerates all MCP tools with their metadata for verification and documentation.
 * This script helps verify that all tools have proper metadata and follow conventions.
 */

// Import all tools
import { GetTaskTool } from '../src/tools/get-task.js';
import { UpdateTaskTool } from '../src/tools/update-task.js';
import { GetProjectTool } from '../src/tools/get-project.js';
import { UpdateProjectTool } from '../src/tools/update-project.js';
import { GetPromptTool } from '../src/tools/get-prompt.js';
import { StartProjectTool } from '../src/tools/start-project.js';
import { ListProjectsTool } from '../src/tools/list-projects.js';
import { ListTasksTool } from '../src/tools/list-tasks.js';
import { NextTaskTool } from '../src/tools/next-task.js';

// Initialize tools (without API client since we're just inspecting metadata)
const tools = [
  new GetTaskTool(),
  new UpdateTaskTool(),
  new GetProjectTool(),
  new UpdateProjectTool(),
  new GetPromptTool(),
  new StartProjectTool(),
  new ListProjectsTool(),
  new ListTasksTool(),
  new NextTaskTool(),
];

/**
 * Format output with colors for better readability
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Main function to list all tools with metadata
 */
function listTools() {
  console.log(`\n${colors.bright}${colors.blue}CodeRide MCP Tools${colors.reset}`);
  console.log(`${colors.gray}${'='.repeat(80)}${colors.reset}\n`);

  console.log(`${colors.bright}Total Tools:${colors.reset} ${tools.length}\n`);

  tools.forEach((tool, index) => {
    const definition = tool.getMCPToolDefinition();
    const metadata = definition.metadata;

    console.log(`${colors.bright}${colors.cyan}${index + 1}. ${definition.name}${colors.reset}`);
    console.log(`   ${colors.gray}Description:${colors.reset} ${definition.description}`);
    
    if (metadata) {
      console.log(`   ${colors.gray}Category:${colors.reset} ${colors.yellow}${metadata.category || 'N/A'}${colors.reset}`);
      console.log(`   ${colors.gray}Priority:${colors.reset} ${colors.green}${metadata.priority || 'N/A'}${colors.reset}`);
      
      if (metadata.tags && metadata.tags.length > 0) {
        console.log(`   ${colors.gray}Tags:${colors.reset} ${metadata.tags.join(', ')}`);
      }
      
      if (metadata.usage) {
        console.log(`   ${colors.gray}Usage:${colors.reset} ${metadata.usage}`);
      }
    } else {
      console.log(`   ${colors.dim}No metadata available${colors.reset}`);
    }
    
    console.log(); // Empty line between tools
  });

  // Summary statistics
  console.log(`${colors.gray}${'='.repeat(80)}${colors.reset}\n`);
  console.log(`${colors.bright}Summary:${colors.reset}`);
  
  const withMetadata = tools.filter(t => t.getMCPToolDefinition().metadata).length;
  const withoutMetadata = tools.length - withMetadata;
  
  console.log(`  Tools with metadata: ${colors.green}${withMetadata}${colors.reset}`);
  console.log(`  Tools without metadata: ${withoutMetadata > 0 ? colors.yellow : colors.green}${withoutMetadata}${colors.reset}`);
  
  // Category breakdown
  const categories = new Map<string, number>();
  tools.forEach(tool => {
    const metadata = tool.getMCPToolDefinition().metadata;
    if (metadata?.category) {
      categories.set(metadata.category, (categories.get(metadata.category) || 0) + 1);
    }
  });
  
  if (categories.size > 0) {
    console.log(`\n${colors.bright}By Category:${colors.reset}`);
    categories.forEach((count, category) => {
      console.log(`  ${category}: ${count}`);
    });
  }
  
  // Priority breakdown
  const priorities = new Map<string, number>();
  tools.forEach(tool => {
    const metadata = tool.getMCPToolDefinition().metadata;
    if (metadata?.priority) {
      priorities.set(metadata.priority, (priorities.get(metadata.priority) || 0) + 1);
    }
  });
  
  if (priorities.size > 0) {
    console.log(`\n${colors.bright}By Priority:${colors.reset}`);
    priorities.forEach((count, priority) => {
      console.log(`  ${priority}: ${count}`);
    });
  }
  
  console.log(); // Final newline
}

// Run the script
listTools();
