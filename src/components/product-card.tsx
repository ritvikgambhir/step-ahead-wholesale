import { Badge } from "@/components/ui/badge";
import { TIERS, money, type Product } from "@/lib/catalog";

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
      </div>
    </article>
  );
}