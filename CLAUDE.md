# AI Battle Arena — Project Conventions

## Quick Start

```bash
pnpm install
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm format:check # Prettier check
pnpm type-check   # TypeScript check
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright E2E tests
```

## Architecture

See `docs/ARCHITECTURE.md` for full details.

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (`strict: true`)
- **Fonts**: Geist Sans + Geist Mono (self-hosted via `next/font/google`, zero external requests)
- **Styling**: Tailwind CSS v4 (CSS-first config) + shadcn/ui
- **Testing**: Vitest (unit, 80% coverage) + Playwright (E2E)
- **Package Manager**: pnpm (enforced via `packageManager` field)
- **Node**: 22 LTS (enforced via `.nvmrc` + `engines`)

## Code Standards

- `strict: true` — no implicit any, strict null checks
- Prefer `interface` for object shapes, `type` for unions/intersections
- No `enum` — use `as const` objects
- Explicit return types on exported functions
- Server Components by default, `"use client"` only when needed
- Tailwind utility classes in JSX, `cn()` for conditional classes

## Naming Conventions

| Entity       | Convention                  | Example                |
| ------------ | --------------------------- | ---------------------- |
| Components   | PascalCase                  | `GameBoard.tsx`        |
| Hooks        | camelCase with `use` prefix | `useGameLoop.ts`       |
| Utilities    | camelCase                   | `parseMoveNotation.ts` |
| Game Modules | kebab-case directory        | `games/chess/`         |
| Types        | PascalCase                  | `GameState`            |
| Constants    | SCREAMING_SNAKE_CASE        | `MAX_RETRIES`          |

## Git Conventions

Commits enforced via commitlint + Husky:

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

## Key Directories

```
src/app/           → Next.js App Router pages
src/components/ui/ → shadcn/ui components (do not edit manually)
src/components/    → Custom components (arena/, setup/)
src/games/         → Game engine implementations
src/lib/           → Shared utilities, AI integration
src/actions/       → Server Actions
src/types/         → Shared TypeScript types
tests/unit/        → Vitest unit tests
tests/e2e/         → Playwright E2E tests
```

## Path Aliases

`@/*` → `src/*` (configured in `tsconfig.json`)
