import { BATCH1_ITEMS } from "./batch1/index.ts";
import { writeFileSync } from "node:fs";
writeFileSync(new URL("../../src/data/items-batch1.json", import.meta.url), JSON.stringify(BATCH1_ITEMS, null, 0));
const key = (i) => `${i.exam} | ${i.level} | ${i.section} | part=${i.payload?.part ?? "-"} | ${i.taskType}`;
const m = new Map();
for (const i of BATCH1_ITEMS) m.set(key(i), (m.get(key(i))??0)+1);
console.log("TOTAL", BATCH1_ITEMS.length);
for (const [k,v] of [...m.entries()].sort()) console.log(`${String(v).padStart(3)}  ${k}`);
