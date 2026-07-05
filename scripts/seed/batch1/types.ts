// Batch 1 item-bank types. One RawItem maps 1:1 to a Prisma ItalianItem row.
// Dedup key mirrors the DB @@unique([exam, level, section, title]).
export type ItalianExam = "CILS_STANDARD" | "CILS_B1C" | "CELI";
export type TaskType = "MCQ" | "MATCHING" | "ORDERING" | "CLOZE" | "ANALISI" | "WRITING" | "SPEAKING";
export type Difficulty = "FOUNDATION" | "CORE" | "STRETCH";

// Section codes are the SAME strings the scoring engines use, so an item maps
// straight onto its section. CELI sub-skills reuse the codes; payload.part marks
// WRITTEN vs ORAL because CELI is scored by part, not by section.
export type Section = "ASCOLTO" | "LETTURA" | "ANALISI" | "SCRITTA" | "ORALE";

export interface McqQuestion { q: string; options: string[]; answerIndex: number }
export interface McqPayload { part?: "WRITTEN" | "ORAL"; audioScript?: string; passage?: string; questions: McqQuestion[] }
export interface MatchingPayload { part?: "WRITTEN" | "ORAL"; audioScript?: string; instruction: string; prompts: string[]; options: string[]; answerMap: number[] }
export interface OrderingPayload { instruction: string; shuffled: string[]; correctOrder: number[] }
export interface ClozePayload { text: string; blanks: { answer: string; options?: string[] }[] }
export interface WritingPayload { part?: "WRITTEN" | "ORAL"; task: string; context: string; minWords: number; maxWords?: number; criteria: string[] }
export interface SpeakingPayload { part?: "WRITTEN" | "ORAL"; task: string; parts: string[]; criteria: string[]; prepSeconds?: number; speakSeconds?: number }

export type Payload =
  | McqPayload | MatchingPayload | OrderingPayload | ClozePayload | WritingPayload | SpeakingPayload;

export interface RawItem {
  exam: ItalianExam;
  level: string;
  section: Section;
  taskType: TaskType;
  difficulty: Difficulty;
  title: string;
  prompt?: string;
  topicTag?: string;
  guidanceNote?: string;
  payload: Payload;
}

// Standard label appended to every AI-estimated section so no page ever implies
// an official Writing/Speaking result. Only Siena (CILS) / Perugia (CELI) award those.
export const ESTIMATE_NOTE =
  "Valutazione AI sui criteri ufficiali — è una STIMA, non un risultato ufficiale. Solo Siena/Perugia rilasciano il certificato.";
