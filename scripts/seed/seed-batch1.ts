// Seeds Batch 1 into ItalianItem. Idempotent: upsert on the @@unique([exam,level,section,title])
// key, so re-running updates in place and never duplicates. Run: npm run seed:batch1
import { PrismaClient, type Prisma } from "@prisma/client";
import { BATCH1_ITEMS } from "./batch1/index";

const prisma = new PrismaClient();

async function main() {
  // One upsert per item on the @@unique([exam,level,section,title]) key — idempotent,
  // no redundant read. Batched with a small concurrency so 100 items over a us-east
  // pooled connection don't run as 100 slow sequential round-trips.
  const CONCURRENCY = 10;
  for (let i = 0; i < BATCH1_ITEMS.length; i += CONCURRENCY) {
    const slice = BATCH1_ITEMS.slice(i, i + CONCURRENCY);
    await Promise.all(slice.map((it) => {
      const data = {
        exam: it.exam as Prisma.ItalianItemCreateInput["exam"],
        level: it.level,
        section: it.section,
        taskType: it.taskType as Prisma.ItalianItemCreateInput["taskType"],
        difficulty: it.difficulty as Prisma.ItalianItemCreateInput["difficulty"],
        title: it.title,
        prompt: it.prompt ?? null,
        topicTag: it.topicTag ?? null,
        guidanceNote: it.guidanceNote ?? null,
        payload: it.payload as unknown as Prisma.InputJsonValue,
      };
      return prisma.italianItem.upsert({
        where: { exam_level_section_title: { exam: data.exam, level: it.level, section: it.section, title: it.title } },
        create: data,
        update: data,
      });
    }));
  }

  const total = await prisma.italianItem.count();
  const byExam = await prisma.italianItem.groupBy({ by: ["exam"], _count: true });
  console.log(`Batch 1 seed complete — ${BATCH1_ITEMS.length} items upserted.`);
  console.log(`ItalianItem total in DB: ${total}`);
  for (const g of byExam.sort((a, b) => a.exam.localeCompare(b.exam))) console.log(`  ${g.exam}: ${g._count}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
