# Tool Search Tool Alignment Feature Specification

**Status:** Planned  
**Version:** 1.0  
**Last Updated:** 2026-01-31  

## Purpose

Align `coderide-mcp`’s tool definitions and structure with Anthropic’s **tool search tool** best practices so that MCP clients/editors (Claude Desktop, Cursor, VS Code, etc.) can efficiently discover and use a flat but well-described set of tools, while remaining fully compatible with clients that do not support tool search.

---

## User Stories

- As a **developer using Claude Desktop/Cursor/VS Code with coderide-mcp**, I want tools to have clear names and descriptions so I can easily pick the right tool for a given task from the client’s tool list or search UI.

- As a **developer exploring coderide-mcp for the first time**, I want tools to be organized with categories/tags and usage hints so I can understand which tools are primary vs. advanced and how they relate to my workflow.

- As a **maintainer of coderide-mcp**, I want a consistent, typed way to add metadata to tools so I can improve discoverability without changing how existing MCP clients call the tools.

- As a **platform that may index coderide-mcp tools for Anthropic-style tool search**, I want tool definitions that use descriptive names, rich descriptions, and clear argument schemas so my search engine can match user intents to appropriate tools.

---

## Requirements

### Functional Requirements

#### FR1: Extend Tool Definition with Search-Friendly Metadata (Non-Breaking)

- Add optional metadata to the existing tool abstraction (`BaseTool` / `MCPToolDefinition`) to improve discoverability, without changing the existing MCP protocol surface.

- **Details:**
  - Introduce a `MCPToolMetadata` interface, e.g.:

    ```ts
    export interface MCPToolMetadata {
      /**
       * High-level functional area of the tool.
       * Primarily for organization and documentation.
       */
      category?: 'project' | 'code-edit' | 'testing' | 'navigation' | 'repo' | 'ai-assist' | string;

      /**
       * Free-form tags to aid indexing and search.
       * Example: ["typescript", "jest", "refactor"].
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

    export interface MCPToolDefinition {
      name: string;
      description: string;
      input_schema: JSONSchema; // existing
      // ... existing fields ...
      metadata?: MCPToolMetadata; // new, optional
    }
    ```

  - Update `BaseTool` (in `src/utils/base-tool.ts` or equivalent) to:
    - Accept optional `metadata` in its constructor or config.
    - Include `metadata` in the result of `toMCPToolDefinition`/`getMCPToolDefinition` (wherever tool definitions are produced).

- **Acceptance Criteria:**
  - [ ] The TypeScript interfaces for tool definitions compile after adding `metadata` and do not require changes to existing tools (no new required fields).
  - [ ] All existing tools build without modification (or with only optional metadata additions).
  - [ ] The JSON emitted to MCP clients still contains valid `name`, `description`, and `input_schema` properties exactly as before; `metadata` is simply additive.

---

#### FR2: Standardize Tool Naming Conventions

- Ensure every tool has a clear, consistent, and descriptive name that reflects its domain and primary action, making it easier for clients and search engines to distinguish tools.

- **Details:**
  - Enforce a naming convention such as `domain_action_target` or `domain_action`:
    - Examples:
      - `project_list_files`, `project_open_file`, `project_search_in_files`
      - `code_generate_tests`, `code_refactor_selection`, `code_format_document`
      - `testing_run_tests`, `testing_run_file_tests`
  - Avoid:
    - Overly generic names (e.g., `run`, `execute`, `tool1`).
    - Names that obscure purpose (e.g., abbreviations without clear meaning).

  - Document the naming convention in the repo (see FR8).

- **Acceptance Criteria:**
  - [ ] A code inspection of `src/tools/*.ts` shows all exported tools follow a consistent naming pattern (e.g., `domain_action_target`).
  - [ ] No tool names are ambiguous one-word verbs or opaque identifiers (e.g., `run` or `doTask`).
  - [ ] At least one example of each domain (`project`, `code-edit`, `testing` if applicable) follows the convention and is referenced in documentation.

