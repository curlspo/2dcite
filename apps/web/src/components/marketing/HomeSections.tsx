import Link from "next/link";
import { homepageCopy } from "@/content/homepage";
import { StepList, type HowStep } from "@/components/marketing/StepCard";

const c = homepageCopy;

function Section({
  id,
  ariaLabelledBy,
  className = "",
  children,
}: {
  id?: string;
  ariaLabelledBy: string;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any;
}) {
  return (
    <section
      id={id}
      className={`border-t border-border py-14 md:py-16 ${className}`}
      aria-labelledby={ariaLabelledBy}
    >
      <div className="mx-auto max-w-5xl px-6">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
      {children}
    </p>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted md:text-base">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function HomeHero() {
  const { hero } = c;
  return (
    <section
      className="mx-auto max-w-5xl px-6 pb-10 pt-14 md:pb-12 md:pt-20"
      aria-labelledby="hero-heading"
    >
      <Eyebrow>{hero.eyebrow}</Eyebrow>
      <h1
        id="hero-heading"
        className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-[1.15] text-ink md:text-5xl"
      >
        {hero.title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
        {hero.body}
      </p>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
        {hero.support}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={hero.primaryCta.href} className="btn-primary">
          {hero.primaryCta.label}
        </Link>
        <Link href={hero.secondaryCta.href} className="btn-secondary">
          {hero.secondaryCta.label}
        </Link>
      </div>

      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
        {hero.disclaimer}{" "}
        <Link
          href="/disclaimer"
          className="font-medium text-accent underline underline-offset-2"
        >
          Full disclaimer
        </Link>
        {" · "}
        <Link
          href="/about"
          className="font-medium text-accent underline underline-offset-2"
        >
          About 2dcite
        </Link>
      </p>

      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-accent underline underline-offset-2"
        >
          Sign in
        </Link>
        {" · "}
        <Link
          href={c.studentPath.cta.href}
          className="font-medium text-accent underline underline-offset-2"
        >
          {c.studentPath.cta.label}
        </Link>
      </p>
    </section>
  );
}

export function HomeTrustBar() {
  return (
    <div
      className="border-y border-border bg-card"
      role="region"
      aria-label="Service attributes"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-2 gap-y-2 px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.1em] text-ink sm:text-sm sm:tracking-[0.08em]">
        {c.trustBar.map((item, i) => (
          <span key={item} className="inline-flex items-center gap-x-2">
            {i > 0 && (
              <span className="text-border" aria-hidden="true">
                ·
              </span>
            )}
            <span>{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function HomeHumanLoop() {
  const s = c.humanLoop;
  return (
    <Section id={s.id} ariaLabelledBy="human-loop-heading" className="bg-card">
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h2
        id="human-loop-heading"
        className="mt-3 max-w-3xl font-serif text-2xl font-semibold text-ink md:text-3xl"
      >
        {s.title}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
        {s.lead}
      </p>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted">
        {s.body}
      </p>
      <p className="mt-6 text-sm font-medium text-ink">{s.checksIntro}</p>
      <BulletList items={s.checks} />
      <div className="mt-8 max-w-3xl rounded-xl border border-border bg-surface-base p-5 md:p-6">
        <h3 className="font-serif text-lg font-semibold text-ink">
          {s.resultTitle}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted md:text-base">
          {s.resultBody}
        </p>
      </div>
    </Section>
  );
}

export function HomeWhyItMatters() {
  const s = c.whyItMatters;
  return (
    <Section id={s.id} ariaLabelledBy="why-matters-heading">
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h2
        id="why-matters-heading"
        className="mt-3 max-w-3xl font-serif text-2xl font-semibold text-ink md:text-3xl"
      >
        {s.title}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
        {s.lead}
      </p>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
        {s.caseNote}
      </p>
      <p className="mt-4 max-w-3xl border-l-2 border-accent pl-4 font-medium leading-relaxed text-ink">
        {s.lesson}
      </p>

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="font-serif text-xl font-semibold text-ink">
            {s.dutyTitle}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
            {s.dutyBody}
          </p>
        </div>
        <div>
          <h3 className="font-serif text-xl font-semibold text-ink">
            {s.independentTitle}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
            {s.independentBody}
          </p>
          <p className="mt-4 text-sm font-medium text-ink">{s.findsIntro}</p>
          <BulletList items={s.finds} />
        </div>
      </div>
    </Section>
  );
}

export function HomeHowItWorks() {
  const s = c.howItWorks;
  const steps: HowStep[] = s.steps.map((step) => ({
    step: step.step,
    title: step.title,
    body: step.body,
    emphasize: "emphasize" in step ? step.emphasize : undefined,
  }));

  return (
    <Section
      id={s.id}
      ariaLabelledBy="how-heading"
      className="bg-surface-muted/60"
    >
      <h2
        id="how-heading"
        className="font-serif text-2xl font-semibold text-ink md:text-3xl"
      >
        {s.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">{s.intro}</p>
      <StepList steps={steps} />
      <div className="mt-10">
        <Link href={s.cta.href} className="btn-primary">
          {s.cta.label}
        </Link>
      </div>
    </Section>
  );
}

export function HomeCertificate() {
  const s = c.certificate;
  return (
    <Section id={s.id} ariaLabelledBy="certificate-heading" className="bg-card">
      <h2
        id="certificate-heading"
        className="max-w-3xl font-serif text-2xl font-semibold text-ink md:text-3xl"
      >
        {s.title}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
        {s.lead}
      </p>
      <p className="mt-6 text-sm font-medium text-ink">{s.pointsIntro}</p>
      <BulletList items={s.points} />
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">
        {s.disclaimer}
      </p>
    </Section>
  );
}

export function HomeClosingCta() {
  const s = c.closing;
  return (
    <Section
      id={s.id}
      ariaLabelledBy="closing-heading"
      className="border-border bg-[#16325c] text-white"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
        {s.campaign}
      </p>
      <h2
        id="closing-heading"
        className="mt-3 max-w-3xl font-serif text-2xl font-semibold text-white md:text-3xl"
      >
        {s.title}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90">
        {s.body}
      </p>
      <p className="mt-4 max-w-2xl font-medium text-white">{s.tagline}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={s.primaryCta.href}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-white bg-white px-5 text-sm font-semibold text-[#16325c] hover:bg-white/95"
        >
          {s.primaryCta.label}
        </Link>
        <Link
          href={s.secondaryCta.href}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/60 bg-transparent px-5 text-sm font-semibold text-white hover:bg-white/10"
        >
          {s.secondaryCta.label}
        </Link>
      </div>
      <p className="mt-4 text-sm text-white/75">{s.note}</p>
    </Section>
  );
}

export function HomeResources() {
  const s = c.resources;
  return (
    <Section id={s.id} ariaLabelledBy="resources-heading">
      <h2
        id="resources-heading"
        className="font-serif text-2xl font-semibold text-ink md:text-3xl"
      >
        {s.title}
      </h2>
      <p className="mt-3 max-w-2xl text-muted">{s.intro}</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {s.links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent/40 hover:bg-accent-soft/30"
            >
              <span className="font-medium text-accent underline underline-offset-2">
                {link.label}
              </span>
              <span className="mt-2 text-sm leading-relaxed text-muted">
                {link.description}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
