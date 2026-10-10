import type { Prisma } from "@prisma/client";
import { readVisitorExclusions } from "@/scripts/visitor-exclusions.mjs";

// Stored IPv4 addresses are normalized; only globally routed IPv6 starts with 2 or 3.
const privatePrefixes = ["0.", "10.", "127.", "169.254.", "192.168.", "192.0.0.", "192.0.2.", "198.18.", "198.19.", "198.51.100.", "203.0.113.", ...Array.from({ length: 16 }, (_, index) => "172." + (16 + index) + "."), ...Array.from({ length: 64 }, (_, index) => "100." + (64 + index) + "."), ...Array.from({ length: 32 }, (_, index) => (224 + index) + ".")];
export async function visitorFilter(): Promise<Prisma.VisitWhereInput> {
  const exclusions = await readVisitorExclusions();
  return { AND: [{ OR: [{ AND: [{ ip: { contains: "." } }, { NOT: privatePrefixes.map(prefix => ({ ip: { startsWith: prefix } })) }] }, { AND: [{ OR: [{ ip: { startsWith: "2" } }, { ip: { startsWith: "3" } }] }, { ip: { contains: ":" } }, { NOT: { ip: { startsWith: "2001:db8:" } } }] }] }, { NOT: { OR: [{ ip: { in: exclusions.ips } }, { visitorKey: { in: exclusions.visitorKeys } }] } }] };
}
