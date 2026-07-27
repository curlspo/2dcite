import Link from "next/link";

/**
 * Geometric “chain of verification” mark — white glyphs on near-black chip only.
 */
export function BrandMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ color: "#ffffff" }}
    >
      <circle cx="5" cy="12" r="2.25" fill="#ffffff" />
      <circle cx="12" cy="6" r="2.25" fill="#ffffff" />
      <circle cx="12" cy="18" r="2.25" fill="#ffffff" />
      <circle cx="19" cy="12" r="2.25" fill="#ffffff" />
      <path
        d="M7 11.2 10.2 7.8M14 7.8 17 11.2M7 12.8 10.2 16.2M14 16.2 17 12.8"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLockup({
  href = "/",
  compact = false,
}: {
  href?: string | null;
  compact?: boolean;
}) {
  const className = `brand-lockup ${compact ? "px-2 py-1.5" : "px-2.5 py-1.5"}`;
  const inner = (
    <>
      <BrandMark className={compact ? "h-4 w-4" : "h-5 w-5"} />
      <span
        className={`font-sans font-semibold tracking-tight ${
          compact ? "text-sm" : "text-base"
        }`}
        style={{ color: "#ffffff" }}
        aria-hidden={href ? true : undefined}
      >
        2dcite
      </span>
      {href ? <span className="sr-only">2dcite home</span> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} style={{ color: "#ffffff" }}>
        {inner}
      </Link>
    );
  }

  return (
    <span className={className} style={{ color: "#ffffff" }}>
      {inner}
    </span>
  );
}
