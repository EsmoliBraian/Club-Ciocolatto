import Link from "next/link";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  return (
    <main className="flex flex-1 flex-col bg-cc-green-900 px-6 pt-12 pb-8 text-center">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center">
        <p className="font-heading text-3xl font-semibold text-cc-gold-400 italic">Ciocolatto</p>

        <div className="mt-14 flex flex-1 flex-col items-center justify-center gap-3">
          <h1 className="font-heading text-3xl font-semibold text-cc-cream-50 text-balance">
            Bienvenido al
            <br />
            Club Ciocolatto
          </h1>
          <p className="max-w-xs text-sm text-cc-cream-200">
            Iniciá sesión o creá tu cuenta para empezar a disfrutar tus beneficios.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button
            size="lg"
            className="h-12 w-full bg-cc-gold-400 text-base text-cc-green-900 hover:bg-cc-gold-300"
            render={<Link href="/login" />}
          >
            Iniciar sesión
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-full border-cc-cream-50/30 bg-transparent text-base text-cc-cream-50 hover:bg-cc-cream-50/10"
            render={<Link href="/registro" />}
          >
            Crear cuenta
          </Button>
          <Link href="/explorar" className="mt-1 text-sm text-cc-cream-200/80 hover:text-cc-cream-50">
            Continuar como invitado
          </Link>
        </div>

        <div className="relative mt-8 flex h-36 w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-cc-green-700 via-cc-green-800 to-cc-green-900 ring-1 ring-cc-cream-50/10">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, var(--cc-gold-400) 0, transparent 35%), radial-gradient(circle at 80% 70%, var(--cc-cream-50) 0, transparent 30%)",
            }}
          />
          <Coffee className="relative size-10 text-cc-gold-400/70" />
        </div>
      </div>
    </main>
  );
}
