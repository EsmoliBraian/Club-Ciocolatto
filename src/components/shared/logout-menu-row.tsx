import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth-actions";

export function LogoutMenuRow() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-destructive hover:bg-destructive/5"
      >
        <LogOut className="size-4" />
        <span className="flex-1">Cerrar sesión</span>
      </button>
    </form>
  );
}
