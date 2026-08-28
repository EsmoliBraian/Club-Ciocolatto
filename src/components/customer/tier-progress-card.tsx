"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { TierProgress } from "@/server/services/tier-service";

export function TierProgressCard({
  pointsBalance,
  progress,
}: {
  pointsBalance: number;
  progress: TierProgress;
}) {
  const { currentTier, nextTier, pointsToNextTier, progressPct } = progress;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-cc-green-800 p-6 text-cc-cream-50 shadow-lg">
      <div
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-cc-gold-400/10"
        aria-hidden
      />
      <div className="relative flex items-center gap-2 text-sm font-medium text-cc-gold-300">
        <span className="text-lg leading-none">{currentTier?.icon ?? "🥉"}</span>
        {currentTier?.name ?? "Amigo Ciocolatto"}
      </div>

      <div className="relative mt-3 flex items-end gap-2">
        <Star className="mb-1.5 size-6 fill-cc-gold-400 text-cc-gold-400" />
        <span className="font-heading text-4xl font-bold tabular-nums">{pointsBalance}</span>
        <span className="mb-1 text-sm font-medium text-cc-cream-200">puntos</span>
      </div>

      <div className="relative mt-5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-cc-cream-50/15">
          <motion.div
            className="h-full rounded-full bg-cc-gold-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 text-sm text-cc-cream-200">
          {nextTier ? (
            <>
              <span className="font-semibold text-cc-cream-50">{pointsToNextTier}</span> puntos para llegar a{" "}
              <span className="font-semibold text-cc-gold-300">{nextTier.name.toUpperCase()}</span>
            </>
          ) : (
            "Estás en el nivel más alto del Club 🎉"
          )}
        </p>
      </div>
    </div>
  );
}
