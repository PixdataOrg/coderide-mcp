# Tool Contribution Guide

This guide explains how to create and maintain MCP tools in the CodeRide MCP server, following best practices for tool search alignment and discoverability.

## Table of Contents

- [Tool Definition Overview](#tool-definition-overview)
- [Naming Convention](#naming-convention)
- [Tool Description Guidelines](#tool-description-guidelines)
- [Input Schema Best Practices](#input-schema-best-practices)
- [Metadata Fields](#metadata-fields)
- [Complete Example](#complete-example)
- [Recommended Category Values](#recommended-category-values)
- [Testing Your Tool](#testing-your-tool)

## Tool Definition Overview

All tools in the CodeRide MCP server extend the `BaseTool` abstract class and follow a consistent structure designed for optimal discoverability by AI assistants and tool search systems.

### Required Components

Every tool must implement:

1. **`name`**: Unique tool identifier following naming convention
2. **`description`**: Clear explanation of what the tool does and when to use it
3. **`zodSchema`**: Zod schema for runtime input validation
4. **`metadata`**: Optional categorization and search metadata (recommended)
5. **`execute()`**: Tool execution logic
6. **`getMCPToolDefinition()`**: MCP-compliant tool definition

## Naming Convention

Tool names follow the **`action_target`** pattern for clarity and natural language consistency.

### Pattern

```
{action}_{target}[_{qualifier}]
```

### Examples

- `get_task` - Fetch a specific task
- `update_task` - Modify task properties
- `list_projects` - List all projects
- `next_task` - Get next sequential task

### Guidelines

✅ **DO:**
- Use descriptive action verbs: `get`, `update`, `list`, `create`, `delete`
- Use clear target nouns: `task`, `project`, `prompt`
- Keep names concise but unambiguous
- Use lowercase with underscores (snake_case)

❌ **DON'T:**
- Use generic one-word names: `run`, `execute`, `tool1`
- Use abbreviations without clear meaning: `gtp`, `upd`
- Include the domain in the name: `task_get_task` (use `metadata.category` instead)

## Tool Description Guidelines

Descriptions should follow the **"what + when"** pattern to maximize discoverability and usability.

### Format

```typescript
description: "{What the tool does}. Use this when {when to use it / typical scenarios}."
```

### Example

```typescript
description: "Retrieves detailed information for a specific task using its unique task number (e.g., 'CRD-1'). Use this when you need to understand task requirements, check current status, or gather context before starting work on a task."
```

### Guidelines

✅ **DO:**
- Start with a concrete statement of what the tool does
- Add a second sentence explaining when/why to use it
- Use specific examples where helpful (e.g., `'CRD-1'`)
- Focus on user value and typical workflows

❌ **DON'T:**
- Repeat argument details (those belong in `inputSchema` descriptions)
- Use overly generic text like "Performs operations on code"
- Write excessively long descriptions (aim for 1-2 sentences)

## Input Schema Best Practices

Input schemas should be self-documenting with clear property names and detailed descriptions.

### Property Naming

Use descriptive, semantic property names:

✅ **Good:** `file_path`, `task_number`, `language`, `test_framework`
❌ **Bad:** `f`, `str`, `arg1`, `x`

### Property Descriptions

Each property should include:
- **Format specifications** (e.g., 'ABC-123' pattern)
- **Constraint details** (e.g., max character limits)
- **Usage guidance** (when and why to use)
- **Relationship context** (how it relates to other tools/properties)

### Example

```typescript
inputSchema: {
  type: "object",
  properties: {
    number: {
      type: "string",
      pattern: "^[A-Za-z]{3}-\\d+$",
      description: "The unique task number identifier in format 'ABC-123' where ABC is the three-letter project code and 123 is the task sequence number (e.g., 'CRD-1', 'CDB-42'). Case insensitive - will be converted to uppercase internally."
    },
    status: {
      type: "string",
      enum: ["to-do", "in-progress", "done"],
      description: "The desired status for the task. Use 'to-do' for tasks that haven't started, 'in-progress' for active work, and 'done' when completed. Updating to 'in-progress' signals active work to other team members."
    }
  },
  required: ["number"],
  additionalProperties: false
}
```

## Metadata Fields

The optional `metadata` field enhances tool discoverability without changing MCP protocol compatibility.

### `MCPToolMetadata` Interface

```typescript
interface MCPToolMetadata {
  /**
   * High-level functional area of the tool.
   * Primarily for organization and documentation.
   */
  category?: 'task' | 'project' | string;

  /**
   * Free-form tags to aid indexing and search.
   * Example: ["typescript", "jest", "refactor"]
   */
  tags?: string[];

  /**
   * Short guidance on when to use this tool.
   * Example: "Use when you need to generate unit tests for an existing file."
   */
  usage?: string;

  /**
   * Rough importance/visibility hint for UIs and docs.
   */
  priority?: 'primary' | 'advanced' | 'internal';
}
```

### Field Guidelines

#### `category`
Broad functional domain of the tool. Use for grouping related tools.

**CodeRide MCP Categories:**
- `'task'` - Task-level operations (get_task, update_task, list_tasks)
- `'project'` - Project-level operations (get_project, update_project, list_projects)

#### `tags`
Searchable keywords for tool discovery (4-6 tags recommended).

**Good tags:**
- Action verbs: `'fetch'`, `'update'`, `'create'`
- Data types: `'task'`, `'project'`, `'prompt'`
- Operations: `'read'`, `'write'`, `'list'`
- Workflow: `'workflow'`, `'automation'`, `'sequence'`

#### `usage`
Practical guidance on when to use the tool (1-2 sentences).

**Example:**
```typescript
usage: 'Use when you need to understand task requirements, check current status, or gather context before starting work on a task'
```

#### `priority`
Visibility and importance level.

- `'primary'` - Common user-facing tools
- `'advanced'` - Specialized or less frequent use
- `'internal'` - Development/debugging tools

## Complete Example

Here's a complete tool implementation following all guidelines:

```typescript
import { z } from 'zod';
import { BaseTool, MCPToolDefinition, ToolAnnotations } from '../utils/base-tool.js';
import { SecureApiClient } from '../utils/secure-api-client.js';

/**
 * Schema for the get-task tool input
 */
const GetTaskSchema = z.object({
  number: z.string()
    .regex(/^[A-Za-z]{3}-\d+$/, {
      message: "Task number must be in the format ABC-123 (e.g., CRD-1 or crd-1). Case insensitive."
    })
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
    usage: 'Use when you need to understand task requirements, check current status, or gather context before starting work on a task',
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
      metadata: this.metadata,
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
    // Implementation details...
  }
}
```

## Recommended Category Values

Based on the current CodeRide MCP tool set:

| Category | Use Case | Example Tools |
|----------|----------|---------------|
| `task` | Task-level operations | get_task, update_task, get_prompt, list_tasks, next_task |
| `project` | Project-level operations | get_project, update_project, start_project, list_projects |

For other MCP servers, consider these additional categories:
- `code-edit` - Code editing, refactoring, formatting
- `testing` - Running tests, generating tests
- `navigation` - File tree, project structure, search
- `repo` - Git operations, branches
- `ai-assist` - AI-assisted code generation/manipulation

## Testing Your Tool

Before submitting a new tool, verify:

### 1. Compilation Test
```bash
cd /Users/federiconeri/github/coderide-mcp
npm run build
```

### 2. Type Check
```bash
npx tsc --noEmit
```

### 3. Tool Registration
Ensure your tool is registered in `src/index.ts`:

```typescript
const tools: MCPToolDefinition[] = [
  // ... existing tools
  new YourNewTool(apiClient).getMCPToolDefinition(),
];
```

### 4. Manual Testing
Use the MCP Inspector or your preferred MCP client to:
- [ ] Verify tool appears in tool list
- [ ] Test with valid inputs
- [ ] Test with invalid inputs (validation)
- [ ] Verify error messages are helpful
- [ ] Check that metadata is exposed correctly

### 5. Documentation
- [ ] Tool is listed in README.md with example
- [ ] Input schema is documented
- [ ] Example use cases are provided

## Backwards Compatibility

All metadata fields are **optional**. This ensures:

- ✅ Existing tools work without modification
- ✅ Clients ignoring metadata continue to function
- ✅ No breaking changes to tool invocation
- ✅ Gradual adoption of metadata across tools

When adding new tools or updating existing ones, metadata is **recommended but not required**.

## Best Practices Summary

1. **Naming**: Use `action_target` pattern with clear, descriptive names
2. **Description**: Follow "what + when" pattern (1-2 sentences)
3. **Properties**: Use semantic names with detailed descriptions
4. **Metadata**: Add category, tags, usage, and priority for discoverability
5. **Testing**: Verify compilation, type safety, and runtime behavior
6. **Documentation**: Update README.md with examples and use cases

## Questions or Issues?

- Review existing tools in `src/tools/` for examples
- Check the [MCP specification](https://modelcontextprotocol.io/) for protocol details
- Open an issue if you need clarification on guidelines

---

*This guide reflects the tool search alignment implementation completed in 2026-01-31, based on Anthropic's tool search best practices.*
