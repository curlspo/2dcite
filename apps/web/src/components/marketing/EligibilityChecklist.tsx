const DEFAULT_ITEMS = [
  "Be currently enrolled at an accredited law school",
  "Be a 2L or 3L",
  "Have taken and passed a legal writing course",
  "Be recommended by a professor",
  "Pass manual admin review of uploaded proof",
  "Hold only one active assignment at a time",
] as const;

/** Decorative verification-dot; meaning is in the text. */
function CheckDot() {
  return (
    <span
      className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ink/40"
      aria-hidden="true"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ink" />
    </span>
  );
}

export function EligibilityChecklist({
  items = [...DEFAULT_ITEMS],
}: {
  items?: string[];
}) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-muted">
          <CheckDot />
          <span className="text-sm leading-relaxed md:text-base">{item}</span>
        </li>
      ))}
    </ul>
  );
}
