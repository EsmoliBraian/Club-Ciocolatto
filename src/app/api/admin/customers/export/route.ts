import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, ADMIN_ROLES } from "@/lib/rbac";
import { formatDateTime } from "@/lib/format";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: Request) {
  await requireRole(...ADMIN_ROLES);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const tierSlug = searchParams.get("tier");

  const where: Prisma.CustomerProfileWhereInput = {
    ...(q
      ? {
          user: {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : {}),
    ...(tierSlug && tierSlug !== "all" ? { tier: { slug: tierSlug } } : {}),
  };

  const customers = await prisma.customerProfile.findMany({
    where,
    include: { user: true, tier: true },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Nombre",
    "Apellido",
    "Email",
    "Teléfono",
    "Nivel",
    "Puntos",
    "Total gastado",
    "Compras",
    "Última compra",
    "Fecha de alta",
  ];

  const rows = customers.map((c) =>
    [
      c.user.firstName,
      c.user.lastName,
      c.user.email,
      c.user.phone ?? "",
      c.tier?.name ?? "Amigo Ciocolatto",
      String(c.pointsBalance),
      String(c.totalSpent),
      String(c.totalOrders),
      c.lastOrderAt ? formatDateTime(c.lastOrderAt) : "",
      formatDateTime(c.createdAt),
    ]
      .map(csvEscape)
      .join(",")
  );

  const csv = "﻿" + [header.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-club-ciocolatto.csv"`,
    },
  });
}
