import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askConsultant } from "@/lib/consultant.functions";

type Message = { role: "user" | "assistant"; content: string };

const GREETING: Message = {
  role: "assistant",
  content:
    "Hi — I'm the Halstead footwear consultant. Tell me the end use, volumes and budget per pair and I'll shortlist styles from our live catalog.",
};

const PROMPTS = [
  "Safety boots for a 300-worker site",
  "Best value school shoes at 240 pairs",
  "Waterproof outdoor styles in stock",
];

export function AiConsultant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const ask = useServerFn(askConsultant);

  const send = useMutation({
    mutationFn: async (question: string) => {
      const history = [...messages.slice(1), { role: "user" as const, content: question }];
      const result = await ask({ data: { messages: history.slice(-20) } });
      return result.answer;
    },
    onSuccess: (answer) => setMessages((prev) => [...prev, { role: "assistant", content: answer }]),
    onError: (error: Error) =>
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: error.message || "Something went wrong — please try again." },
      ]),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, send.isPending]);

  function submit(question: string) {
    const trimmed = question.trim();
    if (!trimmed || send.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setDraft("");
    send.mutate(trimmed);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[32rem] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-ink px-4 py-3 text-ink-foreground">
            <div>
              <p className="label-caps text-primary">AI consultant</p>
              <p className="text-sm">Live catalog & bulk pricing</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close consultant">
              <X className="size-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-strong:text-current text-current">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {send.isPending && (
              <p className="text-sm text-muted-foreground">Checking the catalog…</p>
            )}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => submit(p)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="flex items-center gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft);
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about styles, sizes or pricing…"
              aria-label="Message the footwear consultant"
            />
            <Button type="submit" size="icon" disabled={send.isPending || !draft.trim()}>
              <Send className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      )}

      <Button
        size="lg"
        className="fixed bottom-5 right-4 z-50 h-14 rounded-full px-5 shadow-xl"
        onClick={() => setOpen((v) => !v)}
      >
        <MessageCircle className="size-5" />
        <span className="ml-2 hidden sm:inline">Ask a consultant</span>
      </Button>
    </>
  );
}