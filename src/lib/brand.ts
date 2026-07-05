// AlmiItalian brand tokens (TS mirror of globals.css @theme). Sunrise palette (inherited via the
// AlmiKorean fork — kept per build command). Identity only differs.
export const BRAND = {
  coral: "#FF7A6B",
  coralDeep: "#F2624F",
  sun: "#F2A65A",
  sunDeep: "#DD8F3F",
  teal: "#0D9488",
  ink: "#14110D",
  text: "#3B352D",
  textMuted: "#6B6156",
  bg: "#FFFAF3",
  bgPeach: "#FFE9D8",
  paper: "#FFFFFF",
  onDark: "#FBF6EF",
  line: "#ECE3D6",
} as const;

export const PRODUCT = {
  name: "AlmiItalian",
  exam: "CILS + CELI",
  // Two exam families, each on its OWN real scale — NEVER mixed (see src/lib/scoring/*).
  families: ["CILS", "CELI"] as const,
  domain: "almiitalian.almiworld.com",
} as const;
