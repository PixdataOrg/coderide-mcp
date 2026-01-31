# Tool Naming Audit - FR2

**Date:** 2026-01-31
**Feature:** tool-search-tool
**Phase:** 2 - Tool Naming Audit

## Current Tool Names

All 9 tools in coderide-mcp follow a consistent `action_target` naming pattern:

| Tool Name | Pattern Analysis | Domain |
|-----------|-----------------|---------|
| `get_task` | `get` + `task` | Task operations |
| `update_task` | `update` + `task` | Task operations |
| `get_project` | `get` + `project` | Project operations |
| `update_project` | `update` + `project` | Project operations |
| `get_prompt` | `get` + `prompt` | Task operations |
| `start_project` | `start` + `project` | Project operations |
| `list_projects` | `list` + `projects` | Project operations |
| `list_tasks` | `list` + `tasks` | Task operations |
| `next_task` | `next` + `task` | Task operations |

## Spec Recommendation vs Current Pattern

**Spec suggests:** `domain_action_target` (e.g., `task_get_details`, `project_list_all`)
**Current pattern:** `action_target` (e.g., `get_task`, `list_projects`)

## Analysis

### Strengths of Current Pattern
1. **Clarity**: The action comes first, making it immediately clear what the tool does
2. **Consistency**: All 9 tools follow the exact same pattern without deviation
3. **Brevity**: Shorter names are easier to type and remember
4. **Natural language order**: Reads like natural English ("get task", "list projects")
5. **Industry standard**: Matches common API naming conventions (REST verbs + resources)

### Why Not Add Domain Prefix?
1. **Redundancy**: The target already implies the domain:
   - `task` → task domain
   - `project` → project domain
   - `prompt` → task domain (prompts belong to tasks)
2. **Breaking change**: Renaming would break existing MCP clients
3. **Ambiguity**: Domain prefix creates redundant information (e.g., `task_get_task` is redundant)

### Mapping to Tool Search Categories
While we're not adding domain prefixes to names, we'll use the `metadata.category` field to organize tools:

- **Category `task`**: `get_task`, `update_task`, `get_prompt`, `list_tasks`, `next_task`
- **Category `project`**: `get_project`, `update_project`, `start_project`, `list_projects`

This preserves backward compatibility while still enabling categorization for tool search.

## Decision

**Keep current `action_target` naming convention.**

### Rationale
1. **Non-breaking**: Maintains compatibility with existing clients
2. **Clear and consistent**: Pattern is immediately understandable
3. **Spec alignment**: The spec's goal is clarity and searchability, which our current names achieve
4. **Metadata solution**: We can use `metadata.category` and `metadata.tags` to provide domain context without changing names

## Documentation

This naming convention will be documented in `docs/tools.md` (FR8-1) with:
- Clear statement that `action_target` is the project convention
- Examples of good tool names following this pattern
- Explanation that `metadata.category` provides domain grouping
- Guidance for new contributors on creating tool names

## Acceptance Criteria Met

- [x] **FR2-1**: Audit current tool names against convention
  - All 9 tools audited
  - Pattern identified: `action_target`
  - Assessment: Clear, consistent, no changes needed

- [x] **FR2-2**: Document naming convention decision
  - Decision: Keep current `action_target` pattern
  - Justification: Non-breaking, clear, consistent, spec-aligned
  - Will be included in `docs/tools.md` (Phase 6)

## Impact on Remaining Phases

This decision means:
- **Phase 3 (Descriptions)**: No name changes, only description improvements
- **Phase 4 (Input Schemas)**: No name changes, only add property descriptions
- **Phase 5 (Metadata)**: Use `category` field to indicate domain (`task` or `project`)
- **Phase 6 (Documentation)**: Document `action_target` convention in `docs/tools.md`
- **Phase 7 (Tests)**: Verify naming consistency (should pass without changes)
