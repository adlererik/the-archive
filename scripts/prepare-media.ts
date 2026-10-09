import { PrismaClient } from "@prisma/client";
import path from "path";
import { generateThumbnail } from "../lib/thumbnails";

const prisma = new PrismaClient({ datasourceUrl: "file:" + path.resolve("prisma/dev.db") });
async function main() {
  const items = await prisma.mediaItem.findMany({ where: { thumbnail: null }, select: { id: true, fileName: true } });
  let index = 0, prepared = 0, failed = 0;
  async function worker() {
    while (index < items.length) {
      const item = items[index++];
      const thumbnail = await generateThumbnail(item.fileName);
      if (thumbnail) { await prisma.mediaItem.update({ where: { id: item.id }, data: { thumbnail } }); prepared++; }
      else failed++;
      if ((prepared + failed) % 100 === 0) console.log("Prepared " + prepared + " previews");
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(JSON.stringify({ prepared, failed }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
