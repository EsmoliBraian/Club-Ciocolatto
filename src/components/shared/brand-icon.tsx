import {
  Coffee,
  Cookie,
  Cake,
  Trophy,
  Crown,
  Tag,
  Gift,
  Sparkle,
  Heart,
  Handshake,
  Target,
  Medal,
  FlowerTulip,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

// Keeps the DB/admin-facing data model as a plain emoji string — the admin
// picks one of these from a visual grid (IconPicker) instead of typing an
// emoji, but the value stored and passed to BrandIcon is still just this
// same character, so nothing downstream (rendering, DB column) needed to
// change. Anything NOT in this list (e.g. a row seeded before this existed)
// falls back to rendering the raw emoji — never a broken icon.
export const BRAND_ICON_OPTIONS: { emoji: string; label: string; Icon: PhosphorIcon }[] = [
  { emoji: "☕", label: "Café", Icon: Coffee },
  { emoji: "🥐", label: "Bollería", Icon: Cookie },
  { emoji: "🍰", label: "Torta", Icon: Cake },
  { emoji: "🏆", label: "Trofeo", Icon: Trophy },
  { emoji: "👑", label: "Corona", Icon: Crown },
  { emoji: "💰", label: "Descuento", Icon: Tag },
  { emoji: "🎁", label: "Regalo", Icon: Gift },
  { emoji: "🎂", label: "Cumpleaños", Icon: Cake },
  { emoji: "🎉", label: "Fiesta", Icon: Sparkle },
  { emoji: "💌", label: "Carta", Icon: Heart },
  { emoji: "🤝", label: "Referido", Icon: Handshake },
  { emoji: "🎯", label: "Meta", Icon: Target },
  { emoji: "🏅", label: "Medalla", Icon: Medal },
  { emoji: "🌷", label: "Flor", Icon: FlowerTulip },
];

const EMOJI_ICON_MAP: Record<string, PhosphorIcon> = Object.fromEntries(
  BRAND_ICON_OPTIONS.map((o) => [o.emoji, o.Icon])
);

export function BrandIcon({
  emoji,
  size = 24,
  weight = "duotone",
  color,
  className,
}: {
  emoji?: string | null;
  size?: number | string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
  className?: string;
}) {
  if (!emoji) return null;
  const Icon = EMOJI_ICON_MAP[emoji];
  if (!Icon) {
    return <span className={className}>{emoji}</span>;
  }
  return <Icon size={size} weight={weight} color={color} className={className} />;
}
