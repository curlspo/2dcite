import { useCallback, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  LIABILITY_FOOTER,
  FUNDS_HOLD_COPY,
  DISCLAIMER_COPY_VERSION,
} from "@2dcite/shared";
import { createApiClient } from "@2dcite/api-client";
import * as SecureStore from "expo-secure-store";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const TOKEN_KEY = "2dcite_token";

type Me = {
  name: string;
  email: string;
  role: string;
  studentStatus?: string | null;
};

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          const token = await SecureStore.getItemAsync(TOKEN_KEY);
          if (!token) {
            if (active) setUser(null);
            return;
          }
          const api = createApiClient({
            baseUrl: API_URL,
            getToken: async () => token,
          });
          const me = (await api.me()) as Me;
          if (active) setUser(me);
        } catch {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          if (active) setUser(null);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  async function logout() {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      const api = createApiClient({
        baseUrl: API_URL,
        getToken: async () => token,
      });
      await api.logout().catch(() => {});
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>2dcite</Text>
        <Text style={styles.headline}>
          Independent citation review for attorneys and judges
        </Text>
        <Text style={styles.body}>
          Sign in with the same account you use on 2dcite.com. Students must be
          approved before receiving assignments.
        </Text>
        <Pressable style={styles.button} onPress={() => router.push("/login")}>
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
        <Pressable
          style={styles.buttonSecondary}
          onPress={() => router.push("/signup")}
        >
          <Text style={styles.buttonSecondaryText}>Create account</Text>
        </Pressable>
        <Text style={styles.footer}>{LIABILITY_FOOTER}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand}>2dcite</Text>
      <Text style={styles.headline}>Hello, {user.name}</Text>
      <Text style={styles.body}>
        {user.role} · {user.email}
        {user.role === "STUDENT"
          ? ` · status: ${user.studentStatus || "PENDING"}`
          : ""}
      </Text>
      {user.role === "STUDENT" && user.studentStatus !== "APPROVED" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Eligibility gate</Text>
          <Text style={styles.cardBody}>
            Complete your application on the web (document uploads) and wait for
            admin approval before you can receive jobs. Mobile application
            uploads ship next.
          </Text>
        </View>
      )}
      {(user.role === "ATTORNEY" || user.role === "JUDGE") && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Funds</Text>
          <Text style={styles.cardBody}>{FUNDS_HOLD_COPY.clientPayOnUpload}</Text>
          <Text style={[styles.cardBody, styles.mt]}>
            {FUNDS_HOLD_COPY.releaseOnCertificate}
          </Text>
        </View>
      )}
      <Pressable style={styles.buttonSecondary} onPress={logout}>
        <Text style={styles.buttonSecondaryText}>Sign out</Text>
      </Pressable>
      <Text style={styles.footer}>{LIABILITY_FOOTER}</Text>
      <Text style={styles.version}>Disclaimer copy {DISCLAIMER_COPY_VERSION}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 48, backgroundColor: "#f8f7f4" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  brand: { fontSize: 28, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  headline: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a2332",
    lineHeight: 28,
    marginBottom: 12,
  },
  body: { fontSize: 15, lineHeight: 22, color: "#5b6575", marginBottom: 20 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e0d8",
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 6,
  },
  cardBody: { fontSize: 14, lineHeight: 20, color: "#5b6575" },
  mt: { marginTop: 8 },
  button: {
    backgroundColor: "#1e3a5f",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: "#e2e0d8",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  buttonSecondaryText: { color: "#0f172a", fontWeight: "600" },
  footer: { marginTop: 16, fontSize: 11, lineHeight: 16, color: "#5b6575" },
  version: { marginTop: 8, fontSize: 10, color: "#9aa3b2" },
});
