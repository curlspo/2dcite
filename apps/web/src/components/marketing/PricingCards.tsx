function usd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

type Tier = {
  name: string;
  priceCents: number;
  turnaround: string;
  includes: string[];
  badge?: string;
  highlighted?: boolean;
};

export function PricingCards({ tiers }: { tiers: Tier[] }) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={`rounded-xl border p-6 ${
            tier.highlighted
              ? "border-accent bg-accent-soft/40"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">{tier.name}</p>
            {tier.badge && (
              <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-ink">
                {tier.badge}
              </span>
            )}
          </div>
          <p className="mt-2 font-serif text-3xl font-semibold text-ink">
            {usd(tier.priceCents)}
          </p>
          <p className="mt-2 text-sm text-muted">{tier.turnaround}</p>
          <ul className="mt-5 space-y-2 text-sm text-muted">
            {tier.includes.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
