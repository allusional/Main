import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI-only (migrations / studio). Prefer the direct, non-pooled connection
    // on Supabase; fall back to DATABASE_URL. The app runtime connects via the
    // driver adapter in src/lib/prisma.ts instead.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
