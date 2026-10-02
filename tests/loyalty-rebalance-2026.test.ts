import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { registerOrder } from "@/server/services/order-service";
import { awardPoints, getProtectedBalance } from "@/server/services/loyalty-service";
import { getLoyaltyConfig, calculatePointsForAmount } from "@/server/services/config-service";
import { redeemReward } from "@/server/services/reward-service";
import { createReferral } from "@/server/services/referral-service";
import { countQualifyingVisits } from "@/server/services/visit-service";
import { createTestCustomer, cleanupTestCustomer } from "./helpers";

// Every reglas-2026 behavior this file exercises (rolling tier window,
// referral minimum, visit minimum, one-redemption-per-day) is gated behind
// LoyaltyConfig.activationDate — deploying the code must NOT change live
// behavior for real customers until an admin deliberately activates it (see
// tier-service.ts / order-service.ts / reward-service.ts). So this suite
// activates it for its own duration and restores the previous value after,
// the same way it already does for individual config fields elsewhere.
let previousActivationDate: Date | null = null;

beforeAll(async () => {
  const config = await prisma.loyaltyConfig.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });
  previousActivationDate = config.activationDate;
  await prisma.loyaltyConfig.update({ where: { id: "singleton" }, data: { activationDate: new Date("2020-01-01") } });
});

afterAll(async () => {
  await prisma.loyaltyConfig.update({ where: { id: "singleton" }, data: { activationDate: previousActivationDate } });
});

// Fixed future dates (well after any real "now" this suite runs at, so they
// fall inside seed-promo-dobles-mie-jue's 10-year window) — a known
// Wednesday (promo active) and a known Saturday (promo inactive), both at
// 18:00 UTC = 15:00 ART, same calendar day in both zones.
const A_WEDNESDAY = new Date("2026-11-04T18:00:00.000Z");
const A_SATURDAY = new Date("2026-11-07T18:00:00.000Z");

/** Gives a customer enough rolling PURCHASE points (last 12 months) to resolve to `slug` via
 * getEffectiveTier — NOT the same as writing CustomerProfile.tierId directly, which the new
 * tier resolution ignores for non-legacy customers (see tier-service.ts). */
async function setTier(profileId: string, slug: string) {
  const tier = await prisma.loyaltyTier.findUniqueOrThrow({ where: { slug } });
  await awardPoints({
    customerProfileId: profileId,
    type: "EARN",
    source: "PURCHASE",
    amount: tier.minimumPoints,
    description: "test: fija el nivel",
    silent: true,
  });
  return tier;
}

describe("reglas 2026: puntos por compra (base vs. nivel vs. promo — no se acumulan)", () => {
  let userId: string;
  let profileId: string;

  beforeEach(async () => {
    const { user, profile } = await createTestCustomer();
    userId = user.id;
    profileId = profile.id;
    // Consume el bono de primera compra para que el resto de las compras del
    // test reflejen solo la tasa base + el multiplicador bajo prueba.
    await registerOrder({
      customerProfileId: profileId,
      source: "MANUAL_EMPLOYEE",
      totalAmount: 1000,
      externalReference: `warmup-${randomUUID()}`,
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    await cleanupTestCustomer(userId);
  });

  it("compra sin nivel ni promo = solo la tasa base", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(A_SATURDAY);
    const config = await getLoyaltyConfig();
    const expected = calculatePointsForAmount(28_000, config);

    const order = await registerOrder({
      customerProfileId: profileId,
      source: "MANUAL_EMPLOYEE",
      totalAmount: 28_000,
      externalReference: `case-base-${randomUUID()}`,
    });
    expect(order.pointsEarned).toBe(expected);
  });

  it("nivel Fanático (+25%) aplica su multiplicador, y el extra no cuenta como PURCHASE", async () => {
    await setTier(profileId, "fanatico-ciocolatto");
    vi.useFakeTimers();
    vi.setSystemTime(A_SATURDAY);
    const config = await getLoyaltyConfig();
    const base = calculatePointsForAmount(28_000, config);

    const order = await registerOrder({
      customerProfileId: profileId,
      source: "MANUAL_EMPLOYEE",
      totalAmount: 28_000,
      externalReference: `case-tier-${randomUUID()}`,
    });
    expect(order.pointsEarned).toBe(Math.floor(base * 1.25));

    // El extra del multiplicador no cuenta para el umbral de nivel — solo la base.
    const purchaseTx = await prisma.pointTransaction.findMany({
      where: { customerProfileId: profileId, source: "PURCHASE", referenceId: order.orderId },
    });
    const bonusTx = await prisma.pointTransaction.findMany({
      where: { customerProfileId: profileId, source: "TIER_BONUS", referenceId: order.orderId },
    });
    expect(purchaseTx[0]?.amount).toBe(base);
    expect(bonusTx[0]?.amount).toBe(Math.floor(base * 1.25) - base);
  });

  it("puntos dobles miércoles/jueves no se acumulan con el nivel — se aplica el mayor de los dos", async () => {
    await setTier(profileId, "leyenda-ciocolatto"); // +100%, igual al x2 de la promo
    vi.useFakeTimers();
    vi.setSystemTime(A_WEDNESDAY); // dentro de la promo seed-promo-dobles-mie-jue
    const config = await getLoyaltyConfig();
    const base = calculatePointsForAmount(28_000, config);

    const order = await registerOrder({
      customerProfileId: profileId,
      source: "MANUAL_EMPLOYEE",
      totalAmount: 28_000,
      externalReference: `case-promo-tier-tie-${randomUUID()}`,
    });
    // x2 de nivel y x2 de promo empatan: base*2, no base*2 + base*1.
    expect(order.pointsEarned).toBe(base * 2);
  });

  it("fuera de miércoles/jueves la promo no aplica, solo queda la base (o el nivel, si hay)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(A_SATURDAY);
    const config = await getLoyaltyConfig();
    const base = calculatePointsForAmount(28_000, config);

    const order = await registerOrder({
      customerProfileId: profileId,
      source: "MANUAL_EMPLOYEE",
      totalAmount: 28_000,
      externalReference: `case-no-promo-${randomUUID()}`,
    });
    expect(order.pointsEarned).toBe(base);
  });
});

