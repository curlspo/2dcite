import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { createApiClient } from "@2dcite/api-client";
import * as SecureStore from "expo-secure-store";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const TOKEN_KEY = "2dcite_token";

const ROLES = [
  { value: "ATTORNEY" as const, label: "Attorney" },
  { value: "JUDGE" as const, label: "Judge" },
  { value: "STUDENT" as const, label: "Law student (2L/3L)" },
];

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ATTORNEY" | "JUDGE" | "STUDENT">("ATTORNEY");
  const [loading, setLoading] = useState(false);

  async function onSignup() {
    setLoading(true);
    try {
      const api = createApiClient({ baseUrl: API_URL });
      const res = await api.register({ name, email, password, role });
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      router.replace("/");
    } catch (e) {
      Alert.alert("Sign up failed", e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create account</Text>
      {ROLES.map((r) => (
        <Pressable
          key={r.value}
          onPress={() => setRole(r.value)}
          style={[styles.role, role === r.value && styles.roleActive]}
        >
          <Text style={styles.roleText}>{r.label}</Text>
        </Pressable>
      ))}
      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Password (min 10)"
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.button} onPress={onSignup} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create account</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#f8f7f4" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16, color: "#0f172a" },
  role: {
    borderWidth: 1,
    borderColor: "#e2e0d8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  roleActive: { borderColor: "#1e3a5f", backgroundColor: "#e8eef5" },
  roleText: { color: "#0f172a", fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#e2e0d8",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#1e3a5f",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
