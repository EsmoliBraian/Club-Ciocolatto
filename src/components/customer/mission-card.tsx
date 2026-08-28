import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const ICON_STYLES = [
  "bg-orange-100 text-orange-600",
  "bg-emerald-100 text-emerald-600",
  "bg-sky-100 text-sky-600",
  "bg-rose-100 text-rose-600",
];

export function MissionCard({
  icon,
  title,
  description,
  current,
  target,
  rewardPoints,
  completed,
  colorIndex = 0,
  compact = false,
}: {
  icon: string | null;
  title: string;
  description?: string;
  current: number;
  target: number;
  rewardPoints: number;
  completed: boolean;
  colorIndex?: number;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full text-lg",
          ICON_STYLES[colorIndex % ICON_STYLES.length]
        )}
      >
        {icon ?? "🎯"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-cc-green-900">{title}</p>
          {completed && (
            <Badge className="bg-cc-gold-400 text-cc-green-900">Completa</Badge>
          )}
        </div>
        {!compact && description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        <div className="mt-1.5 flex items-center gap-2">
          <Progress value={(current / target) * 100} className="h-1.5 flex-1" />
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {current}/{target}
          </span>
        </div>
      </div>
      <span className="shrink-0 text-sm font-semibold text-cc-green-700">+{rewardPoints}</span>
    </div>
  );
}
