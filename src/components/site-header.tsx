import { Link, useNavigate } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/catalog", label: "Catalog" },
  { to: "/finder", label: "AI Finder" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links = (
    <>
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setOpen(false)}
          className="label-caps text-ink-muted transition-colors hover:text-primary"
          activeProps={{ className: "label-caps text-primary" }}
          activeOptions={{ exact: item.to === "/" }}
        >
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-ink-muted/20 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-3xl text-ink-foreground">Halstead</span>
          <span className="label-caps hidden text-primary sm:inline">Footwear Supply</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-7 lg:flex">{links}</nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm" className="hidden text-ink-muted hover:text-ink-foreground sm:inline-flex">
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
              <Button asChild size="sm">
                <Link to="/dealer">Dealer Portal</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-ink-muted hover:text-ink-foreground">
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Dealer Login</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-ink-foreground lg:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-ink">
              <nav className="mt-12 flex flex-col gap-6 px-4">{links}</nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}