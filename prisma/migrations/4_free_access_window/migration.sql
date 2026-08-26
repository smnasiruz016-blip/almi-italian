-- The 3-day no-card window on the OBJECTIVE sections (Ascolto/Lettura/Analisi).
-- NULL = never started. The clock is set by the first graded submission and never
-- restarted; nothing backfills it, so every existing user starts fresh on their next
-- submit. Additive and nullable: safe to apply to a live User table with no downtime.
--
-- NOTE: this repo's `build` does NOT run `prisma migrate deploy` (13 gates + generate +
-- next build only). Apply with `npm run db:deploy` against DATABASE_URL_UNPOOLED.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "freeAccessStartedAt" TIMESTAMP(3);

