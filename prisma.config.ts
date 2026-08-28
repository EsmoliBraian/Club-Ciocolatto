import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (unpooled) connection — Neon's pooler (PgBouncer,
    // transaction mode) doesn't support the advisory locks Prisma Migrate uses.
    // The app runtime (src/lib/prisma.ts) uses DATABASE_URL (pooled) instead.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
