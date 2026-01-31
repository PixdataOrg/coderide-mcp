# tool-search-tool Implementation Plan

**Spec:** .ralph/specs/tool-search-tool.md
**Branch:** feat/tool-search-tool
**Status:** Planning

## Summary

This plan aligns coderide-mcp's tool definitions with Anthropic's tool search tool best practices by:
1. Adding optional `metadata` to the `MCPToolDefinition` interface
2. Standardizing tool naming conventions
3. Improving tool and argument descriptions
4. Adding categorization and tags to all tools
5. Creating contributor documentation

## Current State Analysis

| Area | Current State | Gap |
|------|---------------|-----|
| Tool metadata | No `metadata` field exists | Need to add `MCPToolMetadata` interface |
| Naming convention | `action_target` (e.g., `get_task`) | Already close to spec's `domain_action_target` pattern |
| Descriptions | Mixed quality, some lack "when to use" | Need to standardize all descriptions |
| Input schemas | Descriptive property names exist | Need `description` fields on more properties |
| Tool registration | Centralized in `src/index.ts` | Already meets FR7 |
| Documentation | README has usage, no contributor guide | Need `docs/tools.md` |

## Tasks

### Phase 1: Type System Updates - [complexity: S] ✅ COMPLETED

- [x] FR1-1: Add `MCPToolMetadata` interface to `src/utils/base-tool.ts`
  - Add interface with `category`, `tags`, `usage`, `priority` fields
  - All fields optional to maintain backwards compatibility
  - **Done**: Commit f1fa795

- [x] FR1-2: Extend `MCPToolDefinition` interface with optional `metadata` field
  - Update interface in `src/utils/base-tool.ts`
  - Ensure TypeScript compilation passes
  - **Done**: Commit f1fa795

- [x] FR1-3: Update `BaseTool` class to support metadata
  - Add optional `metadata` abstract/virtual property
  - Update `getMCPToolDefinition()` return type expectations
  - **Done**: Commit f1fa795

### Phase 2: Tool Naming Audit - [complexity: S] ✅ COMPLETED

- [x] FR2-1: Audit current tool names against convention
  - Current tools: `get_task`, `update_task`, `get_project`, `update_project`, `get_prompt`, `start_project`, `list_projects`, `list_tasks`, `next_task`
  - Convention: `domain_action_target` (spec) vs `action_target` (current)
  - Assessment: Current names follow `action_target` pattern which is already clear
  - **Decision**: Keep current names (see .ralph/tool-naming-audit.md)
  - **Done**: Audit completed 2026-01-31

- [x] FR2-2: Document naming convention decision
  - Document the `action_target` pattern as the project convention
  - Justification: Non-breaking, clear, consistent, spec-aligned via metadata
  - **Done**: Documented in .ralph/tool-naming-audit.md

### Phase 3: Description Enhancement - [complexity: M] ✅ COMPLETED

- [x] FR3-1: Enhance `get_task` description with "what + when"
  - **Done**: Commit 14b12ee
- [x] FR3-2: Enhance `update_task` description with "what + when"
  - **Done**: Commit 14b12ee
- [x] FR3-3: Enhance `get_project` description with "what + when"
  - **Done**: Commit 14b12ee
- [x] FR3-4: Enhance `update_project` description with "what + when"
  - **Done**: Commit 14b12ee
- [x] FR3-5: Enhance `get_prompt` description with "what + when"
  - **Done**: Commit 14b12ee
- [x] FR3-6: Enhance `start_project` description with "what + when"
  - **Done**: Commit 14b12ee
- [x] FR3-7: Enhance `list_projects` description with "what + when"
  - **Done**: Commit 14b12ee
- [x] FR3-8: Enhance `list_tasks` description with "what + when"
  - **Done**: Commit 14b12ee
- [x] FR3-9: Enhance `next_task` description with "what + when"
  - **Done**: Commit 14b12ee

### Phase 4: Input Schema Improvement - [complexity: M] ✅ COMPLETED

- [x] FR4-1: Add/improve property descriptions in `get_task` inputSchema
  - **Done**: Commit 82c7c9b
- [x] FR4-2: Add/improve property descriptions in `update_task` inputSchema
  - **Done**: Commit 82c7c9b
- [x] FR4-3: Add/improve property descriptions in `get_project` inputSchema
  - **Done**: Commit 82c7c9b
- [x] FR4-4: Add/improve property descriptions in `update_project` inputSchema
  - **Done**: Commit 82c7c9b
- [x] FR4-5: Add/improve property descriptions in `get_prompt` inputSchema
  - **Done**: Commit 82c7c9b
- [x] FR4-6: Add/improve property descriptions in `start_project` inputSchema
  - **Done**: Commit 82c7c9b
