// Batch 1 aggregate. Order: flagship B1c first, then CILS UNO/DUE, then CELI 2.
import { CILS_B1C_ITEMS } from "./cils-b1c";
import { CILS_UNO_ITEMS } from "./cils-uno";
import { CILS_DUE_ITEMS } from "./cils-due";
import { CELI_DUE_ITEMS } from "./celi-due";
import type { RawItem } from "./types";

export { CILS_B1C_ITEMS, CILS_UNO_ITEMS, CILS_DUE_ITEMS, CELI_DUE_ITEMS };
export type { RawItem };

export const BATCH1_ITEMS: RawItem[] = [
  ...CILS_B1C_ITEMS,
  ...CILS_UNO_ITEMS,
  ...CILS_DUE_ITEMS,
  ...CELI_DUE_ITEMS,
];
