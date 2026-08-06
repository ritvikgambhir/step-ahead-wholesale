import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ question: z.string().min(3).max(500) });

export type FinderResult = {
  answer: string;
  skus: string[];
};

export const askProductFinder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<FinderResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI service is not configured");

    const { createClient } = await import("@supabase/supabase-js");
    const anonKey = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient(process.env["SUPABASE_URL"]!, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (anonKey.startsWith("sb_") && h.get("Authorization") === `Bearer ${anonKey}`) {
            h.delete("Authorization");
          }
          h.set("apikey", anonKey);
          return fetch(input as RequestInfo, { ...init, headers: h });
        },
      },
    });

    const { data: products, error } = await client
      .from("products")
      .select("sku,name,category,gender,material,color,size_range,moq,price_12,price_240,stock,description")
      .eq("active", true);
    if (error) throw new Error("Could not load the catalog");

    const catalog = (products ?? [])
      .map(
        (p) =>
          `${p.sku} | ${p.name} | ${p.category} | ${p.gender} | ${p.material} | ${p.color} | sizes ${p.size_range} | MOQ ${p.moq} | $${p.price_12}/pair at 12+, $${p.price_240}/pair at 240+ | ${p.stock} in stock | ${p.description}`,
      )
      .join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        input: [
          {
            role: "system",
            content: [
              "You are the trade sales advisor for Halstead Footwear Supply, a wholesale footwear distributor.",
              "Recommend ONLY styles from the catalog below. Never invent SKUs.",
              "Answer in under 180 words of plain markdown: a one-line read of the buyer's need, then 2-3 recommendations as bullets in the form **SKU — Name**: why it fits, landed unit price at the relevant break, and stock position.",
              "Mention minimum order quantity when it matters. Be concrete and commercial, not salesy.",
              "Finish with a line starting exactly with 'SKUS:' followed by the recommended SKUs separated by commas.",
              "",
              "CATALOG:",
              catalog,
            ].join("\n"),
          },
          { role: "user", content: data.question },
        ],
      }),
    });

    if (res.status === 429) throw new Error("The finder is busy right now — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Please top up to keep using the finder.");
    if (!res.ok) throw new Error("The finder could not answer that request.");

    const json = (await res.json()) as {
      output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
    };
    const text =
      json.output
        ?.filter((o) => o.type === "message")
        .flatMap((o) => o.content ?? [])
        .filter((c) => c.type === "output_text")
        .map((c) => c.text ?? "")
        .join("\n")
        .trim() ?? "";

    const match = text.match(/SKUS:\s*(.+)$/im);
    const skus = match
      ? match[1]!
          .split(",")
          .map((s) => s.trim().replace(/[*_`.]/g, ""))
          .filter(Boolean)
      : [];

    return { answer: text.replace(/SKUS:.*$/im, "").trim(), skus };
  });