- [x] FR4-7: Add/improve property descriptions in `list_projects` inputSchema (empty schema - no changes needed)
  - **Done**: No changes required - tool has no input parameters by design
- [x] FR4-8: Add/improve property descriptions in `list_tasks` inputSchema
  - **Done**: Commit 82c7c9b
- [x] FR4-9: Add/improve property descriptions in `next_task` inputSchema
  - **Done**: Commit 82c7c9b

### Phase 5: Add Metadata to All Tools - [complexity: M] ✅ COMPLETED

- [x] FR5-1: Add metadata to `get_task`
  - category: `task`
  - tags: `['task', 'fetch', 'details', 'read']`
  - usage: description of when to use
  - priority: `primary`
  - **Done**: Included in Phase 5 commit

- [x] FR5-2: Add metadata to `update_task`
  - category: `task`
  - tags: `['task', 'update', 'status', 'description', 'write']`
  - priority: `primary`
  - **Done**: Included in Phase 5 commit

- [x] FR5-3: Add metadata to `get_project`
  - category: `project`
  - tags: `['project', 'fetch', 'details', 'knowledge', 'read']`
  - priority: `primary`
  - **Done**: Included in Phase 5 commit

- [x] FR5-4: Add metadata to `update_project`
  - category: `project`
  - tags: `['project', 'update', 'knowledge', 'diagram', 'mermaid', 'write']`
  - priority: `primary`
  - **Done**: Included in Phase 5 commit

- [x] FR5-5: Add metadata to `get_prompt`
  - category: `task`
  - tags: `['task', 'prompt', 'instructions', 'ai', 'read']`
  - priority: `primary`
  - **Done**: Included in Phase 5 commit

- [x] FR5-6: Add metadata to `start_project`
  - category: `project`
  - tags: `['project', 'start', 'initialize', 'first-task', 'workflow']`
  - priority: `primary`
  - **Done**: Included in Phase 5 commit

- [x] FR5-7: Add metadata to `list_projects`
  - category: `project`
  - tags: `['project', 'list', 'workspace', 'discovery', 'read']`
  - priority: `primary`
  - **Done**: Included in Phase 5 commit

- [x] FR5-8: Add metadata to `list_tasks`
  - category: `task`
  - tags: `['task', 'list', 'project', 'status', 'read']`
  - priority: `primary`
  - **Done**: Included in Phase 5 commit

- [x] FR5-9: Add metadata to `next_task`
  - category: `task`
  - tags: `['task', 'sequence', 'workflow', 'next', 'automation']`
  - priority: `primary`
  - **Done**: Included in Phase 5 commit

### Phase 6: Documentation - [complexity: M] ✅ COMPLETED

- [x] FR8-1: Create `docs/tools.md` with tool contribution guide
  - Naming convention
  - Description guidelines (what + when)
  - Metadata field reference
  - Complete example with metadata
  - List of recommended category values
  - **Done**: Commit 9f4a2ab

- [x] FR8-2: Update README.md to link to new documentation
  - Add developer section pointing to docs/tools.md
  - **Done**: Commit 9f4a2ab

### Phase 7: Tests - [complexity: M]

- [ ] Test-1: Add TypeScript compilation test (npm run build passes)
- [ ] Test-2: Verify tool count remains unchanged (9 tools)
- [ ] Test-3: Create test to verify all tools have required fields
- [ ] Test-4: Create test to verify primary tools have metadata
- [ ] Test-5: Create test to verify descriptions meet quality standards

### Phase 8: Verification Script - [complexity: S] ✅ COMPLETED

- [x] Verify-1: Create script to enumerate all tools with metadata
  - Located at `scripts/list-tools.ts` or similar
  - Outputs tool name, description, category, tags
  - Useful for verification and documentation
  - **Done**: Commit 1845cf5

## Implementation Notes

### Category Values (Recommended)
Based on the spec and current tool set:
- `project`: Project-level operations (get_project, update_project, start_project, list_projects)
- `task`: Task-level operations (get_task, update_task, get_prompt, list_tasks, next_task)

The spec mentions `code-edit`, `testing`, `navigation`, `repo`, `ai-assist` but these don't apply to the current CodeRide tool set which focuses on task/project management.

### Naming Decision
The spec suggests `domain_action_target` but current names like `get_task` already follow a clear `action_target` pattern. Since:
1. Current names are clear and unambiguous
2. Renaming would be a breaking change for existing clients
3. The pattern is consistent across all 9 tools

**Recommendation**: Document the current `action_target` convention rather than rename tools.

### Backwards Compatibility
- All new fields (`metadata`) are optional
- No changes to tool invocation
- No changes to input/output schemas (only adding descriptions)
- Clients ignoring metadata will continue to work

## Acceptance Criteria Cross-Reference

