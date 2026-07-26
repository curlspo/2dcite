import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  LIABILITY_CORE,
  CONFIDENTIALITY_CORE,
  POST_FILING_CORE,
  PRICING_DEFAULTS,
} from "@2dcite/shared";
import { useAuth } from "../src/lib/auth";
import {
  Button,
  Card,
  DisclaimerFooter,
  Muted,
  Screen,
  Subtitle,
  Title,
} from "../src/components/ui";
import { colors } from "../src/lib/theme";

function usd(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { ready, user, signOut, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (ready && user) refreshUser().catch(() => {});
    }, [ready, user, refreshUser])
  );

  if (!ready) {
    return (
      <Screen style={{ justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </Screen>
    );
  }

  if (!user) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: colors.background, flexGrow: 1 }}>
        <Title>2dcite</Title>
        <Muted>
          Independent citation verification for attorneys and judges. Human
          review by qualified 2L/3L law students.
        </Muted>
        <Card>
          <Subtitle>Pricing</Subtitle>
          <Muted>
            Standard {usd(PRICING_DEFAULTS.baseFeeCents)} · Rush{" "}
            {usd(PRICING_DEFAULTS.baseFeeCents + PRICING_DEFAULTS.rushFeeCents)}
          </Muted>
        </Card>
        <Card>
          <Subtitle>Important</Subtitle>
          <Muted>{LIABILITY_CORE.ultimateLiability}</Muted>
          <Muted>{POST_FILING_CORE.postFilingAndPostIssuanceOk}</Muted>
          <Muted>{CONFIDENTIALITY_CORE.limitedSubmissionToa}</Muted>
        </Card>
        <Button title="Sign in" onPress={() => router.push("/login")} />
        <Button
          title="Create account"
          variant="secondary"
          onPress={() => router.push("/signup")}
        />
        <Button
          title="Legal notices"
          variant="secondary"
          onPress={() => router.push("/legal")}
        />
        <DisclaimerFooter />
      </ScrollView>
    );
  }

  const isStudent = user.role === "STUDENT";
  const isClient = user.role === "ATTORNEY" || user.role === "JUDGE";

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, backgroundColor: colors.background, flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await refreshUser();
            setRefreshing(false);
          }}
        />
      }
    >
      <Title>Hello, {user.name}</Title>
      <Muted>
        {user.role}
        {isStudent && user.studentStatus
          ? ` · status: ${user.studentStatus}`
          : ""}
      </Muted>

      {isClient && (
        <Card>
          <Subtitle>Citation reviews</Subtitle>
          <Muted>
            Submit a brief, order, or table of authorities. Funds are held until
            the certificate is issued.
          </Muted>
          <Button title="New review" onPress={() => router.push("/jobs/new")} />
          <Button
            title="My jobs"
            variant="secondary"
            onPress={() => router.push("/jobs")}
          />
        </Card>
      )}

      {isStudent && (
        <Card>
          <Subtitle>Assignments</Subtitle>
          {user.studentStatus !== "APPROVED" ? (
            <Muted>
              Complete eligibility on the web (document uploads) and wait for
              admin approval before receiving jobs. Status:{" "}
              {user.studentStatus || "PENDING"}.
            </Muted>
          ) : (
            <Muted>
              You are approved. Accept one assignment at a time. Findings stay
              confidential.
            </Muted>
          )}
          <Button
            title="Open assignments"
            onPress={() => router.push("/assignments")}
          />
        </Card>
      )}

      {user.role === "ADMIN" && (
        <Card>
          <Subtitle>Admin</Subtitle>
          <Muted>
            Admin tools are available on the web at 2dcite.com/admin.
          </Muted>
        </Card>
      )}

      <Button
        title="Legal notices"
        variant="secondary"
        onPress={() => router.push("/legal")}
      />
      <Button title="Sign out" variant="secondary" onPress={signOut} />
      <DisclaimerFooter />
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
