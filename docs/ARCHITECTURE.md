# AI Battle Arena — Architecture

> Two AI models compete head-to-head in turn-based games. Users bring their own API keys (BYOK), pick models, choose a game, and watch live. No database, no auth — all state lives in React client state.
>
> **MVP scope: Chess only.** The architecture supports multiple games via a shared `GameEngine` interface.

---

## Tech Stack

| Category        | Choice               | Version      | Notes                                      |
| --------------- | -------------------- | ------------ | ------------------------------------------ |
| Framework       | Next.js (App Router) | 16.1.x       | Turbopack enabled by default               |
| Language        | TypeScript           | 5.x          | `strict: true`                             |
| Styling         | Tailwind CSS         | 4.x          | CSS-first config (`@import "tailwindcss"`) |
| UI Components   | shadcn/ui            | latest       | Radix primitives + Tailwind                |
| AI Integration  | Vercel AI SDK        | 5.x          | `generateText` / `streamText` from `ai`    |
| Chess Logic     | chess.js             | latest       | Move validation, FEN/PGN                   |
| Chess Board UI  | react-chessboard     | latest       | SVG board renderer                         |
| Package Manager | pnpm                 | 9.x          | Enforced via `packageManager` field        |
| Node.js         | Node                 | 22 LTS       | Enforced via `.nvmrc` + `engines`          |
| Linting         | ESLint + Prettier    | 9.x / 3.x    | Flat config (`eslint.config.mjs`)          |
| Testing         | Vitest + Playwright  | 3.x / latest | 80% coverage threshold                     |
| Git Hooks       | Husky + commitlint   | latest       | Conventional Commits enforced              |
| CI/CD           | GitHub Actions       | —            | lint → type-check → test → build → e2e     |
| Hosting         | Vercel               | —            | Preview deploys on PRs                     |

---

## Architecture

### Game Engine Interface

Every game implements `GameEngine`, keeping the platform decoupled from game-specific logic.

```typescript
interface GameEngine {
  id: string; // e.g. "chess"
  name: string; // e.g. "Chess"
  validateMove(state, move): boolean; // Is this move legal?
  applyMove(state, move): GameState; // Apply move, return new state
  getStatus(state): GameStatus; // ongoing | win | draw
  serializeState(state): string; // State → string for AI prompt
  renderBoard: React.ComponentType; // Game-specific board UI
  buildPrompt(state, history): string; // Build the AI prompt for this game
}
```

### Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                              │
│  ┌────────────┐   ┌───────────────┐   ┌──────────────────┐  │
│  │  Board UI  │◄──│  Game State   │──►│  Move History    │  │
│  │  (per-game │   │  (useState)   │   │  (per-game       │  │
│  │  renderer) │   │               │   │   format)        │  │
│  └────────────┘   │  GameEngine   │   └──────────────────┘  │
│                   │  validates    │                          │
│                   └──────┬────────┘                          │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │ Server Action
                           ▼
               ┌───────────────────────┐
               │   Next.js Server      │
               │   Action (Route)      │
               │                       │
               │   AI SDK streamText() │
               └───────────┬───────────┘
                           │ BYOK API Key
                           ▼
               ┌───────────────────────┐
               │   AI Provider API     │
               │   (OpenAI / Anthropic │
               │    / Google / etc.)   │
               └───────────────────────┘
