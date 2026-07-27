"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLockup } from "./BrandMark";

const NAV = [
  { href: "/about", label: "About" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#eligibility", label: "Eligibility" },
  { href: "/disclaimer", label: "Disclaimer" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur"
      role="banner"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
        <BrandLockup href="/" compact />

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-6 text-sm md:flex"
          aria-label="Primary"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Sign in
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-medium text-ink md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true">{open ? "✕" : "☰"} Menu</span>
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-border bg-card px-6 py-4 md:hidden"
          aria-label="Mobile primary"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block min-h-11 rounded-md px-2 py-3 text-muted hover:bg-accent-soft hover:text-ink"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="mt-2 block min-h-11 rounded-md border border-border px-3 py-3 text-center font-medium text-ink hover:bg-surface-muted"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
