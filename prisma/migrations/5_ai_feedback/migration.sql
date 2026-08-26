-- AI feedback for Produzione scritta and orale: the cost ledger and the evaluations.
--
-- Purely additive: two new tables, one new enum, no change to any existing column, so it is
-- safe to apply to the live database with no downtime and nothing to backfill.
--
-- 🔴 `build` DOES NOT RUN `prisma migrate deploy` in this repo (13 gates + generate + next
-- build). Apply this with the DIRECT url before the merge deploys:
--     DATABASE_URL_UNPOOLED=<direct> npm run db:deploy
-- Without it every evaluation route 500s on a missing relation the first time a learner
-- submits, and the cost ledger silently records nothing.

-- CreateEnum
CREATE TYPE "AiSkill" AS ENUM ('SCRITTA', 'ORALE');

-- CreateTable
CREATE TABLE "AICostLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICostLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiEvaluation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skill" "AiSkill" NOT NULL,
    "stableItemId" TEXT NOT NULL,
    "exam" "ItalianExam" NOT NULL,
    "level" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "audioUrl" TEXT,
    "transcriptConfidence" DOUBLE PRECISION,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "evaluation" JSONB NOT NULL,
    "labelKind" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AICostLedger_userId_createdAt_idx" ON "AICostLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AICostLedger_feature_createdAt_idx" ON "AICostLedger"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "AiEvaluation_userId_createdAt_idx" ON "AiEvaluation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiEvaluation_stableItemId_idx" ON "AiEvaluation"("stableItemId");

-- AddForeignKey
ALTER TABLE "AICostLedger" ADD CONSTRAINT "AICostLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiEvaluation" ADD CONSTRAINT "AiEvaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

