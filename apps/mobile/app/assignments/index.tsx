import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import type { JobDto } from "@2dcite/api-client";
import { ApiError } from "@2dcite/api-client";
import { useAuth } from "../../src/lib/auth";
import {
  ErrorBox,
  Muted,
  Screen,
  Title,
} from "../../src/components/ui";
import { colors } from "../../src/lib/theme";

type ListItem =
  | { kind: "header"; title: string; id: string }
  | { kind: "job"; job: JobDto; id: string };

export default function AssignmentsScreen() {
  const { api, user } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<JobDto[]>([]);
  const [history, setHistory] = useState<JobDto[]>([]);
  const [gateMessage, setGateMessage] = useState<string | null>(null);
  const [eligible, setEligible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.listAssignments();
      setActive(res.active);
      setHistory(res.history);
      setEligible(res.eligibleForMatching);
      setGateMessage(res.gateMessage);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Failed to load assignments"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        router.replace("/login");
        return;
      }
      if (user.role !== "STUDENT") {
        router.replace("/");
        return;
      }
      load();
    }, [user, load, router])
  );

  const data: ListItem[] = [];
  if (active.length) {
    data.push({ kind: "header", title: "Active", id: "h-active" });
    active.forEach((j) => data.push({ kind: "job", job: j, id: j.id }));
  }
  if (history.length) {
    data.push({ kind: "header", title: "History", id: "h-history" });
    history.forEach((j) =>
      data.push({ kind: "job", job: j, id: `h-${j.id}` })
    );
  }

  if (loading) {
    return (
      <Screen style={{ justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ padding: 20, paddingBottom: 8 }}>
        <Title>Assignments</Title>
        <ErrorBox message={error} />
        {!eligible && gateMessage ? <Muted>{gateMessage}</Muted> : null}
        {eligible ? (
          <Muted>
            One assignment at a time. Accept promptly or the job requeues.
          </Muted>
        ) : null}
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 20 }}>
            <Muted>
              {eligible
                ? "No assignments yet. New paid jobs will appear here when matched."
                : "Complete eligibility on the web and wait for admin approval."}
            </Muted>
          </View>
        }
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        renderItem={({ item }) => {
          if (item.kind === "header") {
            return (
              <Text
                style={{
                  fontWeight: "700",
                  color: colors.ink,
                  fontSize: 14,
                  marginBottom: 8,
                  marginTop: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {item.title}
              </Text>
            );
          }
          const j = item.job;
          return (
            <Pressable
              onPress={() => router.push(`/assignments/${j.id}`)}
              accessibilityRole="button"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                marginBottom: 10,
              }}
            >
              <Text
                style={{ fontWeight: "600", color: colors.ink, fontSize: 16 }}
              >
                {j.title}
              </Text>
              <Text style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}>
                {j.status} · {j.turnaroundTier}
                {j.dueAt
                  ? ` · due ${new Date(j.dueAt).toLocaleString()}`
                  : ""}
              </Text>
              {j.payout ? (
                <Text style={{ color: colors.gold, marginTop: 4, fontSize: 12 }}>
                  Your share: ${(j.payout.studentAmountCents / 100).toFixed(2)} ·{" "}
                  {j.payout.status}
                </Text>
              ) : null}
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
