import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeading, SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { money, unitPriceFor, type Product } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/dealer")({
  head: () => ({
    meta: [
      { title: "Dealer Portal — Halstead Footwear Supply" },
      {
        name: "description",
        content: "Place bulk footwear orders on published break pricing and track the status of every dealer order.",
      },
      { property: "og:title", content: "Dealer Portal — Halstead Footwear Supply" },
      { property: "og:description", content: "Bulk ordering and order tracking for Halstead trade accounts." },
    ],
  }),
  component: DealerPortal,
});

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-primary text-primary-foreground",
  shipped: "bg-secondary text-secondary-foreground",
  delivered: "bg-accent text-accent-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

function DealerPortal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("active", true).order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,total,notes,created_at,order_items(id,quantity,unit_price,products(name,sku))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const lines = Object.entries(cart)
    .map(([id, qty]) => {
      const product = (products ?? []).find((p) => p.id === id);
      if (!product) return null;
      const unit = unitPriceFor(product, qty);
      return { product, qty, unit, subtotal: unit * qty };
    })
    .filter((l): l is { product: Product; qty: number; unit: number; subtotal: number } => Boolean(l));

  const total = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const belowMoq = lines.filter((l) => l.qty < l.product.moq);
  const overStock = lines.filter((l) => l.qty > l.product.stock);

  const placeOrder = useMutation({
    mutationFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({ dealer_id: user!.id, total, notes })
        .select("id")
        .single();
      if (error) throw error;
      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.product.id,
          quantity: l.qty,
          unit_price: l.unit,
        })),
      );
      if (itemsError) throw itemsError;
      return order.id;
    },
    onSuccess: () => {
      setCart({});
      setNotes("");
      toast.success("Order submitted — the trade desk will confirm shortly.");
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not submit the order."),
  });

  const setQty = (id: string, qty: number) =>
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  return (
    <SiteShell>
      <PageHeading
        eyebrow="Dealer portal"
        title={profile?.company_name || "Your trade account"}
        intro="Build a case-pack order below. Unit price drops automatically as each line crosses 60 and 240 pairs."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Tabs defaultValue="order">
          <TabsList>
            <TabsTrigger value="order">Place a bulk order</TabsTrigger>
            <TabsTrigger value="orders">My orders ({orders?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="order" className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <div className="surface-panel overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Style</TableHead>
                    <TableHead>MOQ</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="w-44">Pairs</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(products ?? []).map((p) => {
                    const qty = cart[p.id] ?? 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.sku} · {p.category} · sizes {p.size_range}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.moq}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.stock.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8"
                              onClick={() => setQty(p.id, Math.max(0, qty - p.moq))}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <Input
                              type="number"
                              min={0}
                              value={qty || ""}
                              placeholder="0"
                              className="h-8 w-20 text-center"
                              onChange={(e) => setQty(p.id, Number(e.target.value))}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8"
                              onClick={() => setQty(p.id, qty + p.moq)}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {money(unitPriceFor(p, Math.max(qty, p.moq)))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="surface-panel sticky top-20 p-6">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" />
                <h2 className="text-2xl">Order summary</h2>
              </div>

              {lines.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  No lines yet. Add pairs against any style — or use the{" "}
                  <Link to="/finder" className="text-primary underline">AI finder</Link> for ideas.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {lines.map((l) => (
                    <li key={l.product.id} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold">{l.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.qty} pairs × {money(l.unit)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{money(l.subtotal)}</span>
                        <button type="button" onClick={() => setQty(l.product.id, 0)} aria-label="Remove line">
                          <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5 border-t border-border pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total ex-VAT</span>
                  <span>{money(total)}</span>
                </div>
              </div>

              {belowMoq.length > 0 && (
                <p className="mt-3 text-xs text-destructive">
                  Below minimum order quantity: {belowMoq.map((l) => l.product.sku).join(", ")}
                </p>
              )}
              {overStock.length > 0 && (
                <p className="mt-2 text-xs text-destructive">
                  Exceeds available stock: {overStock.map((l) => l.product.sku).join(", ")}
                </p>
              )}

              <Textarea
                className="mt-4"
                rows={3}
                placeholder="Delivery notes, PO reference, size-run split…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <Button
                className="mt-4 w-full"
                size="lg"
                disabled={
                  lines.length === 0 ||
                  belowMoq.length > 0 ||
                  overStock.length > 0 ||
                  placeOrder.isPending
                }
                onClick={() => placeOrder.mutate()}
              >
                {placeOrder.isPending ? "Submitting…" : "Submit bulk order"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-8">
            {(orders ?? []).length === 0 ? (
              <p className="surface-panel p-10 text-center text-muted-foreground">
                No orders yet. Your submitted orders and their status will appear here.
              </p>
            ) : (
              <div className="space-y-4">
                {(orders ?? []).map((o) => (
                  <div key={o.id} className="surface-panel p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="label-caps text-muted-foreground">
                          Order {o.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString()} ·{" "}
                          {(o.order_items ?? []).reduce((s, i) => s + i.quantity, 0)} pairs
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-display text-3xl">{money(Number(o.total))}</span>
                        <Badge className={STATUS_STYLES[o.status] ?? ""}>{o.status}</Badge>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
                      {(o.order_items ?? []).map((i) => (
                        <li key={i.id} className="flex justify-between gap-4">
                          <span>
                            {i.products?.sku} — {i.products?.name}
                          </span>
                          <span>
                            {i.quantity} × {money(Number(i.unit_price))}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {o.notes && <p className="mt-3 text-xs text-muted-foreground">Notes: {o.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SiteShell>
  );
}