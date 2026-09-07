import rawConfig from "./parking-slots.json";

export type Prayer = {
  id: string;
  name: string;
  time: string;
};

export type ParkingSlot = {
  id: string;
  label: string;
  owner: string;
  description: string;
  image?: string;
};

export type SiteConfig = {
  siteName: string;
  communityName: string;
  timeZone: string;
  bookingClosesMinutesAfterPrayer: number;
  prayers: Prayer[];
  slots: ParkingSlot[];
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,30}$/;

export function validateConfig(value: unknown): SiteConfig {
  if (!value || typeof value !== "object") throw new Error("Parking configuration must be an object.");
  const config = value as SiteConfig;

  if (!config.siteName?.trim() || !config.communityName?.trim()) throw new Error("Site and community names are required.");
  try {
    new Intl.DateTimeFormat("en", { timeZone: config.timeZone }).format();
  } catch {
    throw new Error(`Invalid time zone: ${config.timeZone}`);
  }
  if (!Number.isInteger(config.bookingClosesMinutesAfterPrayer) || config.bookingClosesMinutesAfterPrayer < 0) {
    throw new Error("Booking cutoff must be a non-negative whole number.");
  }
  if (!Array.isArray(config.prayers) || config.prayers.length === 0) throw new Error("At least one prayer is required.");
  if (!Array.isArray(config.slots) || config.slots.length === 0) throw new Error("At least one parking slot is required.");

  const prayerIds = new Set<string>();
  for (const prayer of config.prayers) {
    if (!ID_PATTERN.test(prayer.id) || !prayer.name?.trim() || !TIME_PATTERN.test(prayer.time)) {
      throw new Error(`Invalid prayer configuration: ${prayer.id || "unknown"}`);
    }
    if (prayerIds.has(prayer.id)) throw new Error(`Duplicate prayer ID: ${prayer.id}`);
    prayerIds.add(prayer.id);
  }

  const slotIds = new Set<string>();
  for (const slot of config.slots) {
    if (!ID_PATTERN.test(slot.id) || !slot.label?.trim() || !slot.owner?.trim()) {
      throw new Error(`Invalid parking slot: ${slot.id || "unknown"}`);
    }
    if (slotIds.has(slot.id)) throw new Error(`Duplicate parking slot ID: ${slot.id}`);
    slotIds.add(slot.id);
  }

  return config;
}

export const siteConfig = validateConfig(rawConfig);
