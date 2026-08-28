import Link from "next/link";
import type { TierProgress } from "@/server/services/tier-service";
import { CircularProgress } from "@/components/customer/circular-progress";

export function TierProgressCard({
  pointsBalance,
  progress,
}: {
  pointsBalance: number;
  progress: TierProgress;
}) {
  const { currentTier, nextTier, pointsToNextTier, progressPct } = progress;

  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-gradient-to-br from-cc-green-700 to-cc-green-900 px-6 py-7 text-center shadow-[0_16px_32px_-12px_rgba(20,42,28,0.45)]">
      <p className="text-xs font-semibold tracking-wide text-cc-gold-300 uppercase">
        {currentTier?.icon} {currentTier?.name ?? "Amigo Ciocolatto"}
      </p>

      <CircularProgress value={progressPct}>
        <div className="flex flex-col items-center">
          <span className="font-heading text-4xl font-bold tabular-nums text-cc-cream-50">{pointsBalance}</span>
          <span className="text-xs font-medium text-cc-cream-200">puntos</span>
        </div>
      </CircularProgress>

      <p className="max-w-[220px] text-sm text-cc-cream-200">
        {nextTier ? (
          <>
            <span className="font-semibold text-cc-cream-50">{pointsToNextTier}</span> puntos para ser{" "}
            <span className="font-semibold text-cc-gold-300">{nextTier.name}</span>
          </>
        ) : (
          "Estás en el nivel más alto del Club 🎉"
        )}
      </p>

      <Link
        href="/misiones"
        className="mt-1 rounded-full bg-cc-cream-50/10 px-4 py-1.5 text-xs font-semibold text-cc-cream-50 transition-colors hover:bg-cc-cream-50/20"
      >
        Ver cómo sumar puntos
      </Link>
    </div>
  );
}
