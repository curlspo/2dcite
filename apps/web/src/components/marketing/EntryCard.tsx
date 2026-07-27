import Link from "next/link";

type EntryCardProps = {
  href: string;
  title: string;
  description: string;
  cta: string;
  variant?: "primary" | "secondary";
};

export function EntryCard({
  href,
  title,
  description,
  cta,
  variant = "primary",
}: EntryCardProps) {
  const isPrimary = variant === "primary";
  return (
    <Link
      href={href}
      className={`group flex min-h-[9.5rem] flex-col justify-between rounded-xl border p-5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
        isPrimary
          ? "border-[#16325c] bg-[#16325c] text-white"
          : "border-border bg-white text-ink hover:bg-surface-muted"
      }`}
      style={isPrimary ? { color: "#ffffff", backgroundColor: "#16325c" } : undefined}
    >
      <div>
        <p
          className={`text-xs font-semibold uppercase tracking-wider ${
            isPrimary ? "" : "text-ink"
          }`}
          style={isPrimary ? { color: "#ffffff" } : { color: "#0f172a" }}
        >
          {title}
        </p>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={isPrimary ? { color: "#f1f5f9" } : { color: "#334155" }}
        >
          {description}
        </p>
      </div>
      <span
        className="mt-4 inline-flex items-center text-sm font-semibold"
        style={isPrimary ? { color: "#ffffff" } : { color: "#16325c" }}
      >
        {cta}
        <span
          aria-hidden="true"
          className="ml-1 transition-transform group-hover:translate-x-0.5"
        >
          →
        </span>
      </span>
    </Link>
  );
}