describe("reglas 2026: alta nueva", () => {
  it("registro + perfil + primera compra chica no alcanzan para subir de Amigo", async () => {
    const { user, profile } = await createTestCustomer();
    try {
      vi.useFakeTimers();
      vi.setSystemTime(A_SATURDAY);
      await awardPoints({
        customerProfileId: profile.id,
        type: "EARN",
        source: "REGISTRATION",
        amount: 20,
        description: "Bienvenida",
        silent: true,
      });
      await awardPoints({
        customerProfileId: profile.id,
        type: "EARN",
        source: "PROFILE_COMPLETION",
        amount: 30,
        description: "Perfil completo",
        silent: true,
      });
      const config = await getLoyaltyConfig();
      const base = calculatePointsForAmount(28_000, config);
      const order = await registerOrder({
        customerProfileId: profile.id,
        source: "MANUAL_EMPLOYEE",
        totalAmount: 28_000,
        externalReference: `case5-${randomUUID()}`,
      });
      // El pedido en sí solo refleja base + bono de primera compra — registro
      // y perfil completo son premios independientes, no parte de pointsEarned.
      expect(order.pointsEarned).toBe(base + config.firstPurchasePoints);

      const updated = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profile.id } });
      const amigo = await prisma.loyaltyTier.findUniqueOrThrow({ where: { slug: "amigo-ciocolatto" } });
      // Ni registro+perfil+bienvenida+una compra chica alcanzan el umbral de Fan.
      expect(updated.tierId).toBe(amigo.id);
    } finally {
      vi.useRealTimers();
      await cleanupTestCustomer(user.id);
    }
  });
});

describe("reglas 2026: saldo protegido (vencimiento solo de puntos nuevos)", () => {
  let userId: string;
  let profileId: string;

  beforeEach(async () => {
    const { user, profile } = await createTestCustomer();
    userId = user.id;
    profileId = profile.id;
  });

  afterEach(async () => {
    await cleanupTestCustomer(userId);
  });

  it("protege el saldo que ya tenía al activar; lo ganado después vence y un canje lo gasta primero", async () => {
    // 300 puntos "al momento de activar" (caso 10 del documento).
    await awardPoints({
      customerProfileId: profileId,
      type: "EARN",
      source: "PURCHASE",
      amount: 300,
      description: "antes de activar",
      silent: true,
    });
    const activationMoment = new Date();

    // 100 más, ganados DESPUÉS de activar — estos son los que pueden vencer.
    await awardPoints({
      customerProfileId: profileId,
      type: "EARN",
      source: "MANUAL_ADMIN",
      amount: 100,
      description: "después de activar",
      silent: true,
    });

    let profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.pointsBalance).toBe(400);
    expect(await getProtectedBalance(profileId, profile.pointsBalance, activationMoment)).toBe(300);

    // Caso 13: un canje de 150 gasta primero los 100 nuevos y además entra
    // 50 en lo protegido — el protegido baja junto con el saldo, a 250.
    await awardPoints({
      customerProfileId: profileId,
      type: "REDEEM",
      source: "REDEMPTION",
      amount: -150,
      description: "canje de prueba",
      silent: true,
    });

    profile = await prisma.customerProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(profile.pointsBalance).toBe(250);
    expect(await getProtectedBalance(profileId, profile.pointsBalance, activationMoment)).toBe(250);
  });
});

