import { describe, expect, it } from "vitest";
import { siteConfig, validateConfig } from "@/config/site-config";
import { chooseDefaultPrayer, getLocalDate, isPrayerBookable } from "@/lib/prayer-time";

describe("parking configuration", () => {
  it("accepts the bundled configuration", () => {
    expect(validateConfig(siteConfig)).toBe(siteConfig);
  });

  it("rejects duplicate stable slot IDs", () => {
    const invalid = structuredClone(siteConfig);
    invalid.slots.push({ ...invalid.slots[0] });
    expect(() => validateConfig(invalid)).toThrow("Duplicate parking slot ID");
  });
});

describe("prayer timing", () => {
  const timeZone = "Europe/Stockholm";

  it("uses the mosque-local calendar date", () => {
    expect(getLocalDate(new Date("2026-08-20T22:30:00Z"), timeZone)).toBe("2026-08-21");
  });

  it("closes a prayer after its configured grace period", () => {
    const prayer = { id: "dhuhr", name: "Dhuhr", time: "13:30" };
    expect(isPrayerBookable(prayer, new Date("2026-08-21T11:59:00Z"), timeZone, 30)).toBe(true);
    expect(isPrayerBookable(prayer, new Date("2026-08-21T12:01:00Z"), timeZone, 30)).toBe(false);
  });

  it("selects the next prayer still accepting bookings", () => {
    const prayers = [
      { id: "dhuhr", name: "Dhuhr", time: "13:30" },
      { id: "asr", name: "Asr", time: "17:30" },
    ];
    expect(chooseDefaultPrayer(prayers, new Date("2026-08-21T13:00:00Z"), timeZone, 30).id).toBe("asr");
  });
});
