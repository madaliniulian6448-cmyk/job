# servicii-locale

A Romanian local-services marketplace where users can find, list, and review local service providers (hairdressers, handymen, food delivery, transport, etc.).

## Stack

- **Monorepo**: pnpm workspaces
- **Backend**: Express v5 (TypeScript, tsx), runs on port 3001
- **Frontend**: React 18 + Vite + Tailwind CSS + TanStack Query + Radix UI, runs on port 5000
- **Database**: PostgreSQL via Drizzle ORM
- **Shared**: `packages/shared` — Drizzle schema, Zod validators, shared types

## How to run

Two workflows run in parallel (configured in `.replit`):

- **Backend API**: `pnpm --filter api dev` → listens on port 3001
- **Start application**: `pnpm --filter web dev` → listens on port 5000

The Vite dev server proxies `/api` requests to `http://localhost:3001`.

## Environment variables / secrets

| Key | Description |
|-----|-------------|
| `DATABASE_URL` | Runtime-managed by Replit — do not set manually |
| `JWT_SECRET` | JWT signing secret (set as a Replit Secret) |
| `SESSION_SECRET` | Session signing secret (set as a Replit Secret) |
| `NODE_ENV` | Optional — defaults to development |
| `ALLOWED_ORIGINS` | Optional — comma-separated extra CORS origins for production |

## Database

Schema lives in `packages/shared/src/schema.ts` (Drizzle).  
To push schema changes to the dev database:

```bash
pnpm --filter shared db:push
```

## Project structure

```
apps/
  api/          Express API — routes, auth, business logic
  web/          React frontend — pages, components, hooks
packages/
  shared/       Schema, validators, shared types
```

## User preferences

- Keep the existing monorepo structure and stack — do not restructure or migrate.
