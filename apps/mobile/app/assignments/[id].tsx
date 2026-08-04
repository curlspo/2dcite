import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import type { JobDto } from "@2dcite/api-client";
import { ApiError } from "@2dcite/api-client";
import {
  CitationFindingCode,
  ClientPlatform,
  DISCLAIMER_COPY_VERSION,
  REVIEW_SCOPE_LABELS,
  ReviewScope,
  STUDENT_NO_AI_ATTESTATION,
  STUDENT_NO_AI_POLICY,
  STUDENT_REVIEW_ATTESTATION,
  type CitationFindingCode as FindingCode,
} from "@2dcite/shared";
import { useAuth } from "../../src/lib/auth";
import { openJobDocument } from "../../src/lib/documents";
import {
  Button,
  Card,
  ErrorBox,
  Field,
  Muted,
  Screen,
  Subtitle,
  Title,
} from "../../src/components/ui";
import { colors } from "../../src/lib/theme";

type Finding = {
  citationText: string;
  code: string;
  notes: string;
};

const EXISTENCE_CODES = [
  {
    value: CitationFindingCode.ACCURATE,
    label: "Authority exists / correctly identified",
  },
  {
    value: CitationFindingCode.NEEDS_ATTENTION,
    label: "Existence unclear — needs attention",
  },
  {
    value: CitationFindingCode.DOES_NOT_SUPPORT,
    label: "Authority not found / does not appear to exist as cited",
  },
  {
    value: CitationFindingCode.FORMAT_ISSUE,
    label: "Format / citation form issue",
  },
];

const PROPOSITION_CODES = [
  {
    value: CitationFindingCode.ACCURATE,
    label: "Accurate / supports proposition",
  },
  { value: CitationFindingCode.NEEDS_ATTENTION, label: "Needs attention" },
  {
    value: CitationFindingCode.DOES_NOT_SUPPORT,
    label: "Does not support proposition",
  },
  { value: CitationFindingCode.FORMAT_ISSUE, label: "Format issue" },
];

