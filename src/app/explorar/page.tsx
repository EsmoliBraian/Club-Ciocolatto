import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listActiveTiersCached } from "@/server/services/tier-service";
import { listActiveRewards } from "@/server/services/reward-service";

export const metadata: Metadata = { title: "Explorar el Club" };
export const revalidate = 300;

export default async function ExplorePage() {
  const [tiers, rewards] = await Promise.all([listActiveTiersCached(), listActiveRewards()]);

  return (
    <main className="flex flex-1 flex-col bg-cc-green-900 px-6 pt-6 pb-10">
      <Link href="/" className="flex items-center gap-1.5 self-start text-sm text-cc-cream-200 hover:text-cc-cream-50">
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <div className="mx-auto mt-4 flex w-full max-w-sm flex-col items-center gap-2 text-center">
        <p className="font-heading text-2xl font-semibold text-cc-cream-50">Club Ciocolatto</p>
        <p className="text-sm text-cc-cream-200">Más que clientes, fanáticos.</p>
      </div>

      {tiers.length > 0 && (
        <section className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3">
          <p className="flex items-center gap-1.5 font-heading text-sm font-semibold text-cc-gold-300">
            <Sparkles className="size-4" />
            Niveles
          </p>
          {tiers.map((tier) => (
            <div key={tier.id} className="flex items-start gap-3 rounded-2xl bg-cc-cream-50 p-4">
              <span className="text-2xl">{tier.icon}</span>
              <div>
                <p className="font-heading font-semibold text-cc-green-900">{tier.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tier.maximumPoints ? `${tier.minimumPoints}–${tier.maximumPoints} puntos` : `${tier.minimumPoints}+ puntos`}
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {(tier.benefits as string[]).slice(0, 3).map((b) => (
                    <li key={b} className="text-xs text-cc-green-800">
                      • {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </section>
      )}

      {rewards.length > 0 && (
        <section className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3">
          <p className="flex items-center gap-1.5 font-heading text-sm font-semibold text-cc-gold-300">
            <Gift className="size-4" />
            Premios
          </p>
          <div className="grid grid-cols-2 gap-3">
            {rewards.slice(0, 6).map((reward) => (
              <div key={reward.id} className="flex flex-col items-center gap-1 rounded-2xl bg-cc-cream-50 p-4 text-center">
                <span className="text-2xl">{reward.icon ?? "🎁"}</span>
                <p className="text-sm font-medium text-cc-green-900">{reward.name}</p>
                <p className="text-xs font-semibold text-cc-gold-400">{reward.pointsCost} pts</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <Button
        size="lg"
        className="mx-auto mt-10 h-12 w-full max-w-sm bg-cc-gold-400 text-base text-cc-green-900 hover:bg-cc-gold-300"
        render={<Link href="/registro" />}
      >
        Unirme al Club
      </Button>
    </main>
  );
}
