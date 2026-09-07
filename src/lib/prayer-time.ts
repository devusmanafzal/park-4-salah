import type { Prayer } from "@/config/site-config";

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function getLocalDate(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getLocalMinutes(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone);
  return Number(parts.hour) * 60 + Number(parts.minute);
}

export function isPrayerBookable(prayer: Prayer, date: Date, timeZone: string, cutoffMinutes: number) {
  const [hour, minute] = prayer.time.split(":").map(Number);
  return getLocalMinutes(date, timeZone) <= hour * 60 + minute + cutoffMinutes;
}

export function chooseDefaultPrayer(prayers: Prayer[], date: Date, timeZone: string, cutoffMinutes: number) {
  return prayers.find((prayer) => isPrayerBookable(prayer, date, timeZone, cutoffMinutes)) ?? prayers[prayers.length - 1];
}

export function formatPrayerTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(
    new Date(2000, 0, 1, hour, minute),
  );
}
