import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ProductCard } from "@/components/product-card";
import { PageHeading, SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/catalog";
import { askProductFinder, type FinderResult } from "@/lib/finder.functions";

export const Route = createFileRoute("/finder")({
  head: () => ({
    meta: [
      { title: "AI Product Finder — Halstead Footwear Supply" },
      {
        name: "description",
        content:
          "Describe what your customers need in plain English and get matched wholesale footwear styles, bulk prices and stock positions from our live catalog.",
      },
      { property: "og:title", content: "AI Product Finder — Halstead Footwear Supply" },
      {
        property: "og:description",
        content: "Natural-language shoe recommendations drawn from our live wholesale catalog.",
      },
    ],
  }),
  component: FinderPage,
});

const EXAMPLES = [
  "I run three hardware stores and need durable work boots under $40 a pair for 300 pairs.",
  "Looking for cheap summer footwear for a seaside gift shop, high turnover, small budget.",
  "Need smart school shoes for kids plus something for parents in the same order.",
  "What can I stock for a gym-wear boutique that stays under $20 landed?",
];

function FinderPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<FinderResult | null>(null);
  const ask = useServerFn(askProductFinder);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("active", true);
      if (error) throw error;
      return data as Product[];
    },
  });

  const mutation = useMutation({
    mutationFn: (q: string) => ask({ data: { question: q } }),
    onSuccess: (data) => setResult(data),
    onError: (error: Error) => toast.error(error.message || "The finder could not answer that."),
  });

  const matched = (result?.skus ?? [])
    .map((sku) => (products ?? []).find((p) => p.sku === sku))
    .filter((p): p is Product => Boolean(p));

  return (
    <SiteShell>
      <PageHeading
        eyebrow="AI product finder"
        title="Tell us the buyer, not the SKU"
        intro="Describe the store, the customer or the budget in your own words. The finder reads our live catalog and comes back with the styles that actually fit."
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <form
          className="surface-panel p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (question.trim().length < 3) return;
            mutation.mutate(question.trim());
          }}
        >
          <label className="label-caps text-muted-foreground" htmlFor="question">
            What are you looking for?
          </label>
          <Textarea
            id="question"
            rows={4}
            className="mt-3"
            maxLength={500}
            placeholder="e.g. I need 200 pairs of waterproof boots for a farm supply store, under $50 a pair."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Recommendations come only from styles currently in stock.
            </p>
            <Button type="submit" disabled={mutation.isPending || question.trim().length < 3}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Searching the range
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" /> Find my styles
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setQuestion(ex)}
              className="rounded border border-border bg-card px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {ex}
            </button>
          ))}
        </div>

        {result && (
          <section className="mt-12">
            <p className="label-caps text-primary">Recommendation</p>
            <div className="surface-panel mt-3 whitespace-pre-wrap p-6 text-sm leading-relaxed">
              {result.answer.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
                chunk.startsWith("**") && chunk.endsWith("**") ? (
                  <strong key={i} className="font-semibold">
                    {chunk.slice(2, -2)}
                  </strong>
                ) : (
                  chunk
                ),
              )}
            </div>

            {matched.length > 0 && (
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {matched.map((p) => (
                  <ProductCard key={p.id} product={p} highlight />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </SiteShell>
  );
}