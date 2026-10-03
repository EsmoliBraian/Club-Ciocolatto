"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BrandIcon } from "@/components/shared/brand-icon";
import { cn } from "@/lib/utils";

const ROTATE_MS = 3000;
const TRANSITION_MS = 500;
/** Minimum drag distance, as a % of the slide's width, before a release counts as a swipe instead of snapping back. */
const SWIPE_THRESHOLD_PCT = 15;
/** Minimum pointer movement in px before a gesture counts as a drag — below this it's treated as a tap (lets the Link navigate). */
const DRAG_TAP_THRESHOLD_PX = 8;

export interface CarouselPromo {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
}

/** Auto-advancing, swipeable banner for /inicio — rotates through every
 * active (or, if none, upcoming) promo every 3s and loops infinitely in
 * either direction. Clicking (or tapping without dragging) a slide goes to
 * its detail page instead of acting directly, so a promo like "Día de la
 * Madre" can explain itself before the "Enviar mensaje" CTA on that page. */
export function PromoCarousel({ promos, isActive }: { promos: CarouselPromo[]; isActive: boolean }) {
  const hasClones = promos.length > 1;
  const extended = hasClones ? [promos[promos.length - 1], ...promos, promos[0]] : promos;
  const [position, setPosition] = useState(hasClones ? 1 : 0);
  const [noTransition, setNoTransition] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState(0);
  const draggingRef = useRef(false);
  // The actual drag gate lives in a ref, not the `isDragging` state above:
  // on a phone, touchmove fires in rapid bursts and several events land
  // before React re-renders with a fresh closure, so a state-based check
  // here silently drops them (confirmed — worked with a mouse, not on
  // touch). A ref is read synchronously and is never stale. `isDragging`
  // state still exists purely to drive the transition/auto-advance pause.
  const gestureRef = useRef<{ startX: number; width: number; lastPercent: number } | null>(null);

  const realIndex = hasClones ? (((position - 1) % promos.length) + promos.length) % promos.length : 0;

  // Reschedules on every position change (auto or manual swipe) so a swipe
  // always buys a full, calm 3s before the next auto-advance — and pauses
  // entirely while the user is actively dragging.
  useEffect(() => {
    if (!hasClones || isDragging) return;
    const t = setTimeout(() => setPosition((p) => p + 1), ROTATE_MS);
    return () => clearTimeout(t);
  }, [hasClones, isDragging, position]);

  useEffect(() => {
    if (!noTransition) return;
    const raf = requestAnimationFrame(() => setNoTransition(false));
    return () => cancelAnimationFrame(raf);
  }, [noTransition]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (extended.length <= 1) return;
    draggingRef.current = false;
    gestureRef.current = { startX: e.clientX, width: e.currentTarget.clientWidth || 1, lastPercent: 0 };
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture) return;
    const deltaX = e.clientX - gesture.startX;
    if (Math.abs(deltaX) > DRAG_TAP_THRESHOLD_PX) draggingRef.current = true;
    gesture.lastPercent = (deltaX / gesture.width) * 100;
    setDragPercent(gesture.lastPercent);
  }

  function endDrag() {
    const gesture = gestureRef.current;
    if (!gesture) return;
    gestureRef.current = null;
    setIsDragging(false);
    if (gesture.lastPercent <= -SWIPE_THRESHOLD_PCT) {
      setPosition((p) => p + 1);
    } else if (gesture.lastPercent >= SWIPE_THRESHOLD_PCT) {
      setPosition((p) => p - 1);
    }
    setDragPercent(0);
  }

  function handleSlideClick(e: React.MouseEvent) {
    if (draggingRef.current) {
      e.preventDefault();
      draggingRef.current = false;
    }
  }

  const totalPercent = -(position * 100) + dragPercent;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="overflow-hidden rounded-2xl"
        style={{ touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="flex select-none"
          style={{
            transform: `translateX(${totalPercent}%)`,
            transition: isDragging || noTransition ? "none" : `transform ${TRANSITION_MS}ms ease`,
          }}
          onTransitionEnd={() => {
            if (!hasClones) return;
            if (position === 0) {
              setNoTransition(true);
              setPosition(promos.length);
            } else if (position === extended.length - 1) {
              setNoTransition(true);
              setPosition(1);
            }
          }}
        >
          {extended.map((promo, i) => (
            <Link
              key={`${promo.id}-${i}`}
              href={`/promociones/${promo.id}`}
              onClick={handleSlideClick}
              draggable={false}
              className="relative flex min-h-32 min-w-full items-center gap-3 overflow-hidden rounded-2xl border border-primary/40 bg-primary/10 p-4 shadow-sm"
              style={
                promo.imageUrl
                  ? {
                      backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.5)), url(${promo.imageUrl})`,
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
      {hasClones && (
        <div className="flex justify-center gap-1.5">
          {promos.map((promo, i) => (
            <span
              key={promo.id}
              className={cn("size-1.5 rounded-full transition-colors", i === realIndex ? "bg-primary" : "bg-border")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
