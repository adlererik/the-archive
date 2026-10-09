import { BlockList, isIP } from "node:net";
import geoip from "geoip-lite";
const globalIPv6 = new BlockList();
globalIPv6.addSubnet("2000::", 3, "ipv6");
const documentationIPv6 = new BlockList();
documentationIPv6.addSubnet("2001:db8::", 32, "ipv6");

export function isPublicAddress(value) {
  const ip = String(value || "").replace(/^::ffff:/i, "");
  const type = isIP(ip);
  if (type === 4) {
    const [a, b] = ip.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)) || ip.startsWith("192.0.0.") || ip.startsWith("192.0.2.") || ip.startsWith("198.51.100.") || ip.startsWith("203.0.113."));
  }
  if (type === 6) {
    return globalIPv6.check(ip, "ipv6") && !documentationIPv6.check(ip, "ipv6");
  }
  return false;
}

export function visitorLocation(ip) {
  if (!isPublicAddress(ip)) return { city: "", region: "", country: "" };
  const result = geoip.lookup(ip);
  return { city: result?.city || "", region: result?.region || "", country: result?.country || "" };
}
