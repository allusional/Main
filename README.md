# RateMyCondo

A "Glassdoor for condos & apartments." Research a building's management, noise,
amenities, maintenance, safety, and value — from real resident reviews — before
you move in. Launch market: the Greater Toronto Area.

See [`PLAN.md`](./PLAN.md) for the full product plan and roadmap.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Turbopack) + **Tailwind CSS v4**
- **PostgreSQL + PostGIS** on **Supabase**
- **Prisma 7** (via the `@prisma/adapter-pg` driver adapter)
- **Supabase Auth** (email magic links) through `@supabase/ssr`
- **Google Maps / Places** for maps & geocoding (Phase 2+)

## Getting started

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # fill in Supabase + DB + Maps values
npm run dev                 # http://localhost:3000
```

### Environment variables

See [`.env.example`](./.env.example). You need a Supabase project (URL + anon key,
pooled `DATABASE_URL`, direct `DIRECT_URL`) and, from Phase 2, Google Maps keys.

### Database

Connection URLs live in `prisma.config.ts` (used by the Prisma CLI). Enable PostGIS
on the database once (`create extension if not exists postgis;`), then:

```bash
npm run db:migrate          # create/apply a migration (dev)
npm run db:studio           # browse data
```

The runtime app connects through the pg driver adapter in `src/lib/prisma.ts`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` / `db:deploy` | Prisma migrations (dev / prod) |
| `npm run db:studio` | Prisma Studio |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, and build on every push/PR.

## Status

**Phase 0 — Foundations (complete):** Next.js scaffold, Prisma 7 + PostGIS schema,
Supabase auth skeleton (magic-link sign in / callback / sign out / gated account),
session proxy, and CI. Discovery, reviews, and moderation follow in later phases —
see `PLAN.md`.

## Project structure

```
prisma/schema.prisma        data model (users, buildings, mgmt companies, reviews, …)
prisma.config.ts            Prisma 7 CLI config (connection URLs)
src/app/                    routes: /, /search, /auth/*, /account
src/lib/prisma.ts           Prisma client (pg driver adapter)
src/lib/supabase/           browser + server Supabase clients, session helper
src/lib/auth.ts             getCurrentUser() helper
src/proxy.ts                Next 16 proxy: refreshes the auth session
```
