import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TIERS, money, unitPriceFor, type Product } from "@/lib/catalog";

function tierLabel(qty: number) {
  if (qty >= 240) return "240+ pairs";
  if (qty >= 60) return "60 – 239 pairs";
  return "12 – 59 pairs";
}

function BulkCalculator({ product }: { product: Product }) {
  const [qty, setQty] = useState<number>(product.moq);
  const safeQty = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
  const unit = unitPriceFor(product, safeQty);
  const total = unit * safeQty;
  const savings = (Number(product.price_12) - unit) * safeQty;
  const nextBreak = safeQty < 60 ? 60 : safeQty < 240 ? 240 : null;

  return (
    <div className="rounded border border-border bg-card p-3">
      <p className="label-caps text-muted-foreground">Bulk tier calculator</p>
      <div className="mt-2 flex items-center gap-2">
        <Input
          type="number"
          min={0}
          step={12}
          value={safeQty || ""}
          placeholder="0"
          aria-label={`Pairs of ${product.name}`}
          className="h-9 w-24"
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <span className="text-sm text-muted-foreground">pairs</span>
        <Badge variant="outline" className="ml-auto">{tierLabel(safeQty)}</Badge>
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Unit price</dt>
          <dd className="font-semibold">{money(unit)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Order total</dt>
          <dd className="font-semibold">{money(total)}</dd>
        </div>
        {savings > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Saved vs 12+ price</dt>
            <dd className="font-semibold text-primary">{money(savings)}</dd>
          </div>
        )}
      </dl>
      {safeQty > 0 && safeQty < product.moq && (
        <p className="mt-2 text-xs text-destructive">Below the {product.moq}-pair minimum order quantity.</p>
      )}
      {nextBreak && safeQty >= product.moq && (
        <p className="mt-2 text-xs text-muted-foreground">
          Add {nextBreak - safeQty} more pairs to reach the {nextBreak}+ break.
        </p>
      )}
    </div>
  );
}

export function ProductCard({ product, highlight }: { product: Product; highlight?: boolean }) {
  const low = product.stock < 500;
  return (
    <article
      className={`surface-panel flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5 ${
        highlight ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border bg-accent/40 px-5 py-4">
        <div>
          <p className="label-caps text-muted-foreground">{product.sku}</p>
          <h3 className="mt-1 text-2xl">{product.name}</h3>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {product.category}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        <p className="text-sm text-muted-foreground">{product.description}</p>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="label-caps text-muted-foreground">Material</dt>
            <dd>{product.material}</dd>
          </div>
          <div>
            <dt className="label-caps text-muted-foreground">Colour</dt>
            <dd>{product.color}</dd>
          </div>
          <div>
            <dt className="label-caps text-muted-foreground">Sizes</dt>
            <dd>{product.size_range}</dd>
          </div>
          <div>
            <dt className="label-caps text-muted-foreground">Case MOQ</dt>
            <dd>{product.moq} pairs</dd>
          </div>
        </dl>

        <div className="mt-auto rounded border border-border bg-muted/50 p-3">
          <p className="label-caps text-muted-foreground">Bulk price per pair</p>
          <ul className="mt-2 space-y-1 text-sm">
            {TIERS.map((tier) => (
              <li key={tier.key} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{tier.label}</span>
                <span className="font-semibold">{money(Number(product[tier.key]))}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className={`text-sm font-semibold ${low ? "text-destructive" : "text-primary"}`}>
          {product.stock.toLocaleString()} pairs available{low ? " — limited" : ""}
        </p>

        <BulkCalculator product={product} />
      </div>
    </article>
  );
}