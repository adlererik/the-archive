export const birthDate = process.env.NEXT_PUBLIC_BIRTH_DATE || "2014-10-09";

export function ageAt(timestamp: string) {
  const born = new Date(birthDate + "T12:00:00");
  const date = new Date(timestamp);
  let age = date.getFullYear() - born.getFullYear();
  if (date.getMonth() < born.getMonth() || (date.getMonth() === born.getMonth() && date.getDate() < born.getDate())) age--;
  return Math.max(0, age);
}

export function localDateTime(timestamp = new Date().toISOString()) {
  const date = new Date(timestamp);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