---

#### FR3: Improve Tool Descriptions (What + When)

- Each tool must have a concise but informative description that explains what it does and when it should be used.

- **Details:**
  - Description format guidance:
    - First sentence: concrete **what** the tool does.
    - Second sentence (optional but recommended): **when to use** it (typical scenarios).
  - Example:

    ```ts
    description: "Generate unit tests for an existing source file. Use this when you want to quickly scaffold tests for code you have already written."
    ```

  - Avoid:
    - Repeating argument details that are already in JSON schema.
    - Overly generic text like “Performs operations on code”.

- **Acceptance Criteria:**
  - [ ] Every tool has a non-empty `description`.
  - [ ] For at least all primary tools (those marked `priority: 'primary'`), descriptions include both “what” and “when to use it”.
  - [ ] Spot check: at least 3–5 tools’ descriptions can be understood in isolation without reading code or schemas.

---

#### FR4: Clarify Input Schema and Argument Naming

- Make all tool input arguments self-explanatory and suitable for indexing by search tools (names and descriptions carry clear intent).

- **Details:**
  - For each tool’s `input_schema`:
    - Ensure property names are descriptive:
      - Good: `file_path`, `language`, `test_framework`, `search_query`.
      - Avoid: `f`, `str`, `arg1`, `x`.
    - Where appropriate, add `description` fields at:
      - Overall schema level (if supported by current typing/JSON generation).
      - Individual property level for non-obvious parameters.
  - Example:

    ```ts
    input_schema: {
      type: 'object',
      description: 'Parameters for generating tests for a single file.',
      properties: {
        file_path: {
          type: 'string',
          description: 'Absolute or workspace-relative path to the source file to generate tests for.'
        },
        test_framework: {
          type: 'string',
          enum: ['jest', 'vitest', 'mocha'],
          description: 'Preferred test framework for the generated tests.'
        }
      },
      required: ['file_path']
    }
    ```

- **Acceptance Criteria:**
  - [ ] All tool input schemas use descriptive property names (no meaningless short names).
  - [ ] For each tool with more than one argument, at least the non-obvious arguments have a `description` in the schema.
  - [ ] A JSON schema validator (if present in the project) still passes for all tool schemas after adding descriptions.

---

#### FR5: Categorization, Tags, and Usage Metadata

- Use the new `metadata` field to attach lightweight categorization and tags to tools, enhancing their readiness for external indexing.

- **Details:**
  - For each **primary** tool:
    - Set `metadata.category` to an appropriate domain, e.g.:
      - `"project"`: file tree, project structure, search.
      - `"code-edit"`: editing, refactoring, formatting.
      - `"testing"`: running tests, generating tests.
      - `"repo"`: git operations, branches.
      - `"ai-assist"`: AI-assisted code generation/manipulation.
    - Provide at least 2–5 relevant tags, e.g.:

      ```ts
      metadata: {
        category: 'testing',
        tags: ['unit-tests', 'jest', 'typescript'],
        usage: 'Use when you want to automatically scaffold tests for an existing file.',
        priority: 'primary'
      }
      ```

  - For **advanced** or **internal** tools:
    - Optionally set `priority: 'advanced'` or `'internal'`.
    - Tags may emphasize niche or internal usage.

- **Acceptance Criteria:**
  - [ ] All tools that are intended for common user workflows have `metadata` populated with at least `category`, `tags`, and `priority: 'primary'`.
  - [ ] Less frequently used tools either:
    - Have `priority: 'advanced'` or `'internal'`, or
    - Omit `priority`, but are not marked `"primary"`.
  - [ ] A simple script (or log) listing all tools can show category and tags for at least the core set of tools.

---

#### FR6: Keep All Tools Visible and Backward Compatible

- Maintain complete tool visibility and compatibility for MCP clients that do not support tool search; do not hide or remove tools.

