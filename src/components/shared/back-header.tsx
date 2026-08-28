import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackHeader({ title, href = "/perfil" }: { title: string; href?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={href}
        className="flex size-8 items-center justify-center rounded-full text-cc-cream-50/70 hover:bg-cc-cream-50/10 hover:text-cc-cream-50"
      >
        <ChevronLeft className="size-5" />
      </Link>
      <h1 className="font-heading text-xl font-semibold text-cc-cream-50">{title}</h1>
    </div>
  );
}
