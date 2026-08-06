import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";

import { ProductCard } from "@/components/product-card";
import { PageHeading, SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, GENDERS, type Product } from "@/lib/catalog";

const searchSchema = z.object({
  category: z.string().optional(),
  gender: z.string().optional(),
  q: z.string().optional(),
  max: z.coerce.number().optional(),
});

export const Route = createFileRoute("/catalog")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Wholesale Footwear Catalog — Halstead Footwear Supply" },
      {
        name: "description",
        content:
          "Browse the wholesale footwear catalog by category, gender and price: safety boots, athletic, formal, casual, kids and outdoor styles with case-pack bulk pricing.",
      },
      { property: "og:title", content: "Wholesale Footwear Catalog — Halstead Footwear Supply" },
      {
        property: "og:description",
        content: "Filter 40+ trade footwear styles by category, gender and unit price break.",
      },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/catalog" });

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("category")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const setSearch = (patch: Record<string, string | number | undefined>) =>
    navigate({ search: { ...search, ...patch }, replace: true });

  const filtered = useMemo(() => {
    const q = (search.q ?? "").toLowerCase().trim();
    return (data ?? []).filter((p) => {
      if (search.category && p.category !== search.category) return false;
      if (search.gender && p.gender !== search.gender) return false;
      if (search.max && Number(p.price_12) > search.max) return false;
      if (q && !`${p.name} ${p.sku} ${p.material} ${p.color} ${p.description}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [data, search]);

  const hasFilters = Boolean(search.category || search.gender || search.q || search.max);

  return (
    <SiteShell>
      <PageHeading
        eyebrow="Trade catalog"
        title="Every style, every break price"
        intro="Prices shown are per pair, ex-VAT, on our published case-pack breaks. Dealer accounts see the same numbers in the ordering portal."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="surface-panel mb-10 grid gap-5 p-5 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label className="label-caps text-muted-foreground" htmlFor="q">Search</label>
            <Input
              id="q"
              className="mt-2"
              placeholder="Style, SKU, material…"
              value={search.q ?? ""}
              onChange={(e) => setSearch({ q: e.target.value || undefined })}
            />
          </div>

          <div>
            <p className="label-caps text-muted-foreground">Category</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSearch({ category: search.category === c ? undefined : c })}
                  className={`rounded border px-2.5 py-1 text-xs font-semibold transition-colors ${
                    search.category === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label-caps text-muted-foreground">Fit</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSearch({ gender: search.gender === g ? undefined : g })}
                  className={`rounded border px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
                    search.gender === g
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div>
              <label className="label-caps text-muted-foreground" htmlFor="max">Max $/pair</label>
              <Input
                id="max"
                type="number"
                min={1}
                className="mt-2 w-28"
                value={search.max ?? ""}
                onChange={(e) => setSearch({ max: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                onClick={() => navigate({ search: {}, replace: true })}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <p className="label-caps mb-6 text-muted-foreground">
          {isLoading ? "Loading styles…" : `${filtered.length} styles`}
        </p>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="surface-panel p-10 text-center text-muted-foreground">
            No styles match those filters. Try widening the price ceiling.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}