- **Details:**
  - Do not introduce any server-side filter that prevents existing tools from being included in the MCP tool list.
  - Any `priority` or `visibility` hints must be **advisory** only (for docs or future client-side UIs), not enforcement.
  - No changes to how tools are invoked or their runtime behavior.

- **Acceptance Criteria:**
  - [ ] Before and after the change, the count of tools exposed by the MCP server remains the same (unless tools were renamed but are functionally equivalent).
  - [ ] A basic MCP client that is unaware of `metadata` continues to function identically (can list and call tools with the same arguments).
  - [ ] No tool returns new required parameters or changes its runtime semantics as a result of this feature.

---

#### FR7: Centralized Tool Registration and Introspection

- Ensure there is a single, canonical definition of all tools and their metadata that can be enumerated programmatically.

- **Details:**
  - In `src/index.ts` (or main MCP entry):
    - Assemble tools into a central array or map, e.g.:

      ```ts
      const tools: MCPToolDefinition[] = [
        projectListFilesTool.getMCPToolDefinition(),
        codeGenerateTestsTool.getMCPToolDefinition(),
        // ...
      ];
      ```

    - Export this collection for use by:
      - MCP server transport (for actual tool exposure).
      - Potential future test or diagnostic scripts that dump the tool catalog.

  - Avoid:
    - Scattered tool registration across multiple files without a central registry.

- **Acceptance Criteria:**
  - [ ] There is a single exported list/collection of tool definitions used to configure the MCP server.
  - [ ] A small script or function can iterate over this list and log each tool’s `name`, `description`, and `metadata` without additional discovery logic.
  - [ ] Adding a new tool requires updating exactly one primary registry location (plus creating the tool implementation).

---

#### FR8: Documentation of Tool Search Alignment and Conventions

- Provide contributor-facing documentation describing how to define tools in a tool-search-friendly way.

- **Details:**
  - Add a section to the main README or a dedicated doc (e.g., `docs/tools.md`) that covers:
    - The naming convention (e.g., `domain_action_target`).
    - Required description style (what + when).
    - Recommended `category` values and examples.
    - Examples of thoughtful `tags` and `usage`.
    - Explanation that metadata is optional and backward compatible.
    - A brief note referencing Anthropic’s tool search best practices and why this metadata helps (without requiring the project to implement tool search server-side).

- **Acceptance Criteria:**
  - [ ] Documentation exists in the repo, version-controlled, and discoverable (linked from README or similar).
  - [ ] The doc includes at least:
    - [ ] One full example tool definition using `metadata`.
    - [ ] A clear naming convention statement.
    - [ ] A list of recommended `category` values.
  - [ ] A new contributor can follow the doc to add a tool that compiles and fits naturally into the tool catalog.

---

### Non-Functional Requirements

#### NFR1: Backwards Compatibility

- [ ] No breaking changes to the MCP protocol: existing fields and schemas remain valid, and clients that ignore `metadata` remain unaffected.
- [ ] There is no requirement for clients to support Anthropic’s tool search tool; the feature enhances the tool catalog only.

#### NFR2: Performance

- [ ] Tool initialization time must not materially increase; metadata creation should be trivial (plain objects).
- [ ] No server-side indexing, BM25, or regex search is introduced; all “search alignment” is via static metadata and naming.

#### NFR3: Maintainability

- [ ] TypeScript interfaces for tools and metadata are centralized and documented.
- [ ] Linting or code review guidelines can refer to the doc for naming and metadata conventions.
- [ ] Adding new fields to `MCPToolMetadata` in the future remains possible without breaking existing tools (kept optional).

#### NFR4: Security & Privacy

- [ ] Descriptions and metadata must not leak sensitive implementation details, internal file paths, or environment-specific data.
- [ ] No new external services or data stores are introduced.

---

## Technical Notes

### Implementation Approach (High-Level Steps)

