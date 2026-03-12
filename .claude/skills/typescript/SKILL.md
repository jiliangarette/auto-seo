---
name: typescript
description: Enforces TypeScript code style and safety guidelines
trigger: Always active — runs automatically on all code
---

# TypeScript Standards

## Type Safety
- Avoid explicit type annotations when TypeScript can infer
- Use accurate types instead of `any` or `object`
- Prefer `interface` for object shapes; `type` for unions/intersections
- Use `async`/`await` over raw promises

## Naming Conventions
- Components: PascalCase
- Hooks: `use` prefix + camelCase
- Event handlers: `handle*` (internal), `on*` (props)
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

## Code Patterns
- Destructure props and objects
- Use early returns to reduce nesting
- Keep components under 150 lines — extract sub-components
- Colocate related code; move shared code to `lib/` or `hooks/`

## UI Standards
- Use shadcn/ui + Radix UI primitives
- Mobile-responsive design with Tailwind CSS
- Use CSS variables for theming
- Reuse existing utilities and npm packages before writing custom solutions

## Import Order
1. React
2. Third-party libraries
3. Local components
4. Hooks
5. Utilities
6. Types
