export function RankedBarList({
  items,
  color = "var(--cc-green-700)",
}: {
  items: { name: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sin datos todavía.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.name} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-foreground" title={item.name}>
            {item.name}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums text-muted-foreground">
            {item.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
