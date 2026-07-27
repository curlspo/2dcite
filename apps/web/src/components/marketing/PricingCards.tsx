function usd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export type PricingTier = {
  name: string;
  priceCents: number;
  /** Shown under the price (e.g. "per review" or "/ month") */
  priceSuffix?: string;
  turnaround: string;
  includes: string[];
  badge?: string;
  highlighted?: boolean;
  cta?: { label: string; href: string };
};

export function PricingCards({ tiers }: { tiers: PricingTier[] }) {
  const cols =
    tiers.length >= 3
      ? "md:grid-cols-3"
      : tiers.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-1 max-w-md";

  return (
    <div className={`mt-8 grid gap-4 ${cols}`}>
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={`flex flex-col rounded-xl border p-6 ${
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
            {tier.priceSuffix && (
              <span className="ml-1 text-base font-sans font-normal text-muted">
                {tier.priceSuffix}
              </span>
            )}
          </p>
          <p className="mt-2 text-sm text-muted">{tier.turnaround}</p>
          <ul className="mt-5 flex-1 space-y-2 text-sm text-muted">
            {tier.includes.map((item) => (
              <li key={item} className="flex gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {tier.cta && (
            <a
              href={tier.cta.href}
              className={
                tier.highlighted
                  ? "btn-primary mt-6 w-full text-center"
                  : "btn-secondary mt-6 w-full text-center"
              }
            >
              {tier.cta.label}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
