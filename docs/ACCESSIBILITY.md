# Accessibility (ADA / WCAG) — 2dcite web

## Goal

Align the public and authenticated web app with **WCAG 2.2 Level AA** practices and support **ADA Title III** digital accessibility expectations for a public-facing service.

## Implemented

| Area | Implementation |
|------|----------------|
| Skip link | Global “Skip to main content” |
| Landmarks | `header`/`nav`/`main`/`footer` with labels |
| Focus | `:focus-visible` rings on controls |
| Motion | `prefers-reduced-motion` respected |
| Contrast | Darker muted/gold/accent tokens |
| Forms | Explicit `label`/`htmlFor`, `role="alert"` errors, `aria-busy` |
| Touch | ~44px min height on primary controls |
| Mobile nav | Expandable menu with `aria-expanded` / `aria-controls` |
| Statement | `/accessibility` public page |

## Ongoing checklist

- [ ] Replace `window.prompt` admin reject/reassign with accessible modals
- [ ] Manual keyboard pass on all primary flows each release
- [ ] Screen reader spot-check (VoiceOver / NVDA) on login, job create, review
- [ ] Automated axe/lighthouse CI (optional)
- [ ] Caption/transcript policy if video marketing is added
- [ ] Counsel review of accessibility statement language

## Testing commands

```bash
pnpm --filter @2dcite/web build
pnpm --filter @2dcite/web dev
# Browser: Tab through landing → login → signup; verify skip link and focus rings
```

## Contact

Product accessibility feedback: `support@2dcite.com` (see `/accessibility`).
