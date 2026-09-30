import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationsButton({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/actividad"
      aria-label={unreadCount > 0 ? `Notificaciones — ${unreadCount} sin leer` : "Notificaciones"}
      className="relative flex size-10 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-secondary"
    >
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex size-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
