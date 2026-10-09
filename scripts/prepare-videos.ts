import { PrismaClient } from "@prisma/client";
import path from "path";
import { prepareVideo } from "../lib/video";
const prisma = new PrismaClient({ datasourceUrl: "file:" + path.resolve("prisma/dev.db") });
async function main() {
  const items = await prisma.mediaItem.findMany({ where: { mediaType: "VIDEO", playbackFile: null }, select: { id: true, fileName: true } });
  let next = 0, done = 0, failed = 0;
  async function worker() {
    while (next < items.length) {
      const item = items[next++];
      try {
        const playbackFile = await prepareVideo(item.fileName);
        await prisma.mediaItem.update({ where: { id: item.id }, data: { playbackFile } }); done++;
      } catch (error) { failed++; console.error("Playback copy failed:", item.fileName, error instanceof Error ? error.message : error); }
      if ((done + failed) % 25 === 0) console.log("Prepared", done, "of", items.length, "videos");
    }
  }
  await Promise.all(Array.from({ length: 3 }, worker));
  console.log(JSON.stringify({ prepared: done, failed })); if (failed) process.exitCode = 1;
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
