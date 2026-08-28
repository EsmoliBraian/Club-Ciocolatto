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
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <p className="text-sm font-medium text-cc-gold-300">
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
    </div>
  );
}
