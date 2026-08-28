import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ValidateRedemptionForm } from "@/components/employee/validate-redemption-form";

export const metadata: Metadata = { title: "Validar canje" };

export default function ValidateRedemptionPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Validar canje</CardTitle>
      </CardHeader>
      <CardContent>
        <ValidateRedemptionForm />
      </CardContent>
    </Card>
  );
}
