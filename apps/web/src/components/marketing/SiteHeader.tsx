"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
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
  const pathname = usePathname();
  const menuId = useId().replace(/:/g, "");

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Close when navigating to another route
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape + lock background scroll while open (mobile UX)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <header
      className="sticky top-0 z-50 border-b border-border bg-card"
      role="banner"
    >
      {/* Dimmed page overlay — below the header bar/panel so links stay tappable */}
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/40 md:hidden"
          aria-label="Close menu"
          onClick={close}
          style={{ cursor: "pointer" }}
        />
      ) : null}

      <div className="relative z-50 bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
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
            className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-semibold text-ink shadow-sm md:hidden"
            style={{
              WebkitTapHighlightColor: "transparent",
              cursor: "pointer",
            }}
            aria-expanded={open}
            aria-controls={menuId}
            aria-haspopup="true"
            onClick={toggle}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" className="text-base leading-none">
              {open ? "✕" : "☰"}
            </span>
            <span aria-hidden="true">{open ? "Close" : "Menu"}</span>
          </button>
        </div>

        {/* Mobile panel — always in DOM; show/hide with CSS */}
        <nav
          id={menuId}
          className={`border-t border-border bg-card md:hidden ${
            open ? "block" : "hidden"
          }`}
          aria-label="Mobile primary"
          hidden={!open}
        >
          <ul className="mx-auto flex max-w-5xl flex-col gap-0.5 px-4 py-3 sm:px-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block min-h-12 touch-manipulation rounded-md px-3 py-3 text-base text-ink hover:bg-accent-soft active:bg-accent-soft"
                  onClick={close}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/login"
                className="block min-h-12 touch-manipulation rounded-md border border-border bg-background px-3 py-3 text-center text-base font-semibold text-ink hover:bg-surface-muted active:bg-surface-muted"
                onClick={close}
              >
                Sign in
              </Link>
            </li>
            <li className="pb-1 pt-1">
              <Link
                href="/signup"
                className="btn-primary block w-full touch-manipulation text-center"
                style={{ color: "#ffffff", backgroundColor: "#16325c" }}
                onClick={close}
              >
                Create account
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
