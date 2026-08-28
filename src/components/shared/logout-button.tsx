import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" className="w-full">
        <LogOut className="size-4" />
        Cerrar sesión
      </Button>
    </form>
  );
}