```

### Game Loop

1. User selects game, picks two AI models, pastes API keys
2. React state holds the game state (e.g. `Chess` instance from chess.js)
3. Each turn: Server Action calls `streamText()` with serialized board + move history
4. AI responds with a move — `GameEngine` validates; invalid moves trigger retry
5. Board updates, turn switches, repeat until game ends

### Key Constraints

- **Stateless server** — every request includes full game context
- **API keys never stored** — sent per-call in request headers, never persisted or logged
- **GameEngine is the authority** — AI suggestions are untrusted, all validation goes through the engine
- **Game-agnostic core** — only board UI, validation, and prompts are game-specific

---

## Project Structure

```
ai-battle-arena/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (providers, fonts)
│   │   ├── page.tsx            # Home — game selection + lobby
│   │   ├── play/
│   │   │   └── [gameId]/
│   │   │       └── page.tsx    # Game page (dynamic per game type)
│   │   └── globals.css         # @import "tailwindcss"
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── arena/              # Shared game shell (turn indicator, move log, controls)
│   │   └── setup/              # Game picker, model picker, API key inputs
│   ├── games/                  # Game-specific modules (one dir per game)
│   │   ├── types.ts            # GameEngine interface + shared game types
│   │   ├── registry.ts         # Game registry — maps gameId → GameEngine
│   │   └── chess/              # MVP: Chess implementation
│   │       ├── engine.ts       # GameEngine impl (wraps chess.js)
│   │       ├── board.tsx       # Board UI (wraps react-chessboard)
│   │       ├── prompt.ts       # Chess-specific AI prompt builder
│   │       └── types.ts        # Chess-specific types (FEN, PGN, etc.)
│   ├── lib/
│   │   ├── ai/                 # AI provider config, shared prompt utils
│   │   └── utils.ts            # Shared utilities (cn, etc.)
│   ├── actions/
│   │   └── generate-move.ts    # Server Action: AI SDK streamText call (game-agnostic)
│   └── types/
│       └── index.ts            # Shared TypeScript types
├── tests/
│   ├── unit/                   # Vitest unit tests (*.test.ts)
│   └── e2e/                    # Playwright E2E tests (*.spec.ts)
├── public/                     # Static assets
├── .github/workflows/ci.yml   # CI pipeline
└── ARCHITECTURE.md             # This file
```

### Adding a New Game

Create `src/games/<name>/` with `engine.ts`, `board.tsx`, `prompt.ts`, and register in `src/games/registry.ts`. No changes needed to the shared arena, AI integration, or server actions.

---

## Code Standards

### TypeScript

- `strict: true` — no implicit any, strict null checks
- Prefer `interface` for object shapes, `type` for unions/intersections
- No `enum` — use `as const` objects
- Explicit return types on exported functions

### Components

- Server Components by default, `"use client"` only when needed
- Props interface co-located with the component
- Prefer composition over prop drilling; use React context sparingly

### Styling

- Tailwind utility classes in JSX, `cn()` for conditional classes
- No CSS modules, no styled-components

### Naming Conventions

| Entity         | Convention                  | Example                     |
| -------------- | --------------------------- | --------------------------- |
| Components     | PascalCase                  | `GameBoard.tsx`             |
| Hooks          | camelCase with `use` prefix | `useGameLoop.ts`            |
| Utilities      | camelCase                   | `parseMoveNotation.ts`      |
| Game Modules   | kebab-case directory        | `games/chess/`              |
| Types          | PascalCase                  | `GameState`, `PlayerConfig` |
| Constants      | SCREAMING_SNAKE_CASE        | `MAX_RETRIES`               |
| Server Actions | camelCase                   | `generateMove.ts`           |

---

## Testing

- **Unit (Vitest)**: `tests/unit/` mirroring `src/`, 80% coverage threshold enforced
  - Game engine logic, move validation, state transitions, win detection
  - AI prompt construction and response parsing
- **E2E (Playwright)**: `tests/e2e/`
  - Full game setup flow, board interaction, error states

---

## Git Conventions

**Commits** (enforced via commitlint + Husky):

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

**Branches**: `<type>/<short-description>` (e.g. `feat/ai-move-generation`)

**PRs**: Conventional Commit title, all CI passing, one approval, squash merge to `main`.

---

## CI Pipeline

GitHub Actions on push to `main` + all PRs: lint → type-check → test + coverage (80%) → build → e2e. All checks required for merge.

---

## Future Roadmap (Post-MVP)

> Out of scope for MVP. Listed for architectural awareness.

- **Games**: Connect 4, Battleships, Tic-Tac-Toe, Reversi
- **Persistence**: Convex for real-time game history
- **Auth**: Clerk or NextAuth for user accounts
- **Features**: ELO ratings, game replay, AI commentary, spectator mode, tournaments, time controls
