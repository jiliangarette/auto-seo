---
name: build-check
description: Validates TypeScript/lint and runs production builds before pushing code
trigger: After implementing features/fixes, before every git push, when autonomous tasks complete, or when user says "check", "validate", "build check"
---

# Build Check

## Commands

| Command | Purpose |
|---------|---------|
| `npm run lint` | Quick lint check |
| `npm run build` | Full validation (lint + type-check + production build) |
| `npx tsc --noEmit` | TypeScript-only check |

## When to Run

- After implementing any feature or fix
- Before every `git push`
- When autonomous tasks complete
- When user says "check", "validate", or "build check"

## Error Detection

Look for and fix:
- TypeScript errors (type mismatches, missing properties)
- Missing imports / unused imports
- Module not found errors
- ESLint violations

## Rules

- **Never push code that doesn't build**
- Fix errors before committing
- If a fix introduces new errors, address those too
- After 2 failed fix attempts, stop and ask the user
