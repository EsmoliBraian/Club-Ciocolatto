import Link from "next/link";
import { ArrowRight, Gift, QrCode, Sparkles, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listActiveTiersCached } from "@/server/services/tier-service";
import { listActiveRewards } from "@/server/services/reward-service";

// Public marketing page — content (tiers/rewards) is admin-editable, so it
// can't be static forever. ISR keeps it fast without hitting the DB per request.
export const revalidate = 300;

const STEPS = [
  { icon: Sparkles, title: "Creá tu cuenta", body: "Registrate en un minuto y sumate al Club." },
  { icon: Trophy, title: "Sumá puntos", body: "Ganá puntos con cada compra en Ciocolatto." },
  { icon: ArrowRight, title: "Subí de nivel", body: "Escalá de Amigo a Fan y a Fanático Ciocolatto." },
  { icon: Gift, title: "Desbloqueá beneficios", body: "Accedé a descuentos y regalos exclusivos." },
  { icon: QrCode, title: "Volvé por más", body: "Mostrá tu QR en caja y seguí sumando." },
];

export default async function LandingPage() {
  const [tiers, rewards] = await Promise.all([listActiveTiersCached(), listActiveRewards()]);

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-cc-green-800 px-6 py-20 text-cc-cream-50 sm:py-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <span className="rounded-full border border-cc-gold-400/40 bg-cc-gold-400/10 px-4 py-1 text-xs font-medium tracking-wide text-cc-gold-300 uppercase">
            Club Ciocolatto
          </span>
          <h1 className="font-heading text-4xl font-semibold text-balance sm:text-6xl">
            Más que clientes, <span className="text-cc-gold-400">fanáticos.</span>
          </h1>
          <p className="max-w-xl text-lg text-cc-cream-200">
            Premiá cada visita, cada café y cada momento compartido. Sumá puntos, subí de nivel y
            desbloqueá beneficios exclusivos en Ciocolatto.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-12 bg-cc-gold-400 px-8 text-base text-cc-green-900 hover:bg-cc-gold-300" render={<Link href="/registro" />}>
              Unirme al Club
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-cc-cream-50/30 bg-transparent px-8 text-base text-cc-cream-50 hover:bg-cc-cream-50/10"
              render={<Link href="/login" />}
            >
              Ya tengo cuenta
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <h2 className="text-center font-heading text-2xl font-semibold sm:text-3xl">Cómo funciona</h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-5">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                <step.icon className="size-6" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground">PASO {i + 1}</p>
              <p className="font-heading text-base font-semibold">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {tiers.length > 0 && (
        <section className="bg-secondary/40 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-heading text-2xl font-semibold sm:text-3xl">Niveles</h2>
            <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
              Cuantos más puntos sumás, más beneficios desbloqueás.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {tiers.map((tier) => (
                <Card key={tier.id} className="border-cc-beige-300">
                  <CardContent className="flex flex-col gap-3 pt-2">
                    <span className="text-3xl">{tier.icon}</span>
                    <h3 className="font-heading text-lg font-semibold">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tier.maximumPoints
                        ? `${tier.minimumPoints}–${tier.maximumPoints} puntos`
                        : `${tier.minimumPoints}+ puntos`}
                    </p>
                    <ul className="mt-1 space-y-1.5 text-sm">
                      {(tier.benefits as string[]).map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2">
                          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-cc-gold-400" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {rewards.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-center font-heading text-2xl font-semibold sm:text-3xl">Premios</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
            Canjeá tus puntos por beneficios reales, cuando quieras.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {rewards.slice(0, 8).map((reward) => (
              <Card key={reward.id}>
                <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
                  <Gift className="size-6 text-primary" />
                  <p className="font-medium text-sm">{reward.name}</p>
                  <p className="text-xs font-semibold text-cc-gold-400">{reward.pointsCost} pts</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="bg-cc-green-900 px-6 py-16 text-center text-cc-cream-50 sm:py-20">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
          <Users className="size-8 text-cc-gold-400" />
          <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
            Entrá al Club Ciocolatto
          </h2>
          <p className="text-cc-cream-200">
            Registrate gratis y empezá a sumar puntos desde tu primera visita.
          </p>
          <Button size="lg" className="h-12 bg-cc-gold-400 px-8 text-base text-cc-green-900 hover:bg-cc-gold-300" render={<Link href="/registro" />}>
            Unirme al Club
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ciocolatto. Todos los derechos reservados.
      </footer>
    </main>
  );
}
