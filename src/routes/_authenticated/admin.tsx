import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Package, PoundSterling, ShoppingBag, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { PageHeading, SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, GENDERS, money, type Product } from "@/lib/catalog";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Inventory & Sales Dashboard — Halstead Footwear Supply" },
      {
        name: "description",
        content: "Administrative dashboard for footwear inventory management, stock updates, order status and sales analytics.",
      },
      { property: "og:title", content: "Inventory & Sales Dashboard — Halstead Footwear Supply" },
      { property: "og:description", content: "Manage stock, prices and dealer orders, and review sales analytics." },
    ],
  }),
  component: AdminDashboard,
});

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

const LOW_STOCK = 500;
const CRITICAL_STOCK = 150;

function StockBadge({ stock }: { stock: number }) {
  if (stock <= CRITICAL_STOCK) return <Badge variant="destructive">Critical</Badge>;
  if (stock < LOW_STOCK) return <Badge variant="secondary">Low</Badge>;
  return <Badge variant="outline">Healthy</Badge>;
}

function AdminDashboard() {
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("category").order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,total,created_at,dealer_id,order_items(quantity,unit_price,products(name,category))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: status as (typeof STATUSES)[number] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStock = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Product> }) => {
      const { error } = await supabase.from("products").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <SiteShell>
        <PageHeading eyebrow="Restricted" title="Administrator access only" intro="This dashboard is limited to Halstead staff accounts." />
      </SiteShell>
    );
  }

  const live = orders ?? [];
  const revenue = live.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const pairs = live.flatMap((o) => o.order_items ?? []).reduce((s, i) => s + i.quantity, 0);
  const stockValue = (products ?? []).reduce((s, p) => s + p.stock * Number(p.price_240), 0);
  const lowStock = (products ?? [])
    .filter((p) => p.stock < LOW_STOCK)
    .sort((a, b) => a.stock - b.stock);

  const byCategory = CATEGORIES.map((c) => ({
    category: c,
    revenue: Number(
      live
        .flatMap((o) => o.order_items ?? [])
        .filter((i) => i.products?.category === c)
        .reduce((s, i) => s + i.quantity * Number(i.unit_price), 0)
        .toFixed(2),
    ),
  }));

  return (
    <SiteShell>
      <PageHeading
        eyebrow="Administration"
        title="Inventory & sales control"
        intro="Adjust stock and pricing, add new styles, move dealer orders through fulfilment and watch where the revenue is coming from."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: PoundSterling, label: "Order revenue", value: money(revenue) },
            { icon: ShoppingBag, label: "Orders", value: String(live.length) },
            { icon: TrendingUp, label: "Pairs ordered", value: pairs.toLocaleString() },
            { icon: Package, label: "Stock at cost", value: money(stockValue) },
            { icon: AlertTriangle, label: "Low-stock styles", value: String(lowStock.length) },
          ].map((m) => (
            <div key={m.label} className="surface-panel p-5">
              <m.icon className="size-5 text-primary" />
              <p className="label-caps mt-3 text-muted-foreground">{m.label}</p>
              <p className="font-display text-4xl">{m.value}</p>
            </div>
          ))}
        </div>

        {lowStock.length > 0 && (
          <div className="surface-panel mt-6 border-destructive/40 p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              <h2 className="text-2xl">Low stock alerts</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Styles under {LOW_STOCK.toLocaleString()} pairs. Anything at or below {CRITICAL_STOCK} pairs is critical.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded border border-border bg-card p-3">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.sku} · {p.stock.toLocaleString()} pairs · MOQ {p.moq}
                    </p>
                  </div>
                  <StockBadge stock={p.stock} />
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="surface-panel mt-6 p-6">
          <h2 className="text-2xl">Revenue by category</h2>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <ChartTooltip
                  formatter={(v: number) => money(v)}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
                />
                <Bar dataKey="revenue" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Tabs defaultValue="inventory" className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>
            <NewProductDialog />
          </div>

          <TabsContent value="inventory" className="mt-6">
            <div className="surface-panel overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Style</TableHead>
                    <TableHead className="w-28">Stock</TableHead>
                    <TableHead className="w-28">Level</TableHead>
                    <TableHead className="w-28">12+</TableHead>
                    <TableHead className="w-28">60+</TableHead>
                    <TableHead className="w-28">240+</TableHead>
                    <TableHead className="w-28">Listed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(products ?? []).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.sku} · {p.category}</p>
                      </TableCell>
                      <NumberCell product={p} field="stock" onSave={updateStock.mutate} step={12} />
                      <TableCell><StockBadge stock={p.stock} /></TableCell>
                      <NumberCell product={p} field="price_12" onSave={updateStock.mutate} step={0.5} />
                      <NumberCell product={p} field="price_60" onSave={updateStock.mutate} step={0.5} />
                      <NumberCell product={p} field="price_240" onSave={updateStock.mutate} step={0.5} />
                      <TableCell>
                        <Button
                          size="sm"
                          variant={p.active ? "secondary" : "outline"}
                          onClick={() => updateStock.mutate({ id: p.id, patch: { active: !p.active } })}
                        >
                          {p.active ? "Live" : "Hidden"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <div className="surface-panel overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Placed</TableHead>
                    <TableHead>Pairs</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="w-44">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {live.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No dealer orders yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    live.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{(o.order_items ?? []).reduce((s, i) => s + i.quantity, 0)}</TableCell>
                        <TableCell className="font-semibold">{money(Number(o.total))}</TableCell>
                        <TableCell>
                          <Select value={o.status} onValueChange={(status) => setStatus.mutate({ id: o.id, status })}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s} className="capitalize">
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SiteShell>
  );
}

