# Tool Development Guide

This guide explains how to create, modify, and maintain MCP tools in coderide-mcp following our tool search alignment standards.

## Overview

All tools in coderide-mcp are designed to be discoverable and well-documented, following Anthropic's tool search best practices. Each tool extends `BaseTool` and includes:

- Clear, descriptive naming
- Rich descriptions explaining what and when
- Detailed input schema with property descriptions
- Optional metadata for enhanced discoverability

## Tool Naming Convention

**Pattern:** `action_target`

Tools follow a consistent naming pattern that prioritizes clarity and natural language order:

- `get_task` - Retrieves a task
- `update_project` - Updates a project
- `list_tasks` - Lists tasks
- `next_task` - Gets the next task

### Guidelines

- **Use verbs that clearly describe the action:** `get`, `update`, `list`, `start`, `next`
- **Use singular or plural target names as appropriate:** `task` (singular), `tasks` (plural for lists)
- **Keep names concise but clear:** Avoid abbreviations unless widely understood
- **Avoid overly generic names:** Instead of `run` or `execute`, use specific verbs like `start_project`

### Examples

✅ **Good:**
- `get_project` - Clear action and target
- `update_task` - Descriptive and unambiguous
- `list_projects` - Plural indicates a list operation

❌ **Avoid:**
- `run` - Too generic
- `doTask` - Unclear action
- `gt` - Abbreviation not self-explanatory

## Tool Description Guidelines

**Format:** "What it does" + "When to use it"

Each tool description should:

1. **First sentence:** Concretely explain what the tool does
2. **Second sentence:** Describe when to use it (typical scenarios)

### Examples

```typescript
// Good: Clear what + when
description: "Retrieves detailed information for a specific task using its unique task number (e.g., 'CRD-1'). Use this when you need to understand task requirements, check current status, or gather context before starting work on a task."

// Good: Explains both aspects
description: "Updates a project's knowledge graph data and/or its structure diagram (in Mermaid.js format). Use this when you've completed tasks that affect the codebase architecture, discovered new patterns, or need to document implementation impacts."
```

### Guidelines

- **Be specific, not generic:** Avoid "Performs operations on code"
- **Include concrete examples:** Show format examples like `'CRD-1'` or `'ABC-123'`
- **Don't repeat argument details:** Those belong in the input schema
- **Focus on user scenarios:** Help users understand when this tool applies

## Input Schema Requirements

### Property Naming

Use descriptive, self-explanatory property names:

✅ **Good:**
- `file_path` - Clear and specific
- `task_number` - Descriptive
- `search_query` - Unambiguous

❌ **Avoid:**
- `f` - Too short
- `str` - Generic type name
- `arg1` - Meaningless

### Property Descriptions

Every property should have a description that includes:

1. **Format specification:** How the value should be formatted
2. **Constraints:** Max length, allowed values, patterns
3. **Usage guidance:** When and why to use this parameter
4. **Examples:** Concrete examples showing the expected format

### Example

```typescript
inputSchema: {
  type: 'object',
  properties: {
    number: {
      type: 'string',
      pattern: '^[A-Za-z]{3}-\\d+$',
      description: "The unique task number identifier in format 'ABC-123' where ABC is the three-letter project code and 123 is the task sequence number (e.g., 'CRD-1', 'CDB-42'). Case insensitive - will be converted to uppercase internally."
    },
    status: {
      type: 'string',
      enum: ['to-do', 'in-progress', 'completed'],
      description: "The task status. Must be one of: 'to-do' (task not started), 'in-progress' (currently being worked on), or 'completed' (task finished). Use 'in-progress' when starting work and 'completed' when done."
    }
  },
  required: ['number']
}
```

## Metadata Fields

Metadata enhances tool discoverability and is **optional but recommended** for all tools.

### Structure

```typescript
readonly metadata = {
  category: 'task' as const,
  tags: ['task', 'fetch', 'details', 'read'],
  usage: 'Use when you need to understand task requirements, check current status, or gather context before starting work',
  priority: 'primary' as const
};
```

### Field Reference

#### `category` (optional)

High-level functional area of the tool. Use one of these recommended values:

- **`project`** - Project-level operations (get_project, update_project, start_project, list_projects)
- **`task`** - Task-level operations (get_task, update_task, list_tasks, next_task)

For coderide-mcp, these are the two main categories. Other projects might use:
- `code-edit` - Code editing, refactoring, formatting
- `testing` - Test execution, generation
- `navigation` - File tree, code search
- `repo` - Git operations, branches
- `ai-assist` - AI-assisted operations

#### `tags` (optional)

Array of 2-5 relevant keywords for indexing and search. Include:

- Domain tag (matches category): `task`, `project`
- Action tag: `fetch`, `update`, `list`, `start`
- Data type tags: `status`, `knowledge`, `diagram`
- Operation type: `read`, `write`

**Examples:**
```typescript
// get_task
tags: ['task', 'fetch', 'details', 'read']

// update_project
tags: ['project', 'update', 'knowledge', 'diagram', 'mermaid', 'write']

// list_tasks
tags: ['task', 'list', 'project', 'status', 'read']
```

