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

## Features (Phase 6)

**Clients (attorney / judge)**

- Sign in / sign up
- List jobs, create job (PDF pick, Standard/Rush, liability acknowledgments)
- Checkout (Stripe when configured; otherwise server dev-mock if enabled)
- Job detail: payment hold status, findings, certificate link

**Students**

- Assignments list (active + history)
- Accept / decline
- Submit citation findings + required attestation
- Certificate / payout status after completion

**Not in v1 native app**

- Student eligibility document uploads (use web)
- Admin tools (use web)
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

1. Create an Expo account and Apple Developer Program membership.
2. Install EAS CLI: `npm i -g eas-cli` then `eas login`.
3. From `apps/mobile`:

```bash
eas build:configure   # once
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

4. In App Store Connect, set privacy nutrition labels to match data actually collected (account email, documents for review, payment via Stripe).
5. Replace `ascAppId` in `eas.json` after the app exists in App Store Connect.
6. Add App icons / splash assets before store submission (`app.json` currently has no custom icon path — Expo defaults apply for internal builds).

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
