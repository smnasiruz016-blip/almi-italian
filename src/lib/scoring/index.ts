// AlmiItalian scoring — three DISTINCT engine paths, deliberately exported side by side but never
// merged. Each keeps its own scale, sections, and pass logic. Import the one you need explicitly.
export type { SectionStatus } from "./status";
export * from "./cils-standard";
export * from "./cils-b1c";
export * from "./celi";
