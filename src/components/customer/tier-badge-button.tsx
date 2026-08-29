import Link from "next/link";

const SIZE_CLASSES = {
  default: "size-14 text-2xl",
  sm: "size-9 text-base",
};

export function TierBadgeButton({
  icon,
  name,
  color,
  size = "default",
}: {
  icon: string | null;
  name: string;
  color: string | null;
  size?: keyof typeof SIZE_CLASSES;
}) {
  const tint = color ?? "#1C4328";

  return (
    <Link
      href="/perfil/nivel"
      aria-label={`Ver mi camino de niveles — nivel actual: ${name}`}
      className={`flex shrink-0 items-center justify-center rounded-full border-2 transition-transform active:scale-95 ${SIZE_CLASSES[size]}`}
      style={{ borderColor: tint, backgroundColor: `${tint}1a` }}
    >
      <span>{icon ?? "🏅"}</span>
    </Link>
  );
}
