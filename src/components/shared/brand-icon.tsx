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
} from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

// Keeps the DB/admin-facing data model as a plain emoji string (admins still
// type "☕" into a text field, same as before) while upgrading the *render*
// to a Phosphor duotone illustration that actually matches the app's brand
// colors. Anything not in this map (a custom emoji an admin picks later)
// falls back to rendering the raw emoji — never a broken icon.
const EMOJI_ICON_MAP: Record<string, PhosphorIcon> = {
  "☕": Coffee,
  "🥐": Cookie,
  "🍰": Cake,
  "🏆": Trophy,
  "👑": Crown,
  "💰": Tag,
  "🎁": Gift,
  "🎂": Cake,
  "🎉": Sparkle,
  "💌": Heart,
  "🤝": Handshake,
  "🎯": Target,
  "🏅": Medal,
};

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
