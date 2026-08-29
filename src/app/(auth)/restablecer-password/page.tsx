import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/shared/reset-password-form";

export const metadata: Metadata = { title: "Restablecer contraseña" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="font-heading text-xl font-semibold">Link inválido</h1>
        <p className="text-sm text-muted-foreground">Pedí un nuevo link para restablecer tu contraseña.</p>
        <Link href="/olvide-password" className="text-sm font-medium text-primary hover:underline">
          Pedir un link nuevo
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
