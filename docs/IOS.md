# 2dcite iOS (Expo)

Native iOS client for attorneys, judges, and approved law students. Shares the same accounts and API as [2dcite.com](https://2dcite.com).

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Expo SDK 53 + Expo Router |
| Package | `apps/mobile` (`@2dcite/mobile`) |
| API | `@2dcite/api-client` → `https://2dcite.com/api/v1` |
| Auth | Bearer token in `expo-secure-store` |
| Payments | Stripe Checkout via in-app browser (`expo-web-browser`) |
| Bundle ID | `com.twodcite.app` |
| URL scheme | `twodcite://` |

## Features (Phase 6 → App Store path)

**Clients (attorney / judge)**

- Sign in / sign up (bar state + number for attorney/judge)
- List jobs, create job (PDF pick, Standard/Rush, **review scope**, liability acks)
- Checkout (Stripe when configured; otherwise server dev-mock if enabled)
- Job detail: payment hold, **anonymous reviewer number**, findings, certificate

**Students**

- Assignments list (active + history)
- Accept / decline
- Submit findings with **scope-aware codes**, general attestation, **no-AI attestation**
- Certificate / payout status after completion
- See own public **reviewer code** (R-######)

**Not in v1 native app (use web)**

- Student eligibility document uploads + school dropdown
- Admin tools
- Password recovery / Turnstile captcha (web)
- Push notifications

## Local development

Prerequisites: Node 20+, pnpm, Xcode (for simulator), Expo Go or dev client.

```bash
cd ~/2dcite
pnpm install
# API (separate terminal)
pnpm --filter @2dcite/web dev

# Mobile
cd apps/mobile
# Point at local API (default in __DEV__)
export EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
pnpm dev
# then press i for iOS simulator
```

**Physical device:** `localhost` will not reach your Mac. Use your LAN IP:

```bash
export EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api/v1
```

Production / TestFlight builds default to `https://2dcite.com/api/v1` (see `src/lib/config.ts` and `eas.json`).

## App Store / EAS

### Prerequisites
1. [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/yr).
2. Expo account: `npm i -g eas-cli && eas login`.
3. App icons / splash are in `apps/mobile/assets/` (icon.png, splash.png).

### Configure project (once)
```bash
cd apps/mobile
eas build:configure
# Copy the printed projectId into app.json → expo.extra.eas.projectId
```

### Production build + TestFlight
```bash
cd apps/mobile
eas build --platform ios --profile production
# After first successful build + App Store Connect app created:
# set submit.production.ios.ascAppId in eas.json
eas submit --platform ios --profile production
```

4. In App Store Connect, set privacy nutrition labels (email, documents, payment via Stripe).
5. Screenshots, description, support URL (`https://2dcite.com`), privacy URL (`https://2dcite.com/privacy`).

### Privacy / Info.plist notes

- `NSPhotoLibraryUsageDescription` / document picker: PDF upload for citation review.
- Documents are confidential; students are bound by platform confidentiality terms.
- Payments process through Stripe; 2dcite holds funds until certificate issuance.

## Accessibility

- Minimum 44pt touch targets on primary controls
- `accessibilityRole` / `accessibilityState` on checkboxes, radios, buttons
- Error messages use `accessibilityRole="alert"`
- Prefer VoiceOver testing before App Store review

## Legal copy

Disclaimer copy version is shared with web via `@2dcite/shared` (`DISCLAIMER_COPY_VERSION`). Client acknowledgments and student attestation must stay in sync with the web app.

## Related docs

- [PRODUCT.md](./PRODUCT.md) — product scope
- [API.md](./API.md) — REST surface
- [LAUNCH.md](./LAUNCH.md) — go-live checklist
- [ACCESSIBILITY.md](./ACCESSIBILITY.md) — WCAG notes
