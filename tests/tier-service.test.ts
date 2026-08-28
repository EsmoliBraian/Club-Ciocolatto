import { describe, it, expect } from "vitest";
import { resolveTierForPoints, resolveNextTier, calculateTierProgress } from "@/server/services/tier-service";
import type { LoyaltyTier } from "@prisma/client";

function fakeTier(overrides: Partial<LoyaltyTier>): LoyaltyTier {
  return {
    id: overrides.name ?? "tier",
    name: "Tier",
    slug: "tier",
    minimumPoints: 0,
    maximumPoints: null,
    description: null,
    benefits: [],
    icon: null,
    color: null,
    displayOrder: 0,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const amigo = fakeTier({ id: "amigo", name: "Amigo", minimumPoints: 0, maximumPoints: 199, displayOrder: 1 });
const fan = fakeTier({ id: "fan", name: "Fan", minimumPoints: 200, maximumPoints: 499, displayOrder: 2 });
const fanatico = fakeTier({ id: "fanatico", name: "Fanático", minimumPoints: 500, maximumPoints: null, displayOrder: 3 });
const tiers = [amigo, fan, fanatico];

describe("resolveTierForPoints", () => {
  it("resolves the lowest tier at 0 points", () => {
    expect(resolveTierForPoints(0, tiers)?.id).toBe("amigo");
  });

  it("resolves the correct tier exactly at a boundary", () => {
    expect(resolveTierForPoints(200, tiers)?.id).toBe("fan");
    expect(resolveTierForPoints(199, tiers)?.id).toBe("amigo");
    expect(resolveTierForPoints(500, tiers)?.id).toBe("fanatico");
  });

  it("resolves the top tier for points beyond its minimum, with no upper bound", () => {
    expect(resolveTierForPoints(999_999, tiers)?.id).toBe("fanatico");
  });

  it("returns null when no tier's minimum is met", () => {
    expect(resolveTierForPoints(-1, [fan, fanatico])).toBeNull();
  });
});

describe("resolveNextTier", () => {
  it("returns the tier above the current one", () => {
    expect(resolveNextTier(amigo, tiers)?.id).toBe("fan");
  });

  it("returns null when already at the top tier", () => {
    expect(resolveNextTier(fanatico, tiers)).toBeNull();
  });

  it("returns the lowest tier when there is no current tier", () => {
    expect(resolveNextTier(null, tiers)?.id).toBe("amigo");
  });
});

describe("calculateTierProgress", () => {
  it("computes points remaining and percentage toward the next tier", () => {
    const progress = calculateTierProgress(320, tiers);
    expect(progress.currentTier?.id).toBe("fan");
    expect(progress.nextTier?.id).toBe("fanatico");
    expect(progress.pointsToNextTier).toBe(180);
    expect(progress.progressPct).toBeCloseTo(((320 - 200) / (500 - 200)) * 100);
  });

  it("reports 100% progress with no next tier at the top", () => {
    const progress = calculateTierProgress(750, tiers);
    expect(progress.nextTier).toBeNull();
    expect(progress.progressPct).toBe(100);
    expect(progress.pointsToNextTier).toBeNull();
  });
});
