import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth-actions";
import { cn } from "@/lib/utils";

export function LogoutMenuRow({ variant = "light" }: { variant?: "light" | "dark" }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
          variant === "dark"
            ? "text-cc-cream-200 hover:bg-cc-cream-50/10 hover:text-cc-cream-50"
            : "px-4 py-3.5 text-destructive hover:bg-destructive/5"
        )}
      >
        <LogOut className="size-4" />
        <span className="flex-1">Cerrar sesión</span>
      </button>
    </form>
  );
}
