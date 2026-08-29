/**
 * Development seed data. These accounts/passwords are for local development
 * only — never reuse SEED_* env values in a real deployment.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/password";
import { buildReferralCodeCandidate, generateQrToken } from "../src/lib/codes";
import { BIRTHDAY_COFFEE_REWARD_ID } from "../src/lib/constants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} for seeding`);
  return value;
}

async function main() {
  console.log("Seeding Club Ciocolatto…");

  await prisma.loyaltyConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      amountPerPoint: 1000,
      pointsPerAmount: 1,
      registrationPoints: 30,
      firstPurchasePoints: 50,
      birthdayPoints: 100,
      referralSponsorPoints: 50,
      referralRefereePoints: 100,
      redemptionCodeExpiryHours: 72,
      businessName: "Ciocolatto",
      contactEmail: "hola@ciocolatto.com",
    },
  });

  const [amigo, fan, fanatico] = await Promise.all([
    prisma.loyaltyTier.upsert({
      where: { slug: "amigo-ciocolatto" },
      update: {},
      create: {
        name: "Amigo Ciocolatto",
        slug: "amigo-ciocolatto",
        minimumPoints: 0,
        maximumPoints: 199,
        description: "Bienvenido al Club — empezá a sumar en cada visita.",
        icon: "🥉",
        color: "#8a9b6e",
        displayOrder: 1,
        benefits: ["Acceso al Club", "Sumás puntos en cada compra", "Misiones", "Regalo de cumpleaños"],
      },
    }),
    prisma.loyaltyTier.upsert({
      where: { slug: "fan-ciocolatto" },
      update: {},
      create: {
        name: "Fan Ciocolatto",
        slug: "fan-ciocolatto",
        minimumPoints: 200,
        maximumPoints: 499,
        description: "Ya sos parte de la familia Ciocolatto.",
        icon: "🥈",
        color: "#c89b3c",
        displayOrder: 2,
        benefits: ["Todo lo anterior", "5% OFF en productos seleccionados", "Promociones exclusivas"],
      },
    }),
    prisma.loyaltyTier.upsert({
      where: { slug: "fanatico-ciocolatto" },
      update: {},
      create: {
        name: "Fanático Ciocolatto",
        slug: "fanatico-ciocolatto",
        minimumPoints: 500,
        maximumPoints: null,
        description: "El nivel más alto del Club.",
        icon: "🥇",
        color: "#1c4328",
        displayOrder: 3,
        benefits: [
          "Todo lo anterior",
          "10% OFF en productos seleccionados",
          "Beneficios especiales",
          "Lanzamientos anticipados",
          "Eventos exclusivos",
        ],
      },
    }),
  ]);

  const products = await Promise.all(
    [
      { name: "Café", category: "Bebidas", price: 2500, bonusPoints: 0 },
      { name: "Café con leche", category: "Bebidas", price: 2800, bonusPoints: 0 },
      { name: "Medialuna", category: "Panadería", price: 900, bonusPoints: 0 },
      { name: "Porción de torta", category: "Pastelería", price: 3500, bonusPoints: 0 },
      { name: "Torta de chocolate", category: "Chocolate", price: 4200, bonusPoints: 0 },
      { name: "Alfajor de chocolate", category: "Chocolate", price: 1500, bonusPoints: 5 },
      { name: "Bombones surtidos", category: "Chocolate", price: 3900, bonusPoints: 0 },
      { name: "Torta de cumpleaños", category: "Tortas", price: 9500, bonusPoints: 0 },
    ].map((p) =>
      prisma.product.upsert({
        where: { externalSku: `SEED-${p.name.toUpperCase().replace(/\s+/g, "-")}` },
        update: {},
        create: { ...p, externalSku: `SEED-${p.name.toUpperCase().replace(/\s+/g, "-")}` },
      })
    )
  );
  const cafe = products.find((p) => p.name === "Café")!;
  const tortaCumple = products.find((p) => p.name === "Torta de cumpleaños")!;

  await Promise.all([
    prisma.reward.upsert({
      where: { id: "seed-reward-cafe" },
      update: { icon: "☕" },
      create: {
        id: "seed-reward-cafe",
        name: "Café americano",
        description: "Un café americano gratis en tu próxima visita.",
        icon: "☕",
        pointsCost: 100,
        active: true,
      },
    }),
    prisma.reward.upsert({
      where: { id: "seed-reward-medialuna" },
      update: { icon: "🥐" },
      create: {
        id: "seed-reward-medialuna",
        name: "Medialuna",
        description: "Medialuna de manteca gratis.",
        icon: "🥐",
        pointsCost: 120,
        active: true,
      },
    }),
    prisma.reward.upsert({
      where: { id: "seed-reward-torta" },
      update: { icon: "🍰" },
      create: {
        id: "seed-reward-torta",
        name: "Porción de torta",
        description: "Elegí tu porción de torta favorita.",
        icon: "🍰",
        pointsCost: 200,
        active: true,
      },
    }),
    prisma.reward.upsert({
      where: { id: "seed-reward-10off" },
      update: { category: "DISCOUNT", icon: "💰" },
      create: {
        id: "seed-reward-10off",
        name: "10% OFF",
        description: "10% de descuento en tu compra. Beneficio Fan Ciocolatto.",
        category: "DISCOUNT",
        icon: "💰",
        pointsCost: 150,
        requiredTierId: fan.id,
        active: true,
      },
    }),
    prisma.reward.upsert({
      where: { id: "seed-reward-5000off" },
      update: { category: "DISCOUNT", icon: "🎁" },
      create: {
        id: "seed-reward-5000off",
        name: "$5.000 OFF",
        description: "Beneficio exclusivo Fanático Ciocolatto.",
        category: "DISCOUNT",
        icon: "🎁",
        pointsCost: 400,
        requiredTierId: fanatico.id,
        active: true,
      },
    }),
    prisma.reward.upsert({
      where: { id: BIRTHDAY_COFFEE_REWARD_ID },
      update: { icon: "🎂" },
      create: {
        id: BIRTHDAY_COFFEE_REWARD_ID,
        name: "Café de cumpleaños",
        description: "Tu bebida favorita gratis, regalo de Ciocolatto por tu cumpleaños.",
        icon: "🎂",
        category: "PRODUCT",
        pointsCost: 0,
        hidden: true, // granted automatically by claimBirthdayReward() — never shown in the store
        perUserLimit: null,
        active: true,
      },
    }),
  ]);

  await Promise.all([
    prisma.mission.upsert({
      where: { id: "seed-mission-cafe" },
      update: {},
      create: {
        id: "seed-mission-cafe",
        name: "Misión Café",
        description: "Comprá 5 cafés y ganá puntos extra.",
        icon: "☕",
        type: "PRODUCT_PURCHASE",
        targetValue: 5,
        productId: cafe.id,
        rewardPoints: 50,
        perUserLimit: 12,
        active: true,
      },
    }),
    prisma.mission.upsert({
      where: { id: "seed-mission-merienda" },
      update: {},
      create: {
        id: "seed-mission-merienda",
        name: "Misión Merienda",
        description: "Visitá Ciocolatto 3 veces este mes.",
        icon: "🍰",
        type: "VISIT_COUNT",
        targetValue: 3,
        rewardPoints: 100,
        perUserLimit: 12,
        active: true,
      },
    }),
    prisma.mission.upsert({
      where: { id: "seed-mission-referido" },
      update: {
        name: "Invitá a 5 amigos",
        description: "Sumá 5 amigos que hagan su primera compra y ganá un bono extra.",
        targetValue: 5,
        rewardPoints: 150,
        perUserLimit: 1,
      },
      create: {
        id: "seed-mission-referido",
        name: "Invitá a 5 amigos",
        description: "Sumá 5 amigos que hagan su primera compra y ganá un bono extra.",
        icon: "🤝",
        type: "REFERRAL",
        targetValue: 5,
        rewardPoints: 150,
        perUserLimit: 1,
        active: true,
      },
    }),
    prisma.mission.upsert({
      where: { id: "seed-mission-referido-10" },
      update: {},
      create: {
        id: "seed-mission-referido-10",
        name: "Invitá a 10 amigos",
        description: "Llegá a 10 amigos referidos y ganá el bono más grande del Club.",
        icon: "🎉",
        type: "REFERRAL",
        targetValue: 10,
        rewardPoints: 300,
        perUserLimit: 1,
        active: true,
      },
    }),
    prisma.mission.upsert({
      where: { id: "seed-mission-torta-cumple" },
      update: {},
      create: {
        id: "seed-mission-torta-cumple",
        name: "Pedí tu torta de cumpleaños",
        description: "Encargá tu torta de cumpleaños en Ciocolatto y ganá puntos extra.",
        icon: "🎂",
        type: "PRODUCT_PURCHASE",
        targetValue: 1,
        productId: tortaCumple.id,
        rewardPoints: 200,
        perUserLimit: 12,
        active: true,
      },
    }),
  ]);

  const chocolateWeekStart = new Date();
  const chocolateWeekEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  await prisma.promotion.upsert({
    where: { id: "seed-promo-chocolate" },
    update: {},
    create: {
      id: "seed-promo-chocolate",
      name: "Semana del chocolate",
      description: "+75 puntos comprando productos de la categoría Chocolate.",
      type: "BONUS_POINTS",
      bonusPoints: 75,
      category: "Chocolate",
      startAt: chocolateWeekStart,
      endAt: chocolateWeekEnd,
      active: true,
    },
  });

  const adminPassword = await hashPassword(requireEnv("SEED_ADMIN_PASSWORD"));
  await prisma.user.upsert({
    where: { email: requireEnv("SEED_ADMIN_EMAIL") },
    update: {},
    create: {
      email: requireEnv("SEED_ADMIN_EMAIL"),
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      firstName: "Admin",
      lastName: "Ciocolatto",
      active: true,
    },
  });

  const employeePassword = await hashPassword(requireEnv("SEED_EMPLOYEE_PASSWORD"));
  await prisma.user.upsert({
    where: { email: requireEnv("SEED_EMPLOYEE_EMAIL") },
    update: {},
    create: {
      email: requireEnv("SEED_EMPLOYEE_EMAIL"),
      passwordHash: employeePassword,
      role: "EMPLOYEE",
      firstName: "Empleado",
      lastName: "Mostrador",
      active: true,
    },
  });

  const customerEmail = requireEnv("SEED_CUSTOMER_EMAIL");
  const existingCustomer = await prisma.user.findUnique({ where: { email: customerEmail } });
  if (!existingCustomer) {
    const customerPassword = await hashPassword(requireEnv("SEED_CUSTOMER_PASSWORD"));
    const user = await prisma.user.create({
      data: {
        email: customerEmail,
        passwordHash: customerPassword,
        role: "CUSTOMER",
        firstName: "Braian",
        lastName: "Demo",
        phone: "+5491100000000",
        birthDate: new Date(Date.UTC(1995, 4, 20)),
        favoriteDrink: "Latte",
        active: true,
      },
    });

    const profile = await prisma.customerProfile.create({
      data: {
        userId: user.id,
        referralCode: buildReferralCodeCandidate(user.firstName),
        qrToken: generateQrToken(),
        pointsBalance: 320,
        lifetimePoints: 320,
        tierId: fan.id,
        totalOrders: 4,
        totalSpent: 34500,
        firstOrderAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastOrderAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.pointTransaction.createMany({
      data: [
        {
          customerProfileId: profile.id,
          type: "EARN",
          source: "REGISTRATION",
          amount: 30,
          balanceAfter: 30,
          description: "Bienvenida al Club Ciocolatto",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          customerProfileId: profile.id,
          type: "BONUS",
          source: "FIRST_PURCHASE",
          amount: 50,
          balanceAfter: 80,
          description: "Primera compra 🎉",
          createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
        },
        {
          customerProfileId: profile.id,
          type: "EARN",
          source: "PURCHASE",
          amount: 100,
          balanceAfter: 180,
          description: "Compra #10201",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
        {
          customerProfileId: profile.id,
          type: "EARN",
          source: "MISSION",
          amount: 100,
          balanceAfter: 280,
          description: "Misión completada: Misión Merienda",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          customerProfileId: profile.id,
          type: "EARN",
          source: "PURCHASE",
          amount: 40,
          balanceAfter: 320,
          description: "Compra #10291",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    console.log(`Seeded demo customer ${customerEmail} with 320 points at Fan Ciocolatto tier.`);
  }

  console.log("Seed complete.");
  console.log(`  Tiers: ${[amigo, fan, fanatico].map((t) => t.name).join(", ")}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