| Spec Criteria | Plan Task |
|---------------|-----------|
| FR1: Extend tool definition with metadata | Phase 1 |
| FR2: Standardize naming conventions | Phase 2 (document current pattern) |
| FR3: Improve descriptions | Phase 3 |
| FR4: Clarify input schema | Phase 4 |
| FR5: Add metadata to tools | Phase 5 |
| FR6: Maintain backward compatibility | All phases - no breaking changes |
| FR7: Centralized registration | Already satisfied |
| FR8: Documentation | Phase 6 |
| NFR1: Backwards compatible | Optional metadata only |
| NFR2: No performance impact | Static metadata objects |
| NFR3: Maintainability | Types centralized, docs added |
| NFR4: No sensitive data leakage | Review during implementation |

## Done

### Phase 1: Type System Updates - Commit f1fa795
- Added `MCPToolMetadata` interface with `category`, `tags`, `usage`, `priority` fields
- Extended `MCPToolDefinition` interface with optional `metadata` field
- Added `metadata` property to `BaseTool` class
- All fields optional to maintain backwards compatibility
- TypeScript compilation and build passing

### Phase 2: Tool Naming Audit - Commit 99c3640
- Audited all 9 tools against naming convention
- Decision: Keep current `action_target` pattern (non-breaking, clear, consistent)
- Documented in `.ralph/tool-naming-audit.md`
- Justification: Use `metadata.category` for domain grouping instead of renaming tools
- No code changes required - documentation only phase

### Phase 3: Description Enhancement - Commit 14b12ee
- Enhanced all 9 tool descriptions with "what + when" pattern per FR3 spec requirements
- Each tool description now explains both what it does and when to use it
- Changes made to: get_task, update_task, get_project, update_project, get_prompt, start_project, list_projects, list_tasks, next_task
- All descriptions follow consistent pattern: concise "what" statement + practical "when" guidance
- TypeScript compilation and build passing
- No breaking changes - descriptions are backward compatible

### Phase 4: Input Schema Improvement - Commit 82c7c9b
- Enhanced property descriptions in all 9 MCP tools with detailed context
- All property descriptions now include:
  - Format specifications (e.g., 'ABC-123' pattern explanation)
  - Constraint details (e.g., max character limits)
  - Usage guidance (when and why to use each parameter)
  - Relationship context (how properties relate to other tools)
- Tools updated: get_task, update_task, get_project, update_project, get_prompt, start_project, list_tasks, next_task
- list_projects: No changes needed (empty schema by design - no input parameters)
- All changes are additive only - maintains backward compatibility
- TypeScript compilation and build passing

### Phase 5: Add Metadata to All Tools - Commit 4c4ee03
- Added `metadata` property to all 9 MCP tools with complete categorization and tags
- Each tool now includes:
  - category: 'task' or 'project' based on tool domain
  - tags: Relevant searchable keywords (4-6 tags per tool)
  - usage: Practical guidance on when to use the tool
  - priority: 'primary' for all current tools (all are user-facing)
- Tools updated: get_task, update_task, get_project, update_project, get_prompt, start_project, list_projects, list_tasks, next_task
- Updated all getMCPToolDefinition() methods to include metadata in returned objects
- All metadata follows the MCPToolMetadata interface defined in Phase 1
- All changes are additive only - maintains backward compatibility
- TypeScript compilation and build passing
- FR5-1 through FR5-9: All completed

### Phase 6: Documentation - Commit 9f4a2ab
- Created comprehensive `docs/tools.md` with 11KB of tool development guidance
- Documentation includes:
  - Tool naming convention (action_target pattern with examples)
  - Description guidelines (what + when format with concrete examples)
  - Input schema requirements (property naming, descriptions with examples)
  - Complete metadata field reference (category, tags, usage, priority)
  - Full working example showing all best practices
  - Recommended category values table
  - Step-by-step guide for adding new tools
- Updated README.md with new "For Contributors & Developers" section
- Added direct link to docs/tools.md from README
- Documentation provides foundation for contributors to maintain consistency
- TypeScript compilation and build passing
- FR8-1 and FR8-2: Both completed

### Phase 8: Verification Script - Commit 1845cf5
- Created `scripts/list-tools.ts` executable script for tool enumeration
- Script features:
  - Enumerates all 9 tools with complete metadata display
  - Shows name, description, category, priority, tags, and usage for each tool
  - Colored terminal output for better readability
  - Summary statistics showing metadata coverage (9/9 tools = 100%)
  - Breakdown by category (task: 5, project: 4)
  - Breakdown by priority (primary: 9)
- Verified all tools have complete metadata
- Script useful for validation, documentation, and onboarding
- TypeScript compilation and build passing
- Verify-1: Completed
