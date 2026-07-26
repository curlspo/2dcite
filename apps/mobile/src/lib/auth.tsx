import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { createApiClient, type ApiClient } from "@2dcite/api-client";
import type { MeResponse } from "@2dcite/shared";
import { getApiBaseUrl, TOKEN_KEY } from "./config";

type AuthState = {
  ready: boolean;
  token: string | null;
  user: MeResponse | null;
  api: ApiClient;
  signIn: (token: string, user: MeResponse) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MeResponse | null>(null);

  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: getApiBaseUrl(),
        getToken: async () => {
          if (token) return token;
          return SecureStore.getItemAsync(TOKEN_KEY);
        },
      }),
    [token]
  );

  const refreshUser = useCallback(async () => {
    const t = token || (await SecureStore.getItemAsync(TOKEN_KEY));
    if (!t) {
      setUser(null);
      return;
    }
    try {
      const me = await createApiClient({
        baseUrl: getApiBaseUrl(),
        getToken: async () => t,
      }).me();
      setUser(me);
      setToken(t);
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      const t = await SecureStore.getItemAsync(TOKEN_KEY);
      if (t) {
        setToken(t);
        try {
          const me = await createApiClient({
            baseUrl: getApiBaseUrl(),
            getToken: async () => t,
          }).me();
          setUser(me);
        } catch {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      }
      setReady(true);
    })();
  }, []);

  const signIn = useCallback(async (t: string, u: MeResponse) => {
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [api]);

  const value = useMemo(
    () => ({
      ready,
      token,
      user,
      api,
      signIn,
      signOut,
      refreshUser,
    }),
    [ready, token, user, api, signIn, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
