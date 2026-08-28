import type { Metadata } from "next";
import Link from "next/link";
import { TicketCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FindCustomerForm } from "@/components/employee/find-customer-form";

export const metadata: Metadata = { title: "Mostrador" };

export default function EmployeeHomePage() {
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Escanear cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <FindCustomerForm />
        </CardContent>
      </Card>

      <Link href="/empleado/validar">
        <Card className="transition-colors hover:bg-secondary/50">
          <CardContent className="flex items-center gap-3 py-4">
            <TicketCheck className="size-5 text-primary" />
            <div>
              <p className="font-medium">Validar canje</p>
              <p className="text-sm text-muted-foreground">
                Ingresá el código de beneficio que te muestra el cliente.
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
