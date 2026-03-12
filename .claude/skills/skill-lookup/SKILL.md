---
name: skill-lookup
description: Search and install skills from the marketplace to extend Claude's capabilities
trigger: When user asks for Agent Skills, wants to search/install skills, or mentions extending Claude's capabilities
---

# Skill Lookup

## Available Tools

- `search_skills` — Search by keyword, category, or tag (supports limit up to 50)
- `get_skill` — Retrieve a specific skill by ID with all its files

## Installation Workflow

1. Call `get_skill` to retrieve all files for the skill
2. Create `.claude/skills/{slug}/` directory
3. Save all files:
   - `SKILL.md` (required) — Skill definition and trigger conditions
   - Optional: reference docs, scripts, config files

## Skill Structure

```
.claude/skills/{skill-name}/
├── SKILL.md          # Required — defines name, description, trigger
├── reference.md      # Optional — additional context docs
├── scripts/          # Optional — automation scripts
└── config/           # Optional — configuration files
```

## When to Use

- User asks "is there a skill for...?"
- User wants to extend capabilities
- User mentions skill marketplace or agent skills
- Before building a custom skill, check if one exists
