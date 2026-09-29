import type { Metadata } from "next";
import { BackHeader } from "@/components/shared/back-header";
import { ThemeChoiceCards } from "@/components/shared/theme-choice-cards";

export const metadata: Metadata = { title: "Apariencia" };

export default function AppearancePage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <BackHeader title="Apariencia" />
      <p className="text-sm text-muted-foreground">Elegí cómo querés ver la app.</p>
      <ThemeChoiceCards />
    </div>
  );
}
