-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ItalianExam" AS ENUM ('CILS_STANDARD', 'CILS_B1C', 'CELI');

-- CreateEnum
CREATE TYPE "ItalianTaskType" AS ENUM ('MCQ', 'MATCHING', 'ORDERING', 'CLOZE', 'ANALISI', 'WRITING', 'SPEAKING');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('FOUNDATION', 'CORE', 'STRETCH');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'SCORED');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('PRACTICE_SET', 'MOCK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "targetExam" "ItalianExam",
    "emailVerifiedAt" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "subscriptionCurrentPeriodEnd" TIMESTAMP(3),
    "compProUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItalianItem" (
    "id" TEXT NOT NULL,
    "exam" "ItalianExam" NOT NULL,
    "level" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "taskType" "ItalianTaskType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'CORE',
    "title" TEXT NOT NULL,
    "prompt" TEXT,
    "topicTag" TEXT,
    "guidanceNote" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItalianItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItalianAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "exam" "ItalianExam" NOT NULL,
    "level" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "sessionId" TEXT,
    "response" JSONB,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItalianAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItalianSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "SessionMode" NOT NULL,
    "exam" "ItalianExam" NOT NULL,
    "level" TEXT NOT NULL,
    "section" TEXT,
    "currentDifficulty" "Difficulty" NOT NULL DEFAULT 'CORE',
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItalianSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

-- CreateIndex
CREATE INDEX "ItalianItem_exam_level_section_idx" ON "ItalianItem"("exam", "level", "section");

-- CreateIndex
CREATE UNIQUE INDEX "ItalianItem_exam_level_section_title_key" ON "ItalianItem"("exam", "level", "section", "title");

-- CreateIndex
CREATE INDEX "ItalianAttempt_userId_exam_idx" ON "ItalianAttempt"("userId", "exam");

-- CreateIndex
CREATE INDEX "ItalianSession_userId_mode_idx" ON "ItalianSession"("userId", "mode");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItalianAttempt" ADD CONSTRAINT "ItalianAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItalianAttempt" ADD CONSTRAINT "ItalianAttempt_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItalianItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItalianAttempt" ADD CONSTRAINT "ItalianAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ItalianSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItalianSession" ADD CONSTRAINT "ItalianSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

