import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Download, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ScanCustomerButton } from "@/components/admin/scan-customer";
import { CreateCustomerDialog } from "@/components/admin/create-customer-dialog";
import { StatTile } from "@/components/admin/stat-tile";
import { Users, UserCheck, UserPlus } from "lucide-react";

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

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const activeSince = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [totalCustomers, activeCustomers, newThisMonth] = await Promise.all([
    prisma.customerProfile.count(),
    prisma.customerProfile.count({ where: { lastOrderAt: { gte: activeSince } } }),
    prisma.customerProfile.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);

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
  const exportParams = new URLSearchParams({ ...(q ? { q } : {}), ...(tierSlug ? { tier: tierSlug } : {}) });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestioná los clientes del programa de membresía.</p>
        </div>
        <div className="flex items-center gap-2">
          <ScanCustomerButton />
          <CreateCustomerDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Total de clientes" value={totalCustomers.toLocaleString("es-AR")} icon={Users} />
        <StatTile label="Clientes activos" value={activeCustomers.toLocaleString("es-AR")} icon={UserCheck} hint="Últimos 30 días" />
        <StatTile label="Nuevos este mes" value={newThisMonth.toLocaleString("es-AR")} icon={UserPlus} />
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/admin/clientes">
        <Input name="q" defaultValue={q} placeholder="Buscar cliente..." className="max-w-xs" />
        <Select name="tier" defaultValue={tierSlug ?? "all"}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
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
        <Button type="button" variant="outline" className="ml-auto" render={<a href={`/api/admin/customers/export?${exportParams}`} />}>
          <Download className="size-4" />
          Exportar
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Puntos</TableHead>
              <TableHead>Última compra</TableHead>
              <TableHead>Total gastado</TableHead>
              <TableHead>Visitas</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => {
              const initials = `${c.user.firstName[0]}${c.user.lastName[0] ?? ""}`.toUpperCase();
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/clientes/${c.id}`} className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-cc-green-800 text-xs text-cc-cream-50">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground hover:underline">
                          {c.user.firstName} {c.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.user.email}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.tier?.name ?? "Amigo Ciocolatto"}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{c.pointsBalance}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.lastOrderAt ? formatDateTime(c.lastOrderAt) : "—"}
                  </TableCell>
                  <TableCell>{formatCurrency(Number(c.totalSpent))}</TableCell>
                  <TableCell>{c.totalOrders}</TableCell>
                  <TableCell>
                    <Link href={`/admin/clientes/${c.id}`}>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
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
