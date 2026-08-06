import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Dealer Login — Halstead Footwear Supply" },
      {
        name: "description",
        content:
          "Sign in to the Halstead dealer portal to place bulk footwear orders and track order status, or apply for a new wholesale trade account.",
      },
      { property: "og:title", content: "Dealer Login — Halstead Footwear Supply" },
      { property: "og:description", content: "Wholesale dealer portal sign-in and trade account registration." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dealer", replace: true });
  }, [user, loading, navigate]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dealer" });
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          company_name: String(form.get("company_name") ?? ""),
          contact_name: String(form.get("contact_name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          city: String(form.get("city") ?? ""),
        },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      toast.success("Account created — check your email to confirm before signing in.");
      return;
    }
    navigate({ to: "/dealer" });
  }

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      return toast.error("Google sign-in failed. Please try again.");
    }
    if (result.redirected) return;
    navigate({ to: "/dealer" });
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <p className="label-caps text-primary">Dealer access</p>
        <h1 className="mt-3 text-5xl">Wholesale accounts only</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to place case-pack orders and follow their status. New trade accounts are
          reviewed by our credit team before the first dispatch.
        </p>

        <div className="surface-panel mt-8 p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Apply for an account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form className="mt-6 space-y-4" onSubmit={signIn}>
                <Field label="Work email" name="email" type="email" />
                <Field label="Password" name="password" type="password" />
                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="mt-6 space-y-4" onSubmit={signUp}>
                <Field label="Company" name="company_name" />
                <Field label="Contact name" name="contact_name" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone" name="phone" required={false} />
                  <Field label="City" name="city" required={false} />
                </div>
                <Field label="Work email" name="email" type="email" />
                <Field label="Password" name="password" type="password" />
                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  Create dealer account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" size="lg" onClick={google} disabled={busy}>
            Continue with Google
          </Button>
        </div>
      </div>
    </SiteShell>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label-caps text-muted-foreground" htmlFor={name}>
        {label}
      </label>
      <Input id={name} name={name} type={type} required={required} className="mt-2" autoComplete="on" />
    </div>
  );
}