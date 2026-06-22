<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# RateMyCondo — project notes

See `PLAN.md` for the product plan and roadmap. Stack & conventions that bit us already:

- **Next 16:** the request-interception file is `src/proxy.ts` exporting `proxy` (the
  old `middleware` convention is deprecated). `cookies()` is async.
- **Prisma 7:** the runtime client **requires a driver adapter** — there is no
  `datasourceUrl`/`datasources` option. We use `@prisma/adapter-pg` in `src/lib/prisma.ts`.
  Connection URLs live in `prisma.config.ts` (CLI/migrations only), not in `schema.prisma`.
  The generated client lives in `src/generated/prisma` (gitignored — run `prisma generate`).
- **Auth:** Supabase Auth via `@supabase/ssr` (magic links). Browser client in
  `src/lib/supabase/client.ts`, server client in `src/lib/supabase/server.ts`.
- **PostGIS:** `Building.geom` is an `Unsupported("geography(Point, 4326)")` column; enable
  the `postgis` extension before the first migration. Spatial queries use `$queryRaw`.

Before pushing: `npm run lint && npm run typecheck && npm run build` must pass (this is CI).
