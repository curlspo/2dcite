import { useState } from "react";
import { Pressable, ScrollView, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@2dcite/api-client";
import { isEduEmail, type RegisterBody } from "@2dcite/shared";
import { useAuth } from "../src/lib/auth";
import {
  Button,
  ErrorBox,
  Field,
  Muted,
  Title,
} from "../src/components/ui";
import { colors } from "../src/lib/theme";

const ROLES: { value: RegisterBody["role"]; label: string; hint: string }[] = [
  {
    value: "ATTORNEY",
    label: "Attorney",
    hint: "Bar number required",
  },
  {
    value: "JUDGE",
    label: "Judge",
    hint: "License/bar number required",
  },
  {
    value: "STUDENT",
    label: "Law student (2L/3L)",
    hint: ".edu email required",
  },
];

export default function SignupScreen() {
  const router = useRouter();
  const { api, signIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [role, setRole] = useState<RegisterBody["role"]>("ATTORNEY");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needsBar = role === "ATTORNEY" || role === "JUDGE";
  const needsEdu = role === "STUDENT";

  async function onSignup() {
    setError(null);
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    if (needsEdu && !isEduEmail(email.trim())) {
      setError(
        "Student accounts require a .edu email address from an accredited law school."
      );
      return;
    }
    if (needsBar && !barNumber.trim()) {
      setError(
        "Attorneys and judges must provide a state bar or judicial license number."
      );
      return;
    }
    setLoading(true);
    try {
      const res = await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        ...(needsBar ? { barNumber: barNumber.trim() } : {}),
      });
      await signIn(res.token, res.user);
      router.replace("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
    >
      <Title>Create account</Title>
      <Muted>
        Students need a .edu email. Attorneys and judges must provide a bar
        number. Students complete eligibility uploads on the web.
      </Muted>
      <ErrorBox message={error} />
      {ROLES.map((r) => (
        <Pressable
          key={r.value}
          onPress={() => setRole(r.value)}
          accessibilityRole="radio"
          accessibilityState={{ selected: role === r.value }}
          style={[styles.role, role === r.value && styles.roleActive]}
        >
          <Text style={styles.roleText}>{r.label}</Text>
          <Text style={styles.roleHint}>{r.hint}</Text>
        </Pressable>
      ))}
      <Field label="Full name" value={name} onChangeText={setName} />
      <Field
        label={needsEdu ? "Email (.edu required)" : "Email"}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder={needsEdu ? "you@lawschool.edu" : "you@firm.com"}
      />
      {needsBar ? (
        <Field
          label={
            role === "JUDGE"
              ? "Judicial license / bar number"
              : "State bar number"
          }
          value={barNumber}
          onChangeText={setBarNumber}
          autoCapitalize="characters"
        />
      ) : null}
      <Field
        label="Password (min 10)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Create account" onPress={onSignup} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  role: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    backgroundColor: colors.card,
    minHeight: 48,
    justifyContent: "center",
  },
  roleActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  roleText: { color: colors.ink, fontWeight: "600" },
  roleHint: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
