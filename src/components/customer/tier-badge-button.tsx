import Link from "next/link";

export function TierBadgeButton({
  icon,
  name,
  color,
}: {
  icon: string | null;
  name: string;
  color: string | null;
}) {
  const tint = color ?? "#1C4328";

  return (
    <Link
      href="/perfil/nivel"
      aria-label={`Ver mi camino de niveles — nivel actual: ${name}`}
      className="flex size-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border-2 text-2xl transition-transform active:scale-95"
      style={{ borderColor: tint, backgroundColor: `${tint}1a` }}
    >
      <span>{icon ?? "🏅"}</span>
    </Link>
  );
}
