import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeading, SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact the Trade Desk — Halstead Footwear Supply" },
      {
        name: "description",
        content:
          "Contact the Halstead Footwear Supply trade desk to open a wholesale account, request a price list or discuss private-label footwear production.",
      },
      { property: "og:title", content: "Contact the Trade Desk — Halstead Footwear Supply" },
      {
        property: "og:description",
        content: "Open a wholesale footwear account or request a private-label quotation.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <SiteShell>
      <PageHeading
        eyebrow="Contact"
        title="Talk to the trade desk"
        intro="Account applications are reviewed within one working day. Tell us your sector and typical order size and we will send the matching price list."
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <form
          className="surface-panel space-y-5 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
            toast.success("Enquiry noted — the trade desk will be in touch within one working day.");
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label-caps text-muted-foreground" htmlFor="company">Company</label>
              <Input id="company" required className="mt-2" placeholder="Registered business name" />
            </div>
            <div>
              <label className="label-caps text-muted-foreground" htmlFor="name">Contact name</label>
              <Input id="name" required className="mt-2" />
            </div>
            <div>
              <label className="label-caps text-muted-foreground" htmlFor="email">Email</label>
              <Input id="email" type="email" required className="mt-2" />
            </div>
            <div>
              <label className="label-caps text-muted-foreground" htmlFor="phone">Phone</label>
              <Input id="phone" className="mt-2" />
            </div>
          </div>
          <div>
            <label className="label-caps text-muted-foreground" htmlFor="message">What do you need?</label>
            <Textarea id="message" rows={5} required className="mt-2" placeholder="Sector, ranges of interest, typical order volume…" />
          </div>
          <Button type="submit" size="lg" disabled={sent}>
            {sent ? "Enquiry received" : "Send enquiry"}
          </Button>
        </form>

        <div className="space-y-6">
          {[
            { icon: MapPin, title: "Distribution centre", lines: ["Unit 14, Halstead Industrial Park", "Leicester, LE4 9GH", "Collections 07:00–17:00 Mon–Fri"] },
            { icon: Phone, title: "Trade desk", lines: ["+44 116 496 0142", "Mon–Fri, 08:00–18:00"] },
            { icon: Mail, title: "Email", lines: ["trade@halsteadfootwear.example", "privatelabel@halsteadfootwear.example"] },
          ].map((c) => (
            <div key={c.title} className="surface-panel p-6">
              <c.icon className="size-5 text-primary" />
              <h2 className="mt-3 text-2xl">{c.title}</h2>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {c.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}