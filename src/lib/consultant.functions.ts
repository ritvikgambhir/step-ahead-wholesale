import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(30),
});

export const askConsultant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<{ answer: string }> => {
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
      .select("sku,name,category,gender,material,color,size_range,moq,price_12,price_60,price_240,stock,description")
      .eq("active", true);
    if (error) throw new Error("Could not load the catalog");

    const catalog = (products ?? [])
      .map(
        (p) =>
          `${p.sku} | ${p.name} | ${p.category} | ${p.gender} | ${p.material} | ${p.color} | sizes ${p.size_range} | MOQ ${p.moq} | $${p.price_12} at 12+, $${p.price_60} at 60+, $${p.price_240} at 240+ | ${p.stock} in stock | ${p.description}`,
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
              "You are the Halstead Footwear Supply consultant — a friendly wholesale footwear expert chatting with trade buyers.",
              "Only reference styles from the catalog below; never invent SKUs, prices or stock figures.",
              "Keep replies under 130 words of plain markdown. Ask a clarifying question when the buyer's need is vague.",
              "Quote unit prices at the relevant quantity break, flag minimum order quantities, and warn when stock is tight.",
              "For payment, delivery or account questions, point them to the dealer portal or the contact page.",
              "",
              "CATALOG:",
              catalog,
            ].join("\n"),
          },
          ...data.messages,
        ],
      }),
    });

    if (res.status === 429) throw new Error("The consultant is busy right now — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Please top up to keep chatting.");
    if (!res.ok) throw new Error("The consultant could not answer that.");

    const json = (await res.json()) as {
      output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
    };
    const answer =
      json.output
        ?.filter((o) => o.type === "message")
        .flatMap((o) => o.content ?? [])
        .filter((c) => c.type === "output_text")
        .map((c) => c.text ?? "")
        .join("\n")
        .trim() ?? "";

    return { answer: answer || "I could not put an answer together — could you rephrase that?" };
  });