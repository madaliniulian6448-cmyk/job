# servicii-locale

A Romanian local-services marketplace where users can discover and post local service listings (cleaning, food, repair, transport, etc.), leave reviews, and register as businesses.

## Stack

| Layer    | Technology                                              |
|----------|---------------------------------------------------------|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS + Radix UI  |
| Backend  | Express 5 + TypeScript (tsx watch)                     |
| Database | PostgreSQL via Drizzle ORM                              |
| Auth     | JWT in httpOnly cookies (bcryptjs for passwords)       |
| Monorepo | pnpm workspaces (`apps/api`, `apps/web`, `packages/shared`) |

## Running the project

Two workflows must be running:

- **Backend API** — `pnpm --filter api dev` → listens on port 3001
- **Start application** — `pnpm --filter web dev` → listens on port 5000 (preview pane)

## Required secrets

| Key          | Purpose                                      |
|--------------|----------------------------------------------|
| `JWT_SECRET` | Signs authentication cookies (any long random string) |

`DATABASE_URL` is managed automatically by Replit's built-in PostgreSQL.

## Database

Schema lives in `packages/shared/src/schema.ts` (Drizzle ORM).  
Push schema changes to the dev database:

```bash
pnpm db:push
```

## Project structure

```
apps/
  api/       Express API server
    src/
      routes/   auth, listings, categories, business, admin, reviews, profile
      auth.ts   JWT middleware
      db.ts     Drizzle client
  web/       React + Vite frontend
    src/
      pages/
      components/
packages/
  shared/    Drizzle schema + validators shared between api and web
```

## User preferences

- Comunicare în limba română
