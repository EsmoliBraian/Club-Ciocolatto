import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  return (
    <main className="flex flex-1 flex-col bg-cc-green-900 px-6 pt-12 pb-8 text-center">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center">
        <p className="font-logo text-3xl font-semibold text-cc-gold-400 italic">Ciocolatto</p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold text-cc-cream-50 text-balance">
            Bienvenido al
            <br />
            Club Ciocolatto
          </h1>
          <p className="max-w-xs text-sm text-cc-cream-200">
            Iniciá sesión o creá tu cuenta para empezar a disfrutar beneficios.
          </p>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Button
            size="lg"
            className="h-12 w-full bg-cc-cream-50 text-base text-cc-green-900 hover:bg-cc-cream-100"
            render={<Link href="/login" />}
          >
            Iniciar sesión
          </Button>
          <Button
            size="lg"
            className="h-12 w-full bg-cc-cream-50 text-base text-cc-green-900 hover:bg-cc-cream-100"
            render={<Link href="/registro" />}
          >
            Crear cuenta
          </Button>
          <Link href="/explorar" className="mt-1 text-sm text-cc-cream-200/80 hover:text-cc-cream-50">
            Continuar como invitado
          </Link>
        </div>

        <div className="relative mt-8 h-44 w-full flex-1 overflow-hidden rounded-3xl ring-1 ring-cc-cream-50/10">
          <Image
            src="/cafe-interior.png"
            alt="El local de Ciocolatto"
            fill
            sizes="(max-width: 480px) 100vw, 384px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cc-green-900/40 via-transparent to-transparent" />
        </div>
      </div>
    </main>
  );
}
