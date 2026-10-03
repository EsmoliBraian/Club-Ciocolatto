"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BrandIcon } from "@/components/shared/brand-icon";
import { cn } from "@/lib/utils";

const ROTATE_MS = 3000;
const TRANSITION_MS = 500;

export interface CarouselPromo {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
}

/** Auto-advancing banner for /inicio — rotates through every active (or, if
 * none, upcoming) promo every 3s. Clicking a slide goes to its detail page
 * instead of acting directly, so a promo like "Día de la Madre" can explain
 * itself before the "Enviar mensaje" CTA on that page. */
export function PromoCarousel({ promos, isActive }: { promos: CarouselPromo[]; isActive: boolean }) {
  const [index, setIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const loop = promos.length > 1;
  const slides = loop ? [...promos, promos[0]] : promos;
  const isCloneFrame = loop && index === slides.length - 1;

  useEffect(() => {
    if (!loop) return;
    const id = setInterval(() => setIndex((i) => i + 1), ROTATE_MS);
    return () => clearInterval(id);
  }, [loop]);

  useEffect(() => {
    if (!noTransition) return;
    const raf = requestAnimationFrame(() => setNoTransition(false));
    return () => cancelAnimationFrame(raf);
  }, [noTransition]);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: noTransition ? "none" : `transform ${TRANSITION_MS}ms ease`,
          }}
          onTransitionEnd={() => {
            if (isCloneFrame) {
              setNoTransition(true);
              setIndex(0);
            }
          }}
        >
          {slides.map((promo, i) => (
            <Link
              key={`${promo.id}-${i}`}
              href={`/promociones/${promo.id}`}
              className="relative flex min-h-32 min-w-full items-center gap-3 overflow-hidden rounded-2xl border border-primary/40 bg-primary/10 p-4 shadow-sm"
              style={
                promo.imageUrl
                  ? {
                      backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.2)), url(${promo.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <BrandIcon emoji={promo.icon ?? "🎉"} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-xs font-semibold tracking-wide uppercase",
                    promo.imageUrl ? "text-white/80" : "text-muted-foreground"
                  )}
                >
                  {isActive ? "Promoción activa" : "Próximamente"}
                </p>
                <p
                  className={cn(
                    "truncate font-heading font-semibold",
                    promo.imageUrl ? "text-white" : "text-foreground"
                  )}
                >
                  {promo.name}
                </p>
                {promo.description && (
                  <p
                    className={cn(
                      "mt-0.5 truncate text-xs",
                      promo.imageUrl ? "text-white/80" : "text-muted-foreground"
                    )}
                  >
                    {promo.description}
                  </p>
                )}
              </div>
              <ChevronRight className={cn("size-5 shrink-0", promo.imageUrl ? "text-white/80" : "text-muted-foreground")} />
            </Link>
          ))}
        </div>
      </div>
      {loop && (
        <div className="flex justify-center gap-1.5">
          {promos.map((promo, i) => (
            <span
              key={promo.id}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                i === index % promos.length ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
