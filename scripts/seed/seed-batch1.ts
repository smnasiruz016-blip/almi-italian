// Seeds Batch 1 into ItalianItem. Idempotent: upsert on the @@unique([exam,level,section,title])
// key, so re-running updates in place and never duplicates. Run: npm run seed:batch1
import { PrismaClient, type Prisma } from "@prisma/client";
import { BATCH1_ITEMS } from "./batch1/index";

const prisma = new PrismaClient();

async function main() {
  let created = 0;
  let updated = 0;

  for (const it of BATCH1_ITEMS) {
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

    const existing = await prisma.italianItem.findUnique({
      where: { exam_level_section_title: { exam: data.exam, level: it.level, section: it.section, title: it.title } },
      select: { id: true },
    });

    await prisma.italianItem.upsert({
      where: { exam_level_section_title: { exam: data.exam, level: it.level, section: it.section, title: it.title } },
      create: data,
      update: data,
    });

    if (existing) updated++;
    else created++;
  }

  const total = await prisma.italianItem.count();
  const byExam = await prisma.italianItem.groupBy({ by: ["exam"], _count: true });
  console.log(`Batch 1 seed complete — created ${created}, updated ${updated}.`);
  console.log(`ItalianItem total in DB: ${total}`);
  for (const g of byExam) console.log(`  ${g.exam}: ${g._count}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