function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, user, token } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<JobDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [findings, setFindings] = useState<Finding[]>([
    { citationText: "", code: CitationFindingCode.ACCURATE, notes: "" },
  ]);
  const [overallNotes, setOverallNotes] = useState("");
  const [attested, setAttested] = useState(false);
  const [noAi, setNoAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const res = await api.getJob(id);
      setJob(res.job);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load assignment");
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
      if (user.role !== "STUDENT") {
        router.replace("/");
        return;
      }
      setLoading(true);
      load();
    }, [user, load, router])
  );

  async function accept() {
    if (!job) return;
    setActing(true);
    setError(null);
    try {
      const res = await api.acceptJob(job.id);
      setJob(res.job);
      setMessage("Assignment accepted. Complete the review before the due time.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Accept failed");
    } finally {
      setActing(false);
    }
  }

  function decline() {
    if (!job) return;
    Alert.alert(
      "Decline assignment?",
      "This job will return to the matching queue.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            setActing(true);
            setError(null);
            try {
              await api.declineJob(job.id);
              router.replace("/assignments");
            } catch (e) {
              setError(e instanceof ApiError ? e.message : "Decline failed");
            } finally {
              setActing(false);
            }
          },
        },
      ]
    );
  }

  async function openDocument() {
    if (!job || !token) {
      setError("Sign in required to open the document.");
      return;
    }
    setError(null);
    try {
      await openJobDocument(job.id, token, job.pdfFileName || "document.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open document.");
    }
  }

  function updateFinding(i: number, patch: Partial<Finding>) {
    setFindings((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f))
    );
  }

  async function submitReview() {
    if (!job) return;
    setError(null);
    setMessage(null);
    if (!attested) {
      setError("You must accept the general attestation.");
      return;
    }
    if (!noAi) {
      setError(
        "You must confirm you did not use generative AI for this review or report."
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitReview(job.id, {
        findings: findings.map((f) => ({
          citationText: f.citationText || undefined,
          code: f.code as FindingCode,
          notes: f.notes || undefined,
        })),
        overallNotes: overallNotes || undefined,
        attestationAccepted: true as const,
        noAiAttestationAccepted: true as const,
        disclaimerCopyVersion: DISCLAIMER_COPY_VERSION,
        platform: ClientPlatform.IOS,
      });
      setMessage(
        res.certificate
          ? `${res.message} Certificate ${res.certificate.certNumber}.`
          : res.message
      );
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
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
        <ErrorBox message={error || "Assignment not found"} />
        <Button
          title="Back"
          onPress={() => router.replace("/assignments")}
        />
      </Screen>
    );
  }

  const submittedFindings = Array.isArray(job.review?.findings)
    ? (job.review!.findings as {
        citationText?: string;
        code?: string;
        notes?: string;
      }[])
    : null;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
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
        {job.status} · {job.turnaroundTier}
        {job.dueAt ? ` · due ${formatWhen(job.dueAt)}` : ""}
        {job.reviewerCode ? ` · Your code: ${job.reviewerCode}` : ""}
      </Muted>
      <ErrorBox message={error} />
      {message ? (
        <View style={styles.okBox}>
          <Text style={styles.okText}>{message}</Text>
        </View>
      ) : null}

      <Card>
        <Subtitle>Requested review type</Subtitle>
        <Muted>
          {REVIEW_SCOPE_LABELS[
            (job.reviewScope as keyof typeof REVIEW_SCOPE_LABELS) ||
              ReviewScope.EXISTENCE_ONLY
          ] ?? job.reviewScope ?? ReviewScope.EXISTENCE_ONLY}
        </Muted>
        <Muted>{STUDENT_NO_AI_POLICY}</Muted>
      </Card>

      {job.instructions ? (
        <Card>
          <Subtitle>Client instructions</Subtitle>
          <Muted>{job.instructions}</Muted>
        </Card>
      ) : null}

      <Card>
        <Muted>
          {job.pdfFileName || "document.pdf"} — confidential; for review only.
        </Muted>
        <Button
          title="Open PDF document"
          variant="secondary"
          onPress={openDocument}
        />
      </Card>

      {job.status === "ASSIGNED" && (
        <Card>
          <Subtitle>Respond to assignment</Subtitle>
          <Muted>
            Accept within the time window or the job will requeue automatically.
          </Muted>
          <Button
            title="Accept assignment"
            onPress={accept}
            loading={acting}
          />
          <Button
            title="Decline assignment"
            variant="danger"
            onPress={decline}
            loading={acting}
          />
        </Card>
      )}

      {job.status === "IN_REVIEW" && !job.review && (
        <View>
          <Subtitle>Citation findings</Subtitle>
          <Muted>
            Record findings for each citation or issue area. Independent
            verification only — not legal advice. Do not use generative AI.
          </Muted>
          {job.reviewScope !== ReviewScope.PROPOSITION_SUPPORT ? (
            <Muted>
              Scope is existence only — do not evaluate whether authorities
              support legal propositions.
            </Muted>
          ) : null}

          {findings.map((f, i) => {
            const codes =
              job.reviewScope === ReviewScope.PROPOSITION_SUPPORT
                ? PROPOSITION_CODES
                : EXISTENCE_CODES;
            return (
              <Card key={i}>
                <Field
                  label="Citation / pin cite (optional)"
                  value={f.citationText}
                  onChangeText={(t) => updateFinding(i, { citationText: t })}
                  placeholder="e.g. Smith v. Jones, 123 U.S. 45 (2020)"
                />
                <Muted>Finding code</Muted>
                {codes.map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => updateFinding(i, { code: c.value })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: f.code === c.value }}
                    style={[
                      styles.code,
                      f.code === c.value && styles.codeOn,
                    ]}
                  >
                    <Text style={styles.codeText}>{c.label}</Text>
                  </Pressable>
                ))}
                <Field
                  label="Notes (informational only)"
                  value={f.notes}
                  onChangeText={(t) => updateFinding(i, { notes: t })}
                  multiline
                  style={{ minHeight: 64, textAlignVertical: "top" }}
                />
                {findings.length > 1 && (
                  <Button
                    title="Remove finding"
                    variant="secondary"
                    onPress={() =>
                      setFindings((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                  />
                )}
              </Card>
            );
          })}

          <Button
            title="+ Add finding"
            variant="secondary"
            onPress={() =>
              setFindings((prev) => [
                ...prev,
                {
                  citationText: "",
                  code: CitationFindingCode.ACCURATE,
                  notes: "",
                },
              ])
            }
          />

          <Field
            label="Overall notes (optional)"
            value={overallNotes}
            onChangeText={setOverallNotes}
            multiline
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />

          <Pressable
            onPress={() => setAttested((a) => !a)}
            style={styles.ack}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: attested }}
          >
            <View style={[styles.box, attested && styles.boxOn]}>
              {attested ? <Text style={styles.check}>✓</Text> : null}
            </View>
            <Text style={styles.ackText}>
              <Text style={{ fontWeight: "700", color: colors.ink }}>
                Required attestation{"\n"}
              </Text>
              {STUDENT_REVIEW_ATTESTATION}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setNoAi((a) => !a)}
            style={styles.ack}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: noAi }}
          >
            <View style={[styles.box, noAi && styles.boxOn]}>
              {noAi ? <Text style={styles.check}>✓</Text> : null}
            </View>
            <Text style={styles.ackText}>
              <Text style={{ fontWeight: "700", color: colors.ink }}>
                No generative AI (required){"\n"}
              </Text>
              {STUDENT_NO_AI_ATTESTATION}
            </Text>
          </Pressable>

          <Button
            title={submitting ? "Submitting…" : "Submit review"}
            onPress={submitReview}
            loading={submitting}
            disabled={!attested || !noAi}
          />
        </View>
      )}

      {job.review && (
        <Card>
          <Subtitle>Submitted review</Subtitle>
          <Muted>{formatWhen(job.review.submittedAt)}</Muted>
          {submittedFindings?.map((f, i) => (
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

      {(job.status === "COMPLETED" || job.status === "CERTIFIED") && (
        <Card>
          <Subtitle>
            {job.status === "CERTIFIED"
              ? "Certificate issued"
              : "Review complete"}
          </Subtitle>
          {job.certificate ? (
            <Muted>
              {job.certificate.certNumber} ·{" "}
              {formatWhen(job.certificate.issuedAt)}
            </Muted>
          ) : null}
          {job.payout ? (
            <Muted>
              Your share: payout status {job.payout.status}
              {job.payout.studentAmountCents != null
                ? ` · $${(job.payout.studentAmountCents / 100).toFixed(2)}`
                : ""}
            </Muted>
          ) : null}
        </Card>
      )}

      <Button
        title="All assignments"
        variant="secondary"
        onPress={() => router.push("/assignments")}
      />
      <View style={{ height: 32 }} />
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
  code: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    backgroundColor: colors.card,
    minHeight: 44,
    justifyContent: "center",
  },
  codeOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  codeText: { color: colors.ink, fontSize: 14 },
  ack: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 16,
    alignItems: "flex-start",
  },
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  boxOn: { backgroundColor: colors.accent },
  check: { color: colors.white, fontWeight: "700", fontSize: 14 },
  ackText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.muted },
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
