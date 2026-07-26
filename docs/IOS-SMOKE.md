# iOS Simulator smoke test

Use this after one-time Xcode setup on the Mac.

## 0. One-time Mac setup (required)

Your machine currently has **Xcode installed** but:

1. Command Line Tools are selected instead of Xcode
2. The Xcode license is not accepted
3. iOS Simulator runtimes/devices are not installed yet

Run these in **Terminal.app** (password required):

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
sudo xcodebuild -runFirstLaunch
```

Then open Xcode once:

```bash
open -a Xcode
```

- If prompted, install **additional components** / **iOS platform**.
- Xcode → **Settings → Platforms** (or Components) → install an **iOS** simulator runtime.
- Confirm:

```bash
xcode-select -p
# expect: /Applications/Xcode.app/Contents/Developer

xcrun simctl list devices available | head
# expect at least one iPhone
```

Optional: open the Simulator app

```bash
open -a Simulator
```

## 1. Start API (terminal 1)

```bash
export PATH="/opt/homebrew/bin:$PATH"
cd ~/2dcite
pnpm --filter @2dcite/web dev
# health: http://localhost:3000/api/v1/health → ok
```

## 2. Start Expo on iOS simulator (terminal 2)

```bash
export PATH="/opt/homebrew/bin:$PATH"
cd ~/2dcite/apps/mobile
export EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
pnpm ios
# or: pnpm dev  then press i
```

First launch may take several minutes (Metro + native compile for Expo Go / dev client).

If Metro asks for a cache clear: `npx expo start -c`

## 3. Smoke accounts (local)

Created for local smoke (password for both: `smoke-test-password`):

| Role | Email |
|------|--------|
| Attorney | `smoke-attorney@2dcite.test` |
| Student (PENDING) | `smoke-student@2dcite.test` |
| Admin (seed) | `admin@2dcite.com` / `admin-change-me-now` |

Students must be **APPROVED** before assignments appear. Approve on web `/admin/students` or after completing onboarding uploads.

## 4. Client path (attorney)

1. Launch app → **Sign in** as smoke attorney  
2. Home shows **New review** / **My jobs**  
3. **Legal notices** opens and shows liability/confidentiality copy  
4. **New review**
   - Title: e.g. `Smoke TOA`
   - Optional instructions
   - Toggle Standard vs Rush (fee updates)
   - **Select PDF** → pick any small PDF  
   - Check **all** acknowledgments  
   - **Pay & submit**
5. Stripe disabled locally → expect dev mock checkout or message; land on **job detail**  
6. Pull to refresh → status moves past `AWAITING_PAYMENT` when mock pay works  
7. **My jobs** lists the job; open detail again  

**Pass criteria:** no red crashes; job appears; payment hold copy visible; UI remains usable with Dynamic Type / VoiceOver rough check on primary buttons.

## 5. Student path

1. Sign out → sign in as smoke student  
2. Home shows **Assignments** (may note PENDING status)  
3. Complete eligibility on **web** (`/onboarding/student`) + **admin approve**  
4. After a paid job is matched (auto-match or admin reassign):
   - Assignments list shows job  
   - Open → **Accept** (or Decline once and re-match)  
   - **Open PDF document** → share sheet / open in Books  
   - Add ≥1 finding, accept **attestation**, **Submit review**  
5. Client job detail shows findings; certificate available when issued  

**Pass criteria:** accept/decline works; review submit succeeds; cert/payout status shows after complete.

## 6. Failure checks

| Check | Expected |
|-------|----------|
| Airplane mode → jobs list | Error alert, no crash |
| Wrong password | Clear error, no crash |
| Submit job without PDF / without acks | Validation message |
| Unapproved student | Gate message, no crash |

## 7. Physical device (optional)

Simulator uses `localhost`. A real iPhone cannot.

```bash
# find Mac LAN IP
ipconfig getifaddr en0
export EXPO_PUBLIC_API_URL=http://YOUR.LAN.IP:3000/api/v1
pnpm dev
# scan QR with Expo Go (same Wi‑Fi)
```

Ensure Mac firewall allows Node on port 3000.

## 8. When smoke is green

- [ ] Client create + pay path  
- [ ] Student accept + review path (after approve)  
- [ ] Certificate open/share  
- [ ] No TypeScript regressions: `cd apps/mobile && pnpm lint`  

Then proceed to EAS / TestFlight (`docs/IOS.md`).
