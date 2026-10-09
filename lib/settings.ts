import { prisma } from "./prisma";

export const defaultHeader = { title: "The Archive", eyebrow: "Private collection", description: "A continuous preservation of the moments that made a life." };
export type HeaderSettings = typeof defaultHeader;
export async function getHeader(): Promise<HeaderSettings> {
  return await prisma.siteSettings.findUnique({ where: { id: "site" } }) || defaultHeader;
}
