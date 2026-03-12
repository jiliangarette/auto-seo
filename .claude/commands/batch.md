Run autonomous batch mode. Read TASKS.md and execute all unchecked tasks following their tag pipelines.

## Task Dispatch

For each unchecked task, dispatch by tag:

### [AUTO] — Direct Implementation
1. Implement the change
2. Run `npm run build` (must pass)
3. `git add` → `git commit` → `git push`

### [PLAN] — Research First
1. Spin up 2-3 Explore agents to research the problem
2. Synthesize findings into an implementation plan
3. Run a Plan agent to review the approach
4. Implement → build check → commit → push

### [TEST] — Browser Verification
1. Run `npm run build` (gate check)
2. Start dev server if not running
3. Use Playwright MCP to test the feature
4. Spin up a QA review agent to verify
5. Commit → push

### [AUTO-DB] — Database Change Needed
1. Identify the database changes needed
2. Write structured description to SUPABASE.md (Pending section) using the lovable-handoff skill format
3. Notify user that DB changes are needed
4. Move to next task (do NOT wait)

### [BLOCKED] — Skip
Skip entirely. Do not attempt.

### Combined Tags (e.g., [PLAN,TEST])
Run each pipeline sequentially in tag order.

## Core Rules

- **ONE task = ONE commit = ONE push**
- Process tasks in TASKS.md order (top to bottom)
- Stop if uncertain or error persists after 2 fix attempts
- **Never auto-approve:** auth/security changes, payment logic, new dependencies
- Always `git pull` before first push
- Mark completed tasks with `[x]` and append commit hash
