# Learnings

Accumulated knowledge from feature implementations. Reference before starting new tasks.

## Patterns (What Works)

<!-- Add successful patterns here -->
- [2026-01-31] [tool-search-tool] Adding optional fields to interfaces is safe and backwards compatible - allows gradual adoption without breaking existing tools
- [2026-01-31] [tool-search-tool] TypeScript's optional properties (`field?: Type`) are perfect for extending MCP tool definitions without forcing immediate updates to all tools
- [2026-01-31] [tool-search-tool] Tool description pattern: "what it does" + "when to use it" makes tools more discoverable and helps users understand appropriate usage contexts

## Anti-Patterns (What to Avoid)

<!-- Add mistakes and issues to avoid -->
- [YYYY-MM-DD] [feature] Anti-pattern description

### E2E Pitfalls
<!-- E2E testing specific issues -->

## Tool Usage

<!-- Tips for using MCP tools and CLI -->

## Codebase Conventions

<!-- Project-specific conventions discovered -->
- [2026-01-31] [tool-search-tool] Tool naming convention: `action_target` pattern (e.g., `get_task`, `list_projects`) - prioritizes clarity and natural language order over domain prefixes
- [2026-01-31] [tool-search-tool] Use `metadata.category` field for domain grouping instead of renaming tools - preserves backward compatibility while enabling categorization
