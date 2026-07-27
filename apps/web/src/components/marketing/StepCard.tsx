export type HowStep = {
  step: number;
  title: string;
  body: string;
  note?: string;
  emphasize?: boolean;
};

export function StepList({ steps }: { steps: HowStep[] }) {
  return (
    <ol className="relative mt-10 grid gap-0 md:grid-cols-4 md:gap-4">
      {/* Desktop connecting line */}
      <div
        className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-border md:block"
        aria-hidden="true"
      />
      {steps.map((item, i) => (
        <li key={item.step} className="relative flex gap-4 md:flex-col md:gap-0">
          {/* Mobile vertical connector */}
          {i < steps.length - 1 && (
            <span
              className="absolute bottom-0 left-[1.125rem] top-12 w-px bg-border md:hidden"
              aria-hidden="true"
            />
          )}
          <div className="relative z-[1] flex shrink-0 flex-col items-center md:items-start">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                item.emphasize
                  ? "border-[#16325c] bg-[#16325c] text-white"
                  : "border-border bg-card text-ink"
              }`}
            >
              <span className="sr-only">Step </span>
              {item.step}
            </span>
          </div>
          <div
            className={`min-w-0 flex-1 pb-8 md:mt-4 md:pb-0 md:pt-0 ${
              item.emphasize
                ? "rounded-xl border border-accent/40 bg-accent-soft/50 p-4 md:p-5"
                : "md:rounded-xl md:border md:border-border md:bg-card md:p-5"
            }`}
          >
            <h3
              className={`font-medium text-ink ${
                item.emphasize ? "text-base md:text-lg" : "text-base"
              }`}
            >
              {item.title}
              {item.emphasize && (
                <span className="mt-1 block h-0.5 w-10 bg-gold" aria-hidden="true" />
              )}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            {item.note && (
              <p className="mt-2 text-xs leading-relaxed text-muted/90">
                {item.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
