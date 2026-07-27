"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";

type Props = {
  onToken: (token: string | null) => void;
  className?: string;
};

/**
 * Cloudflare Turnstile widget for public forms.
 * Site key is intentionally public (NEXT_PUBLIC_TURNSTILE_SITE_KEY).
 */
export function TurnstileWidget({ onToken, className }: Props) {
  const containerId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteKey =
    typeof process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === "string"
      ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY.trim()
      : "";

  useEffect(() => {
    if (!siteKey) {
      // Dev without keys: allow submit without widget
      onToken("dev-bypass");
      return;
    }

    let cancelled = false;

    function renderWidget() {
      if (cancelled || !window.turnstile) return;
      const el = document.getElementById(containerId);
      if (!el) return;
      // Avoid double-render
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
        el.innerHTML = "";
      }
      try {
        widgetIdRef.current = window.turnstile.render(el, {
          sitekey: siteKey,
          theme: "light",
          size: "flexible",
          callback: (token) => {
            if (!cancelled) onToken(token);
          },
          "expired-callback": () => {
            if (!cancelled) onToken(null);
          },
          "error-callback": () => {
            if (!cancelled) {
              onToken(null);
              setError("Security check failed to load. Refresh and try again.");
            }
          },
        });
        setReady(true);
      } catch (e) {
        console.error(e);
        setError("Security check unavailable. Refresh and try again.");
      }
    }

    window.onTurnstileLoad = () => {
      if (!cancelled) renderWidget();
    };

    const existing = document.getElementById(SCRIPT_ID);
    if (existing && window.turnstile) {
      renderWidget();
    } else if (!existing) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        if (!cancelled) {
          setError("Could not load security check. Check your network.");
        }
      };
      document.head.appendChild(script);
    } else {
      // Script loading
      const t = window.setInterval(() => {
        if (window.turnstile) {
          window.clearInterval(t);
          renderWidget();
        }
      }, 100);
      return () => {
        cancelled = true;
        window.clearInterval(t);
      };
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per site key
  }, [siteKey, containerId]);

  if (!siteKey) {
    return (
      <p className="text-xs text-muted" role="status">
        Security check skipped in this environment (CAPTCHA keys not configured).
      </p>
    );
  }

  return (
    <div className={className}>
      <div
        id={containerId}
        className="cf-turnstile min-h-[65px]"
        data-sitekey={siteKey}
      />
      {!ready && !error && (
        <p className="text-xs text-muted">Loading security check…</p>
      )}
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      <p className="mt-1 text-xs text-muted">
        Protected by Cloudflare Turnstile.
      </p>
    </div>
  );
}

/** Reset widget after failed submit so user can retry. */
export function resetTurnstile() {
  if (typeof window !== "undefined" && window.turnstile) {
    try {
      window.turnstile.reset();
    } catch {
      /* ignore */
    }
  }
}