1. **Update Type Definitions**
   - Modify `src/utils/base-tool.ts` (or wherever `MCPToolDefinition` and `BaseTool` live) to:
     - Add the `MCPToolMetadata` interface.
     - Extend `MCPToolDefinition` with an optional `metadata?: MCPToolMetadata`.
     - Update any helper like `getMCPToolDefinition()` to accept `metadata` (optional) and include it in the returned object.

2. **Refactor Tool Implementations**
   - For tools in `src/tools/*.ts`:
     - Ensure each has:
       - A clear, standardized `name` following the chosen pattern.
       - An improved `description` (what + when).
       - A refined `input_schema` with descriptive argument names, optional `description` fields where relevant.
     - For core tools, add `metadata` with `category`, `tags`, `usage`, and `priority`.

3. **Centralize Tool Registration**
   - In `src/index.ts`:
     - Confirm there is a central array or registry of tools.
     - If not, create one and ensure the MCP server uses it.
     - Optionally, add a small dev-only utility (or log) that enumerates tools and their metadata at startup for verification.

4. **Documentation**
   - Add a doc section describing:
     - Naming convention.
     - Description guidelines.
     - Metadata fields and recommended usage.
   - Include an example:

     ```ts
     const codeGenerateTestsTool = new BaseTool({
       name: 'code_generate_tests',
       description: 'Generate unit tests for an existing source file. Use this when you want to quickly scaffold tests for code you have already written.',
       input_schema: { /* ... */ },
       metadata: {
         category: 'testing',
         tags: ['unit-tests', 'jest', 'typescript', 'generation'],
         usage: 'Given a file path, generate a matching test file using the project’s test framework.',
         priority: 'primary'
       }
     });
     ```

### Key Dependencies / Impacted Areas

- **Impacted files (likely):**
  - `src/index.ts` – MCP server entry, tool registry.
  - `src/utils/base-tool.ts` – tool abstraction and MCP definition generation.
  - `src/tools/*.ts` – individual tool implementations.
  - Docs: `README.md` or `docs/tools.md` (new).

- **No database or external services** are involved.

---

## Acceptance Criteria (Testable)

- [ ] **Compilation Test:** `npm run build` (or equivalent) succeeds after metadata changes without requiring mandatory updates to all tools.
- [ ] **Tool Count Test:** Before/after comparison (via a small script or log) shows the same number of tools are exposed by the MCP server.
- [ ] **Schema Consistency Test:** A sample MCP client (or existing integration tests) can:
  - [ ] Retrieve the tools list and see unchanged core fields (`name`, `description`, `input_schema`).
  - [ ] Ignore `metadata` without errors.
- [ ] **Metadata Presence Test:**
  - [ ] At least 5 core tools (or all tools if fewer than 5 exist) have `metadata.category`, `metadata.tags`, `metadata.usage`, and `metadata.priority`.
- [ ] **Naming Convention Test:** A reviewer or automated check verifies that:
  - [ ] Tool names follow a consistent pattern (e.g., `domain_action_target`).
  - [ ] No tool name is an ambiguous single word like `run` or `execute`.
- [ ] **Description Quality Test:**
  - [ ] For primary tools, descriptions include both what the tool does and when to use it.
- [ ] **Schema Clarity Test:**
  - [ ] All arguments in `input_schema` are descriptively named.
  - [ ] Complex or non-obvious arguments have `description` strings in the schema.
- [ ] **Documentation Test:**
  - [ ] A new contributor following the documentation can implement a new tool with metadata that compiles and matches the conventions.
  - [ ] The doc includes at least one complete example with metadata.
- [ ] **Runtime Sanity Test:**
  - [ ] Run an existing integration test or manual call via an MCP client to confirm tools execute successfully with unchanged behavior.

---

## Out of Scope

- Implementing server-side tool search functionality (e.g., regex or BM25 search endpoints).
- Integrating directly with Anthropic’s Messages API tool search tool (this spec is about making tools index/search friendly, not adding API proxy features).
- Dynamically enabling/disabling tools per project/user context.
- Changes to tool behavior, security model, or argument semantics beyond naming/description clarity.