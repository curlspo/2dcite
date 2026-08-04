import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import type { JobDto } from "@2dcite/api-client";
import { ApiError } from "@2dcite/api-client";
import {
  FUNDS_HOLD_COPY,
  REVIEW_SCOPE_LABELS,
  ReviewScope,
} from "@2dcite/shared";
import { useAuth } from "../../src/lib/auth";
import { openCertificatePdf } from "../../src/lib/documents";
import {
  Button,
  Card,
  ErrorBox,
  Muted,
  Screen,
  Subtitle,
  Title,
} from "../../src/components/ui";
import { colors } from "../../src/lib/theme";

function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, user, token } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<JobDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await api.getJob(id);
      setJob(res.job);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load job");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, id]);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setLoading(true);
      load();
    }, [user, load, router])
  );

  async function pay() {
    if (!job) return;
    setPaying(true);
    setError(null);
    setMessage(null);
    try {
      const checkout = await api.checkoutJob(job.id, {});
      if (checkout.mode === "stripe" && checkout.url) {
        await WebBrowser.openBrowserAsync(checkout.url);
        setMessage("Complete payment in the browser, then pull to refresh.");
      } else if (checkout.job) {
        setJob(checkout.job);
        setMessage(checkout.message || "Payment recorded. Funds held until certificate.");
      } else {
        setMessage(checkout.message || "Checkout started.");
      }
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  async function openCertificate() {
    if (!job || !token) {
      setError("Sign in required to open the certificate.");
      return;
    }
    setError(null);
    try {
      await openCertificatePdf(
        job.id,
        token,
        job.certificate?.certNumber || "certificate"
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Certificate not ready. Try again after review completes."
      );
    }
  }

  if (loading && !job) {
    return (
      <Screen style={{ justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (!job) {
    return (
      <Screen>
        <ErrorBox message={error || "Job not found"} />
        <Button title="Back to jobs" onPress={() => router.replace("/jobs")} />
      </Screen>
    );
  }

  const fee =
    job.grossFeeDisplay || `$${(job.grossFeeCents / 100).toFixed(2)}`;
  const findings = Array.isArray(job.review?.findings)
    ? (job.review!.findings as {
        citationText?: string;
        code?: string;
        notes?: string;
      }[])
    : null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      <Title>{job.title}</Title>
      <Muted>
        {job.status} · {job.turnaroundTier} · {fee}
      </Muted>
      <ErrorBox message={error} />
      {message ? (
        <View style={styles.okBox} accessibilityRole="text">
          <Text style={styles.okText}>{message}</Text>
        </View>
      ) : null}

      <Card>
        <Muted>Created: {formatWhen(job.createdAt)}</Muted>
        <Muted>PDF: {job.pdfFileName || "—"}</Muted>
        <Muted>
          Review type:{" "}
          {REVIEW_SCOPE_LABELS[
            (job.reviewScope as keyof typeof REVIEW_SCOPE_LABELS) ||
              ReviewScope.EXISTENCE_ONLY
          ] ?? job.reviewScope ?? "—"}
        </Muted>
        <Muted>
          Payment: {job.payment?.status || "—"}
          {job.payment?.paidAt ? ` · ${formatWhen(job.payment.paidAt)}` : ""}
        </Muted>
        <Muted>
          Student payout:{" "}
          {job.payout
            ? `${job.payout.status} · $${(job.payout.studentAmountCents / 100).toFixed(2)}`
            : "Not held yet (pay first)"}
        </Muted>
        {job.studentAssigned && !job.student ? (
          <Muted>
            Reviewer number:{" "}
            <Text style={{ fontWeight: "700", color: colors.ink }}>
              {job.reviewerCode || "Assigned"}
            </Text>
            {"\n"}
            Identity withheld under blind matching — certificate shows this
            number only.
          </Muted>
        ) : null}
        {job.student ? (
          <Muted>Assigned to you ({job.status})</Muted>
        ) : null}
        {job.instructions ? (
          <>
            <Subtitle>Instructions</Subtitle>
            <Muted>{job.instructions}</Muted>
          </>
        ) : null}
      </Card>

      <Card>
        <Muted>{FUNDS_HOLD_COPY.clientPayOnUpload}</Muted>
        <Muted>{FUNDS_HOLD_COPY.releaseOnCertificate}</Muted>
      </Card>

      {job.status === "AWAITING_PAYMENT" && (
        <Button
          title={paying ? "Opening checkout…" : `Pay ${fee}`}
          onPress={pay}
          loading={paying}
        />
      )}

      {job.certificate && (
        <Card>
          <Subtitle>Certificate of Citation Review</Subtitle>
          <Muted>
            {job.certificate.certNumber} · issued{" "}
            {formatWhen(job.certificate.issuedAt)}
            {job.reviewerCode ? ` · Reviewer ${job.reviewerCode}` : ""}
          </Muted>
          {job.payout && (
            <Muted>
              Student payout: {job.payout.status}
              {job.payout.releasedAt
                ? ` · ${formatWhen(job.payout.releasedAt)}`
                : ""}
            </Muted>
          )}
          <Button
            title="Open certificate (web)"
            onPress={openCertificate}
          />
          <Muted>
            May be filed with the document or retained as evidence of best
            efforts. Liability remains with the licensed attorney or judge.
          </Muted>
        </Card>
      )}

      {job.review && (
        <Card>
          <Subtitle>Review findings</Subtitle>
          <Muted>
            Submitted {formatWhen(job.review.submittedAt)} · independent
            verification only — not legal advice
          </Muted>
          {findings?.map((f, i) => (
            <View key={i} style={styles.finding}>
              <Text style={styles.findingTitle}>
                {f.code || "Finding"}
                {f.citationText ? ` · ${f.citationText}` : ""}
              </Text>
              {f.notes ? <Muted>{f.notes}</Muted> : null}
            </View>
          ))}
          {job.review.overallNotes ? (
            <Muted>{job.review.overallNotes}</Muted>
          ) : null}
        </Card>
      )}

      <Button
        title="All jobs"
        variant="secondary"
        onPress={() => router.push("/jobs")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  okBox: {
    backgroundColor: colors.greenBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  okText: { color: colors.greenText, fontSize: 14 },
  finding: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 10,
  },
  findingTitle: {
    fontWeight: "600",
    color: colors.ink,
    fontSize: 14,
    marginBottom: 4,
  },
});
