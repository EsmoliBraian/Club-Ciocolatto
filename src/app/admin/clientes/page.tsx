import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ScanCustomerButton } from "@/components/admin/scan-customer";

export const metadata: Metadata = { title: "Clientes" };

const PAGE_SIZE = 20;

export default async function CustomersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tier?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const q = params.q?.trim();
  const tierSlug = params.tier;

  const tiers = await prisma.loyaltyTier.findMany({ orderBy: { displayOrder: "asc" } });

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
    ...(tierSlug ? { tier: { slug: tierSlug } } : {}),
  };

  const [total, customers] = await Promise.all([
    prisma.customerProfile.count({ where }),
    prisma.customerProfile.findMany({
      where,
      include: { user: true, tier: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Clientes</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{total} clientes</p>
          <ScanCustomerButton />
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/admin/clientes">
        <Input name="q" defaultValue={q} placeholder="Buscar por nombre, email o teléfono" className="max-w-xs" />
        <Select name="tier" defaultValue={tierSlug ?? "all"}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos los niveles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los niveles</SelectItem>
            {tiers.map((t) => (
              <SelectItem key={t.id} value={t.slug}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Puntos</TableHead>
              <TableHead>Última compra</TableHead>
              <TableHead>Total gastado</TableHead>
              <TableHead>Visitas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/admin/clientes/${c.id}`} className="hover:underline">
                    {c.user.firstName} {c.user.lastName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{c.tier?.name ?? "Amigo Ciocolatto"}</Badge>
                </TableCell>
                <TableCell>{c.pointsBalance}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.lastOrderAt ? formatDateTime(c.lastOrderAt) : "—"}
                </TableCell>
                <TableCell>{formatCurrency(Number(c.totalSpent))}</TableCell>
                <TableCell>{c.totalOrders}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {customers.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No se encontraron clientes.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/clientes?${new URLSearchParams({ ...(q ? { q } : {}), ...(tierSlug ? { tier: tierSlug } : {}), page: String(p) })}`}
              className={`rounded-md px-3 py-1 text-sm ${p === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
