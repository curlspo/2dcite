"use client";

import { useId, useState } from "react";
import {
  DISCLAIMER_COPY_VERSION,
  FULL_DISCLAIMER_SECTIONS,
} from "@2dcite/shared";

type Props = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * In-flow full disclaimer: expandable scroll panel +
 * “I have read and understand” checkbox (gates payment).
 * Legal text is verbatim from @2dcite/shared.
 */
export function DisclaimerAckPanel({ checked, onCheckedChange }: Props) {
  const panelId = useId();
  const checkboxId = useId();
  const [expanded, setExpanded] = useState(true);

  return (
    <fieldset className="rounded-xl border border-border bg-card p-4">
      <legend className="px-1 text-sm font-medium text-ink">
        Full disclaimer
      </legend>
      <p className="mt-1 text-xs text-muted">
        Required before payment. Copy version {DISCLAIMER_COPY_VERSION}. Same
        text as the public{" "}
        <a href="/disclaimer" className="text-accent underline" target="_blank" rel="noreferrer">
          Disclaimer page
        </a>
        .
      </p>

      <button
        type="button"
        className="mt-3 text-sm font-medium text-accent underline underline-offset-2"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Hide full disclaimer text" : "Show full disclaimer text"}
      </button>

      {expanded && (
        <div
          id={panelId}
          tabIndex={0}
          role="region"
          aria-label="Full disclaimer text"
          className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-border bg-background p-4 text-sm leading-relaxed text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {FULL_DISCLAIMER_SECTIONS.map((section, i) => (
            <div key={section.heading ?? `intro-${i}`} className={i > 0 ? "mt-5" : undefined}>
              {section.heading && (
                <h3 className="font-serif text-base font-semibold text-ink">
                  {section.heading}
                </h3>
              )}
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 48)} className="mt-2">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      <label
        htmlFor={checkboxId}
        className="mt-4 flex min-h-11 cursor-pointer gap-3 text-sm text-ink"
      >
        <input
          id={checkboxId}
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
        />
        <span>
          <span className="font-medium">I have read and understand</span> the
          full disclaimer above, including that liability remains with me as the
          licensed attorney or judge, that this is not legal advice, and that
          payment is held until certificate issuance.
        </span>
      </label>
    </fieldset>
  );
}
