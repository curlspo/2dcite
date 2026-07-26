#!/usr/bin/env bash
# Clean one-shot iOS smoke launcher for 2dcite.
# Prerequisites: Xcode selected, iOS runtime installed, API running on :3000
set -euo pipefail

export PATH="/opt/homebrew/bin:/Applications/Xcode.app/Contents/Developer/usr/bin:$PATH"
export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-http://localhost:3000/api/v1}"

SIMCTL="/Library/Developer/PrivateFrameworks/CoreSimulator.framework/Versions/A/Resources/bin/simctl"
APP="/tmp/expo-go-ios/Expo Go.app"
ROOT="${HOME}/2dcite"

echo "==> API"
if ! curl -sf --max-time 5 "${EXPO_PUBLIC_API_URL}/health" >/tmp/2dcite-health.json; then
  echo "API not reachable at ${EXPO_PUBLIC_API_URL}"
  echo "In another terminal: cd ~/2dcite && pnpm --filter @2dcite/web dev"
  exit 1
fi
head -c 120 /tmp/2dcite-health.json; echo

if pgrep -f update_dyld_sim_shared_cache >/dev/null 2>&1; then
  echo ""
  echo "WARNING: update_dyld_sim_shared_cache is running."
  echo "If it has been >15 min with 0% progress, it is likely wedged."
  echo "Fix (password required):"
  echo "  sudo kill \$(pgrep -f update_dyld_sim_shared_cache)"
  echo "  # then Device → Erase All Content and Settings in Simulator"
  echo "  # or: xcrun simctl shutdown all && xcrun simctl erase all"
  echo ""
  read -r -p "Press Enter after dyld is gone (or Ctrl-C to abort)… "
fi

echo "==> Expo Go package"
if [[ ! -d "$APP" ]]; then
  mkdir -p /tmp/expo-go-ios
  cd /tmp/expo-go-ios
  curl -fL --progress-bar -o Expo-Go-2.33.17.tar.gz \
    "https://github.com/expo/expo-go-releases/releases/download/Expo-Go-2.33.17/Expo-Go-2.33.17.tar.gz"
  rm -rf "Expo Go.app"
  mkdir "Expo Go.app"
  tar -xzf Expo-Go-2.33.17.tar.gz -C "Expo Go.app"
fi

echo "==> Boot simulator"
open -a Simulator
UDID="$("$SIMCTL" list devices available | sed -n 's/.*iPhone.*(\([A-F0-9-]\{36\}\)).*/\1/p' | head -1 || true)"
if [[ -z "${UDID}" ]]; then
  UDID="$("$SIMCTL" create "2dcite Smoke" \
    com.apple.CoreSimulator.SimDeviceType.iPhone-16 \
    com.apple.CoreSimulator.SimRuntime.iOS-26-5)"
fi
echo "    UDID=${UDID}"
"$SIMCTL" boot "${UDID}" 2>/dev/null || true
for _ in $(seq 1 30); do
  if "$SIMCTL" list devices | grep -q "${UDID}.*(Booted)"; then
    echo "    booted"
    break
  fi
  sleep 2
done

echo "==> Install Expo Go"
"$SIMCTL" install "${UDID}" "${APP}"

echo "==> Metro"
if ! curl -sf --max-time 2 http://127.0.0.1:8081/status | grep -q running; then
  cd "${ROOT}/apps/mobile"
  nohup env EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL}" npx expo start --localhost \
    >/tmp/2dcite-metro.log 2>&1 &
  echo $! >/tmp/2dcite-metro.pid
  for _ in $(seq 1 40); do
    curl -sf --max-time 1 http://127.0.0.1:8081/status | grep -q running && break
    sleep 1
  done
fi
curl -sf http://127.0.0.1:8081/status; echo

echo "==> Open app"
"$SIMCTL" launch "${UDID}" host.exp.Exponent || true
sleep 1
"$SIMCTL" openurl "${UDID}" "exp://127.0.0.1:8081" || true

cat <<EOF

If Expo Go opens but the project does not load:
  1. In Expo Go: Enter URL manually → exp://127.0.0.1:8081
  2. Or home screen → open Expo Go → recent projects

Smoke login:
  smoke-attorney@2dcite.test / smoke-test-password

Metro log:  tail -f /tmp/2dcite-metro.log
EOF
