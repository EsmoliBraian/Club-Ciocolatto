import Link from "next/link";
import Image from "next/image";
import { Leaf, Star, Gift, Crown, ChevronRight, UserPlus, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const VIP_BG = "#0F1F17";
const VIP_GREEN = "#1C4328";
const VIP_GOLD = "#D4AF37";
const VIP_TEXT_MUTED = "#A3A59E";

const BENEFITS = [
  { icon: Star, label: "Sumá puntos", sub: "en cada compra" },
  { icon: Gift, label: "Beneficios", sub: "exclusivos" },
  { icon: Crown, label: "Niveles VIP", sub: "y recompensas" },
];

export default function WelcomePage() {
  return (
    <main
      className="relative flex flex-1 flex-col overflow-hidden px-6 pt-10 pb-8 text-center"
      style={{ backgroundColor: VIP_BG }}
    >
      <div
        className="pointer-events-none absolute -top-10 -left-16 h-72 w-72 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle, ${VIP_GOLD} 0%, transparent 70%)`,
        }}
      />
      <Leaf
        className="pointer-events-none absolute top-6 -left-6 size-40 -rotate-12 opacity-[0.06]"
        style={{ color: VIP_GOLD }}
      />

      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col items-center">
        <div className="flex flex-col items-center gap-1.5">
          <Leaf className="size-7" style={{ color: VIP_GOLD }} />
          <p className="font-logo text-3xl font-semibold italic" style={{ color: VIP_GOLD }}>
            Ciocolatto
          </p>
          <p className="text-xs font-semibold tracking-[0.25em]" style={{ color: VIP_TEXT_MUTED }}>
            VIP CLUB
          </p>
        </div>

        <div
          className="mt-5 flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold"
          style={{ borderColor: `${VIP_GOLD}55`, color: VIP_GOLD }}
        >
          <Star className="size-3.5 fill-current" />
          MEMBRESÍAS VIP
        </div>

        <div className="mt-5 flex flex-col items-center gap-3">
          <h1 className="font-logo text-3xl leading-tight font-semibold text-balance text-cc-cream-50">
            Bienvenido al
            <br />
            <span style={{ color: VIP_GOLD }}>Club Ciocolatto</span>
          </h1>
          <p className="max-w-xs text-sm leading-relaxed" style={{ color: VIP_TEXT_MUTED }}>
            Disfrutá beneficios exclusivos, acumulá puntos y viví la experiencia Ciocolatto como nunca antes.
          </p>
        </div>

        <div
          className="mt-6 grid w-full grid-cols-3 gap-2 rounded-2xl border px-3 py-4"
          style={{ borderColor: `${VIP_GOLD}30`, backgroundColor: `${VIP_GREEN}40` }}
        >
          {BENEFITS.map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-1.5 px-1">
              <span
                className="flex size-9 items-center justify-center rounded-full"
                style={{ backgroundColor: `${VIP_GOLD}1f`, color: VIP_GOLD }}
              >
                <b.icon className="size-4" />
              </span>
              <p className="text-xs leading-tight font-semibold text-cc-cream-50">{b.label}</p>
              <p className="text-[10.5px] leading-tight" style={{ color: VIP_TEXT_MUTED }}>
                {b.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex w-full flex-col gap-3">
          <Button
            size="lg"
            className="h-12 w-full text-base font-semibold"
            style={{ backgroundColor: VIP_GOLD, color: VIP_BG }}
            render={<Link href="/login" />}
          >
            Iniciar sesión
            <ChevronRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-full border-2 bg-transparent text-base font-semibold text-cc-cream-50 hover:bg-white/5"
            style={{ borderColor: `${VIP_GOLD}66` }}
            render={<Link href="/registro" />}
          >
            Crear cuenta
            <UserPlus className="size-4" />
          </Button>

          <Link
            href="/explorar"
            className="mt-1 flex items-center justify-center gap-1 text-sm hover:text-cc-cream-50"
            style={{ color: VIP_TEXT_MUTED }}
          >
            Continuar como invitado
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        <div
          className="relative mt-8 h-56 w-full flex-1"
          style={{
            maskImage: "radial-gradient(ellipse 78% 72% at 50% 42%, black 38%, transparent 88%)",
            WebkitMaskImage: "radial-gradient(ellipse 78% 72% at 50% 42%, black 38%, transparent 88%)",
          }}
        >
          <Image
            src="/cafe-interior.png"
            alt="El local de Ciocolatto"
            fill
            sizes="(max-width: 480px) 100vw, 384px"
            className="object-cover"
            priority
          />
        </div>

        <div
          className="mt-6 flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left"
          style={{ borderColor: `${VIP_GOLD}30`, backgroundColor: `${VIP_GREEN}40` }}
        >
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${VIP_GOLD}1f`, color: VIP_GOLD }}
          >
            <Crown className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-cc-cream-50">Tu experiencia, tus beneficios</p>
            <p className="text-xs" style={{ color: VIP_TEXT_MUTED }}>
              Cada compra te acerca a nuevas recompensas y experiencias únicas.
            </p>
            <Link
              href="/explorar"
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
              style={{ color: VIP_GOLD }}
            >
              Conocé más sobre el Club
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px]" style={{ color: VIP_TEXT_MUTED }}>
          <Lock className="size-3" />
          Tus datos están protegidos con cifrado de nivel bancario.
        </div>
      </div>
    </main>
  );
}
