import { describe, it, expect } from "vitest";
import { toBusinessLocalParts } from "@/lib/timezone";

describe("toBusinessLocalParts", () => {
  it("converts a UTC instant to Buenos Aires local day-of-week and minute-of-day", () => {
    // 2026-01-06T18:00:00Z is a Tuesday; Buenos Aires (UTC-3) local time is
    // 2026-01-06 15:00, still Tuesday — no day-wrap for this instant.
    const result = toBusinessLocalParts(new Date("2026-01-06T18:00:00.000Z"));
    expect(result.dayOfWeek).toBe(2); // Tuesday
    expect(result.minuteOfDay).toBe(15 * 60); // 15:00
  });

  it("wraps to the previous day when UTC time is before the Buenos Aires offset", () => {
    // 2026-01-07T01:00:00Z (Wednesday 01:00 UTC) is 2026-01-06T22:00 in
    // Buenos Aires — still Tuesday.
    const result = toBusinessLocalParts(new Date("2026-01-07T01:00:00.000Z"));
    expect(result.dayOfWeek).toBe(2); // Tuesday, not Wednesday
    expect(result.minuteOfDay).toBe(22 * 60);
  });
});