#### `usage` (optional)

Short guidance on when to use this tool. Should align with the "when" part of the description but be more concise.

**Examples:**
```typescript
usage: 'Use when you need to understand task requirements, check current status, or gather context before starting work'

usage: 'Use after completing a task to automatically find and transition to the next task in the project workflow'
```

#### `priority` (optional)

Visibility/importance hint:

- **`primary`** - Core user-facing tools (most tools should be primary)
- **`advanced`** - Less frequently used or power-user tools
- **`internal`** - Internal/debugging tools

For coderide-mcp, all 9 tools are marked as `primary`.

## Complete Tool Example

Here's a complete example of a well-structured tool:

```typescript
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations } from '../utils/base-tool.js';
import { SecureApiClient } from '../utils/secure-api-client.js';

/**
 * Schema for the get-task tool input
 */
const GetTaskSchema = z.object({
  number: z.string()
    .regex(/^[A-Za-z]{3}-\d+$/, { message: "Task number must be in the format ABC-123" })
    .describe("Task number identifier (e.g., 'CRD-1')"),
}).strict();

type GetTaskInput = z.infer<typeof GetTaskSchema>;

/**
 * Get Task Tool Implementation
 */
export class GetTaskTool extends BaseTool<typeof GetTaskSchema> {
  readonly name = 'get_task';
  readonly description = "Retrieves detailed information for a specific task using its unique task number (e.g., 'CRD-1'). Use this when you need to understand task requirements, check current status, or gather context before starting work on a task.";
  readonly zodSchema = GetTaskSchema;
  readonly annotations: ToolAnnotations = {
    title: "Get Task",
    readOnlyHint: true,
    openWorldHint: true,
  };
  readonly metadata = {
    category: 'task' as const,
    tags: ['task', 'fetch', 'details', 'read'],
    usage: 'Use when you need to understand task requirements, check current status, or gather context before starting work',
    priority: 'primary' as const
  };

  constructor(apiClient?: SecureApiClient) {
    super(apiClient);
  }

  getMCPToolDefinition(): MCPToolDefinition {
    return {
      name: this.name,
      description: this.description,
      annotations: this.annotations,
      metadata: this.metadata, // IMPORTANT: Include metadata in definition
      inputSchema: {
        type: "object",
        properties: {
          number: {
            type: "string",
            pattern: "^[A-Za-z]{3}-\\d+$",
            description: "The unique task number identifier in format 'ABC-123' where ABC is the three-letter project code and 123 is the task sequence number (e.g., 'CRD-1', 'CDB-42'). Case insensitive - will be converted to uppercase internally."
          }
        },
        required: ["number"],
        additionalProperties: false
      }
    };
  }

  async execute(input: GetTaskInput): Promise<unknown> {
    // Implementation here
    return {};
  }
}
```

## Adding a New Tool

Follow these steps to add a new tool:

1. **Create the tool file** in `src/tools/your-tool.ts`
2. **Define the Zod schema** with descriptive property names and `.describe()` calls
3. **Implement the tool class** extending `BaseTool`
4. **Add metadata** with category, tags, usage, and priority
5. **Implement `getMCPToolDefinition()`** including `metadata: this.metadata`
6. **Implement `execute()`** with your tool logic
7. **Register the tool** in `src/index.ts` by adding it to the tools array
8. **Test the tool** using the MCP inspector or integration tests

## Backwards Compatibility

All metadata fields are **optional** to maintain backwards compatibility:

- Tools without metadata continue to work normally
- Clients that don't support metadata ignore the field
- No changes to tool invocation or runtime behavior
- Input/output schemas remain unchanged

## Tool Search Alignment

This metadata structure aligns with Anthropic's tool search best practices:

- **Descriptive names** help clients match user intent to tools
- **Rich descriptions** provide context for search engines
- **Detailed schemas** enable argument-based matching
- **Metadata tags** improve indexing and filtering
- **Category grouping** aids organization and discovery

While coderide-mcp doesn't implement server-side tool search, following these practices ensures tools are ready for clients that do support advanced tool discovery features.

## Recommended Category Values

Based on the spec and current tool set:

| Category | Usage |
|----------|-------|
| `project` | Project-level operations (get_project, update_project, start_project, list_projects) |
| `task` | Task-level operations (get_task, update_task, get_prompt, list_tasks, next_task) |

Other potential categories for different MCP servers:

| Category | Usage |
|----------|-------|
| `code-edit` | Code editing, refactoring, formatting |
| `testing` | Running tests, generating tests |
| `navigation` | File tree, project structure, code search |
| `repo` | Git operations, branches, commits |
| `ai-assist` | AI-assisted code generation/manipulation |

## References

- [Tool Search Tool Specification](../.ralph/specs/tool-search-tool.md) - Detailed requirements
- [Implementation Plan](../.ralph/specs/tool-search-tool-implementation-plan.md) - Development phases
- [Anthropic's MCP Documentation](https://modelcontextprotocol.io/) - Official MCP guide
- [BaseTool Source](../src/utils/base-tool.ts) - Base class implementation
