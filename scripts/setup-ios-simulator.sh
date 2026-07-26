#!/usr/bin/env bash
# One-time macOS setup so Expo can launch the iOS Simulator.
# Run: bash scripts/setup-ios-simulator.sh
set -euo pipefail

if [[ ! -d /Applications/Xcode.app ]]; then
  echo "Install Xcode from the Mac App Store first."
  exit 1
fi

echo "→ Pointing xcode-select at Xcode.app (sudo)…"
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

echo "→ Accepting Xcode license (sudo)…"
sudo xcodebuild -license accept

echo "→ Running first-launch setup (sudo; may take a few minutes)…"
sudo xcodebuild -runFirstLaunch

echo "→ Developer path: $(xcode-select -p)"
echo "→ xcodebuild:"
xcodebuild -version

if ! xcrun simctl help >/dev/null 2>&1; then
  echo "simctl still unavailable. Open Xcode once and install iOS platform components."
  open -a Xcode
  exit 1
fi

echo "→ Available devices (excerpt):"
xcrun simctl list devices available | head -40 || true

if ! xcrun simctl list devices available | grep -q iPhone; then
  echo
  echo "No iPhone simulators found."
  echo "In Xcode: Settings → Platforms → download an iOS Simulator runtime,"
  echo "then re-run this script or: open -a Simulator"
  open -a Xcode
  exit 1
fi

echo
echo "OK — you can start the app:"
echo "  cd ~/2dcite && pnpm --filter @2dcite/web dev"
echo "  cd ~/2dcite/apps/mobile && EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1 pnpm ios"
echo
echo "Smoke accounts: docs/IOS-SMOKE.md"
