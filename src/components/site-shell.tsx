import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="border-b border-border bg-ink py-14 text-ink-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="label-caps text-primary">{eyebrow}</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-sm text-ink-muted sm:text-base">{intro}</p>}
      </div>
    </div>
  );
}