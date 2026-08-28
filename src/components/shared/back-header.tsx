import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackHeader({ title, href = "/perfil" }: { title: string; href?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={href}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <ChevronLeft className="size-5" />
      </Link>
      <h1 className="font-heading text-xl font-semibold text-foreground">{title}</h1>
    </div>
  );
}
