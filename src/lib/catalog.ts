export const CATEGORIES = [
  "Safety Boots",
  "Athletic",
  "Formal",
  "Casual",
  "Kids",
  "Outdoor",
] as const;

export const GENDERS = ["men", "women", "unisex", "kids"] as const;

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  image_url: string | null;
  material: string;
  color: string;
  size_range: string;
  gender: string;
  moq: number;
  price_12: number;
  price_60: number;
  price_240: number;
  stock: number;
  active: boolean;
};

export function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

/** Bulk pricing: unit price drops as case quantity rises. */
export function unitPriceFor(product: Pick<Product, "price_12" | "price_60" | "price_240">, qty: number) {
  if (qty >= 240) return Number(product.price_240);
  if (qty >= 60) return Number(product.price_60);
  return Number(product.price_12);
}

export const TIERS = [
  { label: "12 – 59 pairs", key: "price_12" as const },
  { label: "60 – 239 pairs", key: "price_60" as const },
  { label: "240+ pairs", key: "price_240" as const },
];