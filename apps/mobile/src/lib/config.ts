import Constants from "expo-constants";

function envApiUrl(): string | undefined {
  const fromProcess = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env?.EXPO_PUBLIC_API_URL;
  if (fromProcess) return fromProcess;
  return undefined;
}

/**
 * API base URL:
 * - EXPO_PUBLIC_API_URL wins when set
 * - __DEV__ → local machine
 * - production/TestFlight → 2dcite.com (or extra.apiUrl)
 */
export function getApiBaseUrl(): string {
  const fromEnv = envApiUrl();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    // iOS simulator can reach host machine localhost
    return "http://localhost:3000/api/v1";
  }

  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl) return extra.apiUrl.replace(/\/$/, "");

  return "https://2dcite.com/api/v1";
}

export const TOKEN_KEY = "2dcite_token";
