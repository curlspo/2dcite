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
  Button,
  ErrorBox,
  Muted,
  Screen,
  Title,
} from "../../src/components/ui";
import { colors } from "../../src/lib/theme";

export default function JobsScreen() {
  const { api, user } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.listJobs();
      setJobs(res.jobs);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load jobs");
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
      load();
    }, [user, load, router])
  );

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
        <Title>Jobs</Title>
        <ErrorBox message={error} />
        <Button title="New review" onPress={() => router.push("/jobs/new")} />
      </View>
      <FlatList
        data={jobs}
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
          <Muted>No jobs yet. Submit a document for citation review.</Muted>
        }
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/jobs/${item.id}`)}
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
            <Text style={{ fontWeight: "600", color: colors.ink, fontSize: 16 }}>
              {item.title}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}>
              {item.status} · {item.turnaroundTier} ·{" "}
              {item.grossFeeDisplay || `$${(item.grossFeeCents / 100).toFixed(0)}`}
            </Text>
            {item.payout && (
              <Text style={{ color: colors.gold, marginTop: 4, fontSize: 12 }}>
                Payout {item.payout.status}
              </Text>
            )}
          </Pressable>
        )}
      />
    </Screen>
  );
}
