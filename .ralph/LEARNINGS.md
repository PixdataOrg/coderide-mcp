# Learnings

Accumulated knowledge from feature implementations. Reference before starting new tasks.

## Patterns (What Works)

<!-- Add successful patterns here -->
- [2026-01-31] [tool-search-tool] Adding optional fields to interfaces is safe and backwards compatible - allows gradual adoption without breaking existing tools
- [2026-01-31] [tool-search-tool] TypeScript's optional properties (`field?: Type`) are perfect for extending MCP tool definitions without forcing immediate updates to all tools
- [2026-01-31] [tool-search-tool] Tool description pattern: "what it does" + "when to use it" makes tools more discoverable and helps users understand appropriate usage contexts
- [2026-01-31] [tool-search-tool] Property descriptions should include: format specs, constraint details, usage guidance, and relationship context - makes tools self-documenting and easier to discover
- [2026-01-31] [tool-search-tool] Use concrete examples in property descriptions (e.g., 'ABC-123' instead of just 'task number') - helps users understand expected format immediately
- [2026-01-31] [tool-search-tool] Metadata pattern for tool discoverability: category (domain grouping), tags (searchable keywords), usage (when to use), priority (importance level) - enables tool search alignment without breaking changes
- [2026-01-31] [tool-search-tool] When adding metadata to multiple tools, verify both the property declaration AND the getMCPToolDefinition() method includes it - both are needed for full MCP compatibility
- [2026-01-31] [tool-search-tool] Documentation pattern for contributor guides: include naming conventions, description guidelines, complete examples, and field references - comprehensive docs prevent inconsistencies and enable confident contributions
- [2026-01-31] [tool-search-tool] When files are gitignored (like docs/), use `git add -f <file>` to force-add specific files that should be tracked - allows selective tracking within ignored directories
- [2026-01-31] [tool-search-tool] Verification scripts (like list-tools.ts) provide immediate feedback on implementation quality and help catch inconsistencies early - create them as part of the feature, not as an afterthought
- [2026-01-31] [tool-search-tool] ANSI color codes in terminal output make verification scripts much more readable - use colors to emphasize important information (bright for headings, colors for categories/priorities)
- [2026-01-31] [tool-search-tool] Summary statistics (e.g., "9/9 tools with metadata = 100%") provide quick validation that implementation is complete - always include coverage metrics in verification output
- [2026-01-31] [tool-search-tool] Comprehensive test suites should be structured as independent test files that can run standalone - makes debugging easier and allows selective test execution
- [2026-01-31] [tool-search-tool] Test files using plain JavaScript (not TypeScript) can import from compiled dist/ folder - simpler setup, no test-specific build configuration needed
- [2026-01-31] [tool-search-tool] Test pattern: each test file should have clear test numbering (Test 1.1, 1.2, etc.) and summary output - makes it easy to identify which specific assertion failed
- [2026-01-31] [tool-search-tool] When test directories are gitignored, use `git add -f test/specific-file.js` to selectively track important test files - allows excluding temporary test files while keeping core test suite in version control

## Anti-Patterns (What to Avoid)

<!-- Add mistakes and issues to avoid -->
- [2026-01-31] [tool-search-tool] Spec verification process: Create dedicated test files for each acceptance criterion during implementation, not after - makes verification trivial and provides regression protection
- [2026-01-31] [tool-search-tool] Mock server should mirror production tool definitions - when adding metadata/descriptions to production tools, update mock tools in src/index.ts for full feature parity (identified in code review)

### E2E Pitfalls
<!-- E2E testing specific issues -->

## Tool Usage

<!-- Tips for using MCP tools and CLI -->
- [2026-01-31] [tool-search-tool] Use `npx tsx scripts/script-name.ts` to run TypeScript scripts directly without compilation - great for verification and utility scripts that don't need to be in the build output

## Codebase Conventions

<!-- Project-specific conventions discovered -->
- [2026-01-31] [tool-search-tool] Tool naming convention: `action_target` pattern (e.g., `get_task`, `list_projects`) - prioritizes clarity and natural language order over domain prefixes
- [2026-01-31] [tool-search-tool] Use `metadata.category` field for domain grouping instead of renaming tools - preserves backward compatibility while enabling categorization
