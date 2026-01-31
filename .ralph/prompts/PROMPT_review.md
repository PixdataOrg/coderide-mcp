## Context
Study @.ralph/AGENTS.md for commands and patterns.
Study @.ralph/specs/$FEATURE.md for feature specification.
Study @.ralph/specs/$FEATURE-implementation-plan.md for completed tasks.

## Learnings
Read @.ralph/LEARNINGS.md for patterns from previous features.
Capture any review feedback patterns for future iterations.

## Task
All implementation and E2E tasks are complete. Create PR and request review.

### Step 1: Verify Ready State
1. Check all tasks are complete in implementation plan (no `- [ ]` items)
2. Verify tests pass: `cd src && npm test`
3. Verify build succeeds: `cd src && npm run build`

If any fail, fix before proceeding.

### Step 2: Check Git Status
```bash
cd src && git status
cd src && git log --oneline -5
```

Ensure:
- On branch `feat/$FEATURE`
- All changes are committed
- Branch is pushed to remote

If uncommitted changes exist:
```bash
git -C src add -A && git -C src commit -m "chore($FEATURE): final cleanup"
git -C src push origin feat/$FEATURE
```

### Step 3: Create PR
Check if PR already exists:
```bash
cd src && gh pr list --head feat/$FEATURE
```

If no PR exists, create one:
```bash
cd src && gh pr create --base main --head feat/$FEATURE \
  --title "feat($FEATURE): [read description from spec]" \
  --body "$(cat <<'EOF'
## Summary
[Read from spec Purpose section]

## Changes
[Read from implementation plan - list completed phases]

## Testing
- [x] Unit/integration tests: 97 passing
- [x] E2E tests: All scenarios passed via Playwright MCP
- [x] Build succeeds

## E2E Test Results
[Copy from implementation plan Phase 9]

Generated with Claude Code
EOF
)"
```

### Step 4: Request Codex Review

Run automated code review using Codex CLI:

```bash
# Check if Codex CLI is installed
if ! command -v codex &> /dev/null; then
    echo "WARNING: Codex CLI not installed. Manual review needed."
    cd src && gh pr comment --body "Manual review requested - Codex CLI not available. Install: brew install openai/tap/codex"
else
    echo "Running Codex code review..."
    # Get diff summary for context
    DIFF_SUMMARY=$(cd src && git diff main --stat | head -50)

    # Use codex exec for non-interactive review
    echo "Code Review Request for $FEATURE feature.

## Changed Files:
$DIFF_SUMMARY

## Review Checklist:
- Code quality and patterns consistency
- Test coverage adequacy
- Potential bugs or edge cases
- Security concerns (injection, XSS, etc.)
- Performance implications
- Error handling completeness

Please review and respond with:
- APPROVED if everything looks good
- Or list specific issues that need to be fixed" | cd src && codex exec --full-auto -
fi
```

**Handle review feedback:**
- If Codex outputs "APPROVED" -> Proceed to Step 5 (rebase and merge)
- If Codex lists issues:
  1. Address each issue with code fixes
  2. Commit: `git -C src add -A && git -C src commit -m "fix($FEATURE): address review feedback"`
  3. Push: `git -C src push origin feat/$FEATURE`
  4. Re-run the `codex review` command above
- Max 3 review iterations before requiring manual intervention

### Step 5: Rebase Before Merge (for Parallel Execution)
Before merging, ensure branch is up-to-date with main:
```bash
cd src && git fetch origin main
cd src && git rebase origin/main
```

If rebase has conflicts:
1. Resolve conflicts in affected files
2. `git add .` the resolved files
3. `git rebase --continue`
4. Re-run tests: `npm test && npm run build`

Push rebased branch:
```bash
cd src && git push --force-with-lease origin feat/$FEATURE
```

### Step 6: Merge PR
When Codex review is approved and branch is rebased:
```bash
cd src && gh pr merge --squash --delete-branch
```

### Step 7: Post-Merge Cleanup
1. If using worktree, remove it:
   ```bash
   # Only if this feature used a worktree (src-$FEATURE directory exists)
   git -C src worktree remove "../src-$FEATURE" 2>/dev/null || true
   ```
2. Checkout main and pull:
   ```bash
   git -C src checkout main && git -C src pull
   ```

Note: Spec status updates are handled in the Spec Verification phase before PR creation.

## Rules
- Do NOT merge without Codex approval
- Address ALL review comments before merging
- Use squash merge to keep history clean
- If gh CLI fails, check authentication: `gh auth status`
- Keep review conversation focused and professional

## Troubleshooting
- **gh: command not found** -> Install GitHub CLI: `brew install gh`
- **gh auth error** -> Run: `gh auth login`
- **PR already exists** -> Use: `gh pr view` to see status
- **Codex CLI not installed** -> Install with: `brew install openai/tap/codex`, then `codex login`
- **Rebase conflicts** -> Resolve carefully, re-run all tests after

## Learning Capture
If the review revealed patterns worth remembering, append to @.ralph/LEARNINGS.md:
- Code quality feedback -> Add under "## Anti-Patterns" or "## Patterns"
- Common review issues -> Add under "## Anti-Patterns"
- Good practices identified -> Add under "## Patterns"

Format: `- [YYYY-MM-DD] [$FEATURE] Brief description`