describe("reglas 2026: visitas (racha, box sorpresa, referidos)", () => {
  let userId: string;
  let profileId: string;

  beforeEach(async () => {
    const { user, profile } = await createTestCustomer();
    userId = user.id;
    profileId = profile.id;
  });

  afterEach(async () => {
    await cleanupTestCustomer(userId);
  });

  it("tres compras el mismo día = 1 visita; una compra chica no cuenta", async () => {
    const day = new Date("2026-02-02T12:00:00.000Z");
    await prisma.order.createMany({
      data: [
        { customerProfileId: profileId, totalAmount: 10_000, createdAt: day },
        { customerProfileId: profileId, totalAmount: 10_000, createdAt: new Date(day.getTime() + 3_600_000) },
        { customerProfileId: profileId, totalAmount: 10_000, createdAt: new Date(day.getTime() + 7_200_000) },
        { customerProfileId: profileId, totalAmount: 5_000, createdAt: new Date(day.getTime() + 86_400_000) },
      ],
    });
    const visits = await countQualifyingVisits(profileId, 8000);
    expect(visits).toBe(1);
  });

  it("box sorpresa: bloqueado con menos de 8 visitas, rechazado en el servidor aunque haya puntos", async () => {
    await prisma.customerProfile.update({ where: { id: profileId }, data: { pointsBalance: 4000 } });
    for (let i = 0; i < 7; i++) {
      await prisma.order.create({
        data: { customerProfileId: profileId, totalAmount: 9000, createdAt: new Date(Date.now() - i * 2 * 86_400_000) },
      });
    }
    await expect(
      prisma.$transaction((tx) =>
        redeemReward(tx, { customerProfileId: profileId, rewardId: "seed-reward-box-chico" })
      )
    ).rejects.toMatchObject({ code: "VISITS_REQUIRED" });

    // Con la 8va visita, se desbloquea.
    await prisma.order.create({
      data: { customerProfileId: profileId, totalAmount: 9000, createdAt: new Date(Date.now() - 20 * 86_400_000) },
    });
    const result = await prisma.$transaction((tx) =>
      redeemReward(tx, { customerProfileId: profileId, rewardId: "seed-reward-box-chico" })
    );
    expect(result.redemptionCode).toBeTruthy();
  });

  it("el referido no se completa con una compra por debajo del mínimo configurado", async () => {
    const referee = await createTestCustomer();
    try {
      await createReferral(prisma, {
        referrerProfileId: profileId,
        refereeProfileId: referee.profile.id,
        codeUsed: "whatever",
      });
      const config = await getLoyaltyConfig();
      const minimum = Number(config.referralMinPurchaseAmount);

      await registerOrder({
        customerProfileId: referee.profile.id,
        source: "MANUAL_EMPLOYEE",
        totalAmount: Math.max(1000, minimum - 1000),
        externalReference: `low-${randomUUID()}`,
      });
      let referral = await prisma.referral.findUniqueOrThrow({ where: { refereeId: referee.profile.id } });
      expect(referral.status).toBe("PENDING");

      await registerOrder({
        customerProfileId: referee.profile.id,
        source: "MANUAL_EMPLOYEE",
        totalAmount: minimum + 1000,
        externalReference: `high-${randomUUID()}`,
      });
      referral = await prisma.referral.findUniqueOrThrow({ where: { refereeId: referee.profile.id } });
      expect(referral.status).toBe("COMPLETED");
    } finally {
      await cleanupTestCustomer(referee.user.id);
    }
  });
});

describe("reglas 2026: bono dúo eliminado", () => {
  it("awardPoints nunca otorga una transacción REFERRAL_DUO", async () => {
    const { user, profile } = await createTestCustomer();
    try {
      await awardPoints({
        customerProfileId: profile.id,
        type: "EARN",
        source: "PURCHASE",
        amount: 10_000,
        description: "test",
        silent: true,
      });
      const duoTx = await prisma.pointTransaction.findMany({
        where: { customerProfileId: profile.id, source: "REFERRAL_DUO" },
      });
      expect(duoTx).toHaveLength(0);
    } finally {
      await cleanupTestCustomer(user.id);
    }
  });
});
