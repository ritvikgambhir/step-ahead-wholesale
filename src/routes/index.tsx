import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Factory, Sparkles, Truck } from "lucide-react";

import hero from "@/assets/hero-warehouse.jpg";
import flatlay from "@/assets/range-flatlay.jpg";
import { ProductCard } from "@/components/product-card";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, type Product } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Halstead Footwear Supply — Wholesale Footwear Distribution" },
      {
        name: "description",
        content:
          "Trade-only footwear distributor: safety boots, athletic, formal, casual and kids ranges in case packs with tiered bulk pricing and a dealer ordering portal.",
      },
      { property: "og:title", content: "Halstead Footwear Supply — Wholesale Footwear Distribution" },
      {
        property: "og:description",
        content: "Case-pack footwear programmes, tiered bulk pricing and next-day dispatch for trade buyers.",
      },
    ],
  }),
  component: Index,
});

const STATS = [
  { value: "31", label: "Years in distribution" },
  { value: "480k", label: "Pairs shipped a year" },
  { value: "1,900", label: "Active trade accounts" },
  { value: "48h", label: "Typical dispatch window" },
];

function Index() {
  const { data } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("stock", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data as Product[];
    },
  });

  return (
    <SiteShell>
      <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        <img
          src={hero}
          alt="Wholesale footwear warehouse with racked shoe boxes and pallets of leather boots"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:py-36">
          <p className="label-caps text-primary">Trade only · Est. 1994</p>
          <h1 className="mt-4 max-w-3xl text-6xl sm:text-7xl lg:text-8xl">
            Footwear by the pallet, priced by the break.
          </h1>
          <p className="mt-6 max-w-xl text-base text-ink-muted sm:text-lg">
            Six ranges, 40+ live styles, full size runs held in stock. Open a dealer account and
            order case packs at tiered wholesale pricing with dispatch inside 48 hours.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/catalog">Browse the catalog</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-ink-muted/40 bg-transparent text-ink-foreground hover:bg-ink-foreground/10">
              <Link to="/finder">
                <Sparkles className="mr-2 size-4" /> Ask the AI finder
              </Link>
            </Button>
          </div>

          <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-8 border-t border-ink-muted/25 pt-8 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="font-display text-4xl text-primary">{s.value}</dt>
                <dd className="mt-1 text-xs text-ink-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="label-caps text-primary">The range</p>
            <h2 className="mt-3 text-5xl">Six categories, one delivery note.</h2>
            <p className="mt-4 text-muted-foreground">
              Consolidate your footwear buy across workwear, athletic, formal, casual, kids and
              outdoor into a single account, a single invoice and a single pallet.
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link
                    to="/catalog"
                    search={{ category: c }}
                    className="surface-panel flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                  >
                    {c}
                    <Boxes className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <img
            src={flatlay}
            alt="Overhead flat-lay of wholesale boots, sneakers, dress shoes, kids boots and slides"
            width={1600}
            height={1008}
            loading="lazy"
            className="rounded-lg object-cover"
            style={{ boxShadow: "var(--shadow-panel)" }}
          />
        </div>
      </section>

      <section className="bg-accent/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-caps text-primary">Deep stock</p>
              <h2 className="mt-3 text-5xl">Highest availability this week</h2>
            </div>
            <Button asChild variant="outline">
              <Link to="/catalog">See all styles</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {(data ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-20 sm:px-6 md:grid-cols-3">
        {[
          { icon: Factory, title: "Own-factory programmes", body: "Private-label runs from 600 pairs with your last, your box and your branding." },
          { icon: Truck, title: "48-hour dispatch", body: "Everything in the catalog is held in our Leicester DC — no drop-ship lead times." },
          { icon: Boxes, title: "Honest break pricing", body: "Three published tiers. No hidden rebate games, no negotiated surprises." },
        ].map((f) => (
          <div key={f.title} className="surface-panel p-6">
            <f.icon className="size-6 text-primary" />
            <h3 className="mt-4 text-2xl">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </SiteShell>
  );
}
