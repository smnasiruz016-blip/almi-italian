// AlmiItalian — app-side item loader (bundled Batch-1 bank). Same 100 items that seed Neon
// (dedup key {exam,level,section,title} matches the DB), bundled so the practice runner needs no
// DB round-trip. Regenerate with: npx tsx scripts/seed/_gen_bank_json.mjs
// Items are bucketed by {exam × level × section}; the SCORING ENGINE — never this file — owns the
// pass rules, and the three engines' scales are never mixed.
import bank from "@/data/items-batch1.json";

export type ItalianExam = "CILS_STANDARD" | "CILS_B1C" | "CELI";
export type TaskType = "MCQ" | "MATCHING" | "ORDERING" | "CLOZE" | "ANALISI" | "WRITING" | "SPEAKING";

// Payload sub-shapes (mirror scripts/seed/batch1/types.ts). Objective payloads are auto-markable;
// WRITING/SPEAKING are AI-estimate only (never auto-scored here).
export type McqQuestion = { q: string; options: string[]; answerIndex: number };
export type McqPayload = { part?: "WRITTEN" | "ORAL"; audioScript?: string; passage?: string; questions: McqQuestion[] };
export type MatchingPayload = { part?: "WRITTEN" | "ORAL"; audioScript?: string; instruction: string; prompts: string[]; options: string[]; answerMap: number[] };
export type OrderingPayload = { instruction: string; shuffled: string[]; correctOrder: number[] };
export type ClozePayload = { text: string; blanks: { answer: string; options?: string[] }[] };
export type WritingPayload = { part?: "WRITTEN" | "ORAL"; task: string; context: string; minWords: number; maxWords?: number; criteria: string[] };
export type SpeakingPayload = { part?: "WRITTEN" | "ORAL"; task: string; parts: string[]; criteria: string[]; prepSeconds?: number; speakSeconds?: number };
export type Payload = McqPayload | MatchingPayload | OrderingPayload | ClozePayload | WritingPayload | SpeakingPayload;

export type BankItem = {
  exam: ItalianExam;
  level: string;
  section: string; // ASCOLTO | LETTURA | ANALISI | SCRITTA | ORALE
  taskType: TaskType;
  difficulty: "FOUNDATION" | "CORE" | "STRETCH";
  title: string;
  prompt?: string;
  topicTag?: string;
  guidanceNote?: string;
  payload: Payload;
};

export const BANK = bank as unknown as BankItem[];

/** Items for one bucket, in bank order. */
export function itemsFor(exam: ItalianExam, level: string, section: string): BankItem[] {
  return BANK.filter((i) => i.exam === exam && i.level === level && i.section === section);
}

/** Count in one bucket (used by the /practice picker chips). */
export function countFor(exam: ItalianExam, level: string, section: string): number {
  return itemsFor(exam, level, section).length;
}

// Payload type guards — the runner detects shape rather than trusting taskType, so a section that
// mixes MCQ + MATCHING (e.g. Ascolto) renders each item correctly.
export const isMcq = (p: Payload): p is McqPayload => Array.isArray((p as McqPayload).questions);
export const isMatching = (p: Payload): p is MatchingPayload => Array.isArray((p as MatchingPayload).answerMap);
export const isOrdering = (p: Payload): p is OrderingPayload => Array.isArray((p as OrderingPayload).correctOrder);
export const isCloze = (p: Payload): p is ClozePayload => Array.isArray((p as ClozePayload).blanks);
export const isWriting = (p: Payload): p is WritingPayload => typeof (p as WritingPayload).minWords === "number";
export const isSpeaking = (p: Payload): p is SpeakingPayload => Array.isArray((p as SpeakingPayload).parts);
export const isObjective = (p: Payload): boolean => isMcq(p) || isMatching(p) || isOrdering(p) || isCloze(p);
