import geoip from "geoip-lite";
import { isPublicAddress } from "./visitor-address.mjs";
export { isPublicAddress } from "./visitor-address.mjs";

export function visitorLocation(ip) {
  if (!isPublicAddress(ip)) return { city: "", region: "", country: "" };
  const result = geoip.lookup(ip);
  return { city: result?.city || "", region: result?.region || "", country: result?.country || "" };
}
