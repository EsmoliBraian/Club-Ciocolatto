import { prisma } from "@/lib/prisma";
import type { Db } from "@/types/db";
import { toBusinessDayIndex } from "@/lib/timezone";

/**
 * "Visita" (reglas 2026) = un día calendario distinto con al menos una
 * compra de `minimumAmount` o más. Varias compras el mismo día cuentan como
 * una sola visita. Se deriva en vivo de `Order` — no hay contador cacheado,
 * para que nunca pueda desincronizarse (se consulta solo en canjes de box
 * sorpresa y en el chequeo de aniversario, no en cada carga de página).
 *
 * `since` acota a una ventana (ej. últimos 12 meses para aniversario);
 * omitido = de por vida, desde que el socio se registró.
 */
export async function countQualifyingVisits(
  customerProfileId: string,
  minimumAmount: number,
  since?: Date,
  db: Db = prisma
): Promise<number> {
  const orders = await db.order.findMany({
    where: {
      customerProfileId,
      status: "COMPLETED",
      totalAmount: { gte: minimumAmount },
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    select: { createdAt: true },
  });

  const days = new Set(orders.map((o) => toBusinessDayIndex(o.createdAt)));
  return days.size;
}
