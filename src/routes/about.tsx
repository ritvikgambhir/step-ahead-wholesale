import { createFileRoute } from "@tanstack/react-router";

import flatlay from "@/assets/range-flatlay.jpg";
import { PageHeading, SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Halstead Footwear Supply — Wholesale Distributor" },
      {
        name: "description",
        content:
          "Halstead Footwear Supply has distributed wholesale footwear since 1994 from its Leicester distribution centre, serving retailers, workwear suppliers and institutional buyers.",
      },
      { property: "og:title", content: "About Halstead Footwear Supply" },
      {
        property: "og:description",
        content: "A trade-only footwear distributor with 31 years of case-pack programmes and own-factory production.",
      },
    ],
  }),
  component: AboutPage,
});

const TIMELINE = [
  { year: "1994", body: "Founded as a two-van boot wholesaler supplying Midlands workwear shops." },
  { year: "2003", body: "First own-factory programme in Portugal; private-label runs from 600 pairs." },
  { year: "2014", body: "Leicester distribution centre opens — 9,000 pallet positions under one roof." },
  { year: "2026", body: "Dealer portal and AI product finder put the whole range in buyers' hands." },
];

function AboutPage() {
  return (
    <SiteShell>
      <PageHeading
        eyebrow="About us"
        title="A distributor, not a marketplace"
        intro="We buy in full containers, hold full size runs, and sell only to trade. That is the whole business model — and it is why our break prices hold."
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="space-y-5 text-muted-foreground">
            <p>
              Halstead Footwear Supply operates a single 140,000 sq ft distribution centre in
              Leicester holding roughly 480,000 pairs across six ranges. Every style in our catalog
              is physically in the building — we do not list forward orders as available stock.
            </p>
            <p>
              Our buyers work directly with tanneries and last-makers in Portugal, Vietnam and
              India. That gives us three things wholesalers care about: consistent lasts across
              seasons, honest material declarations, and repeatable pricing on repeat orders.
            </p>
            <p>
              Accounts are trade-only. Minimum order is 12 pairs per style, and every account gets
              the same published break pricing regardless of size — the tier you hit is the price
              you pay.
            </p>

            <ol className="mt-10 space-y-6 border-l border-border pl-6">
              {TIMELINE.map((t) => (
                <li key={t.year} className="relative">
                  <span className="absolute -left-[27px] top-2 size-2.5 rounded-full bg-primary" />
                  <p className="font-display text-3xl text-foreground">{t.year}</p>
                  <p className="mt-1 text-sm">{t.body}</p>
                </li>
              ))}
            </ol>
          </div>

          <img
            src={flatlay}
            alt="Range of wholesale footwear laid out: boots, sneakers, oxfords, kids boots and slides"
            width={1600}
            height={1008}
            loading="lazy"
            className="rounded-lg object-cover"
            style={{ boxShadow: "var(--shadow-panel)" }}
          />
        </div>
      </div>
    </SiteShell>
  );
}