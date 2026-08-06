import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-muted/20 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-4xl">Halstead Footwear Supply</p>
          <p className="mt-3 max-w-sm text-sm text-ink-muted">
            Wholesale footwear distribution since 1994. Case-pack programs, private-label runs
            and next-day dispatch for retailers, workwear suppliers and institutional buyers.
          </p>
        </div>
        <div>
          <p className="label-caps text-primary">Company</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            <li><Link to="/catalog" className="hover:text-ink-foreground">Catalog</Link></li>
            <li><Link to="/finder" className="hover:text-ink-foreground">AI Product Finder</Link></li>
            <li><Link to="/about" className="hover:text-ink-foreground">About us</Link></li>
            <li><Link to="/contact" className="hover:text-ink-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="label-caps text-primary">Trade desk</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            <li>Unit 14, Halstead Industrial Park</li>
            <li>Leicester, LE4 9GH</li>
            <li>trade@halsteadfootwear.example</li>
            <li>+44 116 496 0142</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-muted/15 px-4 py-5 text-center text-xs text-ink-muted sm:px-6">
        © {new Date().getFullYear()} Halstead Footwear Supply Ltd. Trade only — minimum order 12 pairs per style.
      </div>
    </footer>
  );
}