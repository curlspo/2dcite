import { useState } from "react";
import { Pressable, ScrollView, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@2dcite/api-client";
import { isEduEmail, US_STATES, type RegisterBody } from "@2dcite/shared";
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
    hint: "State + bar number required",
  },
  {
    value: "JUDGE",
    label: "Judge",
    hint: "State + license/bar number required",
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
  const [barState, setBarState] = useState("");
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
    if (needsBar && !barState) {
      setError(
        "Select the state where your bar or judicial license is issued."
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
        ...(needsBar
          ? { barState, barNumber: barNumber.trim() }
          : {}),
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
        <>
          <Text style={styles.sectionLabel}>
            {role === "JUDGE"
              ? "Judicial license jurisdiction"
              : "Bar jurisdiction"}
          </Text>
          <Muted>
            Bar numbers are state-specific. Select the issuing state, then
            enter your number.
          </Muted>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.stateScroll}
            contentContainerStyle={styles.stateRow}
          >
            {US_STATES.map((s) => (
              <Pressable
                key={s.code}
                onPress={() => setBarState(s.code)}
                accessibilityRole="button"
                accessibilityState={{ selected: barState === s.code }}
                accessibilityLabel={`${s.code} ${s.name}`}
                style={[
                  styles.stateChip,
                  barState === s.code && styles.stateChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.stateChipText,
                    barState === s.code && styles.stateChipTextActive,
                  ]}
                >
                  {s.code}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {barState ? (
            <Muted>
              Selected:{" "}
              {US_STATES.find((s) => s.code === barState)?.name ?? barState} (
              {barState})
            </Muted>
          ) : null}
          <Field
            label={
              role === "JUDGE" ? "License / bar number" : "Bar number"
            }
            value={barNumber}
            onChangeText={setBarNumber}
            autoCapitalize="characters"
          />
        </>
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
  sectionLabel: {
    color: colors.ink,
    fontWeight: "600",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  stateScroll: { maxHeight: 52, marginVertical: 8 },
  stateRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  stateChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    minWidth: 48,
    alignItems: "center",
  },
  stateChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  stateChipText: { color: colors.ink, fontWeight: "600", fontSize: 13 },
  stateChipTextActive: { color: colors.accent },
});
