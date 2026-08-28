import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";

export const metadata: Metadata = { title: "Productos" };

export default async function ProductsAdminPage() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Productos</h1>
        <ProductFormDialog />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Multiplicador</TableHead>
              <TableHead>Bonus</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.category ?? "—"}</TableCell>
                <TableCell>{formatCurrency(Number(p.price))}</TableCell>
                <TableCell>{Number(p.pointsMultiplier)}x</TableCell>
                <TableCell>{p.bonusPoints}</TableCell>
                <TableCell>
                  {p.active ? <Badge>Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}
                </TableCell>
                <TableCell>
                  <ProductFormDialog product={p} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {products.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Todavía no creaste productos.</p>
        )}
      </div>
    </div>
  );
}
