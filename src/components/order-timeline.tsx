import { Check, Clock, PackageCheck, Truck, XCircle } from "lucide-react";

const STEPS = [
  { key: "pending", label: "Order received", icon: Clock },
  { key: "confirmed", label: "Confirmed by trade desk", icon: Check },
  { key: "shipped", label: "Dispatched", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
] as const;

export function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
        <XCircle className="size-4" />
        This order was cancelled. Contact the trade desk to reinstate it.
      </div>
    );
  }

  const current = Math.max(
    0,
    STEPS.findIndex((s) => s.key === status),
  );

  return (
    <ol className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {STEPS.map((step, index) => {
        const done = index <= current;
        const active = index === current;
        return (
          <li key={step.key} className="flex flex-1 items-start gap-3 sm:flex-col sm:gap-2">
            <div className="flex items-center gap-2 sm:w-full">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${
                  done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground"
                }`}
                aria-hidden
              >
                <step.icon className="size-4" />
              </span>
              <span
                className={`hidden h-px flex-1 sm:block ${
                  index < STEPS.length - 1 ? (index < current ? "bg-primary" : "bg-border") : "bg-transparent"
                }`}
              />
            </div>
            <div>
              <p className={`text-sm font-semibold ${done ? "" : "text-muted-foreground"}`}>{step.label}</p>
              <p className="text-xs text-muted-foreground">
                {active ? "Current stage" : done ? "Complete" : "Pending"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}