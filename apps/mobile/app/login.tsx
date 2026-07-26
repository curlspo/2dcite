import { useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@2dcite/api-client";
import { useAuth } from "../src/lib/auth";
import {
  Button,
  ErrorBox,
  Field,
  Muted,
  Title,
} from "../src/components/ui";
import { colors } from "../src/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { api, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: email.trim(), password });
      await signIn(res.token, res.user);
      router.replace("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
    >
      <Title>Sign in</Title>
      <Muted>Same account as 2dcite.com</Muted>
      <ErrorBox message={error} />
      <Field
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <Field
        label="Password"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Sign in" onPress={onLogin} loading={loading} />
      <Button
        title="Create account"
        variant="secondary"
        onPress={() => router.push("/signup")}
      />
    </ScrollView>
  );
}