function NumberCell({
  product,
  field,
  step,
  onSave,
}: {
  product: Product;
  field: "stock" | "price_12" | "price_60" | "price_240";
  step: number;
  onSave: (args: { id: string; patch: Partial<Product> }) => void;
}) {
  const [value, setValue] = useState(String(product[field]));
  return (
    <TableCell>
      <Input
        type="number"
        step={step}
        className="h-9"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          const next = Number(value);
          if (Number.isFinite(next) && next !== Number(product[field])) {
            onSave({ id: product.id, patch: { [field]: next } as Partial<Product> });
          }
        }}
      />
    </TableCell>
  );
}

function NewProductDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [gender, setGender] = useState<string>("unisex");

  const create = useMutation({
    mutationFn: async (form: FormData) => {
      const { error } = await supabase.from("products").insert({
        name: String(form.get("name")),
        sku: String(form.get("sku")).toUpperCase(),
        category,
        gender,
        description: String(form.get("description") ?? ""),
        material: String(form.get("material") ?? ""),
        color: String(form.get("color") ?? ""),
        size_range: String(form.get("size_range") ?? ""),
        moq: Number(form.get("moq") || 12),
        price_12: Number(form.get("price_12")),
        price_60: Number(form.get("price_60")),
        price_240: Number(form.get("price_240")),
        stock: Number(form.get("stock") || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Style added to the catalog.");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add new style</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl">Add a style</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(new FormData(e.currentTarget));
          }}
        >
          <Field label="Name" name="name" />
          <Field label="SKU" name="sku" />
          <div>
            <p className="label-caps text-muted-foreground">Category</p>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="label-caps text-muted-foreground">Fit</p>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Field label="Material" name="material" required={false} />
          <Field label="Colour" name="color" required={false} />
          <Field label="Size range" name="size_range" required={false} />
          <Field label="MOQ" name="moq" type="number" required={false} />
          <Field label="Price 12+" name="price_12" type="number" />
          <Field label="Price 60+" name="price_60" type="number" />
          <Field label="Price 240+" name="price_240" type="number" />
          <Field label="Stock" name="stock" type="number" required={false} />
          <div className="sm:col-span-2">
            <p className="label-caps text-muted-foreground">Description</p>
            <Textarea name="description" rows={3} className="mt-2" />
          </div>
          <Button type="submit" className="sm:col-span-2" size="lg" disabled={create.isPending}>
            {create.isPending ? "Saving…" : "Add to catalog"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
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
      <label className="label-caps text-muted-foreground" htmlFor={name}>{label}</label>
      <Input id={name} name={name} type={type} step="any" required={required} className="mt-2" />
    </div>
  );
}