import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";
import { ApiError } from "@2dcite/api-client";
import {
  CLIENT_SUBMIT_ACKNOWLEDGMENTS,
  ClientPlatform,
  DISCLAIMER_COPY_VERSION,
  PRICING_DEFAULTS,
  REVIEW_SCOPE_HELP,
  REVIEW_SCOPE_LABELS,
  ReviewScope,
  computeFeeBreakdown,
} from "@2dcite/shared";
import { useAuth } from "../../src/lib/auth";
import {
  Button,
  ErrorBox,
  Field,
  Muted,
  Subtitle,
  Title,
} from "../../src/components/ui";
import { colors } from "../../src/lib/theme";

export default function NewJobScreen() {
  const { api, user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isRush, setIsRush] = useState(false);
  const [reviewScope, setReviewScope] = useState<
    "EXISTENCE_ONLY" | "PROPOSITION_SUPPORT"
  >("EXISTENCE_ONLY");
  const [acks, setAcks] = useState<Record<string, boolean>>({});
  const [file, setFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  const fees = useMemo(
    () => computeFeeBreakdown({ isRush }),
    [isRush]
  );
  const allAcked = CLIENT_SUBMIT_ACKNOWLEDGMENTS.every((a) => acks[a.id]);

  async function pickPdf() {
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    setFile({
      uri: asset.uri,
      name: asset.name || "document.pdf",
      type: asset.mimeType || "application/pdf",
    });
  }

  async function submit() {
    setError(null);
    if (!file) {
      setError("Select a PDF (full brief/order or table of authorities).");
      return;
    }
    if (!title.trim()) {
      setError("Enter a document title.");
      return;
    }
    if (!allAcked) {
      setError("Accept all acknowledgments to continue.");
      return;
    }
    setLoading(true);
    try {
      const upload = await api.uploadFile(file, "job-pdf");
      const created = await api.createJob({
        title: title.trim(),
        instructions: instructions.trim() || undefined,
        turnaroundTier: isRush ? "RUSH" : "STANDARD_48H",
        reviewScope,
        pdfKey: upload.key,
        acknowledgments: {
          copyVersion: DISCLAIMER_COPY_VERSION,
          acceptedIds: CLIENT_SUBMIT_ACKNOWLEDGMENTS.map((a) => a.id),
          platform: ClientPlatform.IOS,
        },
      });
      const checkout = await api.checkoutJob(created.job.id, {});
      if (checkout.mode === "stripe" && checkout.url) {
        await WebBrowser.openBrowserAsync(checkout.url);
        router.replace(`/jobs/${created.job.id}`);
        return;
      }
      router.replace(`/jobs/${created.job.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
    >
      <Title>New citation review</Title>
      <Muted>
        Upload before or after filing / order issuance. TOA-only is allowed.
        Standard ${PRICING_DEFAULTS.baseFeeCents / 100} · Rush $
        {(PRICING_DEFAULTS.baseFeeCents + PRICING_DEFAULTS.rushFeeCents) / 100}.
      </Muted>
      <ErrorBox message={error} />
      <Field label="Document title" value={title} onChangeText={setTitle} />
      <Field
        label="Instructions (optional)"
        value={instructions}
        onChangeText={setInstructions}
        multiline
        style={{ minHeight: 80, textAlignVertical: "top" }}
      />

      <Subtitle>Review type (required)</Subtitle>
      <Muted>
        Reviewers are anonymous (random number only). Students may not use AI
        to review or write reports.
      </Muted>
      {(
        [ReviewScope.EXISTENCE_ONLY, ReviewScope.PROPOSITION_SUPPORT] as const
      ).map((scope) => (
        <Pressable
          key={scope}
          onPress={() => setReviewScope(scope)}
          accessibilityRole="radio"
          accessibilityState={{ selected: reviewScope === scope }}
          style={[styles.scope, reviewScope === scope && styles.scopeOn]}
        >
          <Text style={styles.scopeTitle}>{REVIEW_SCOPE_LABELS[scope]}</Text>
          <Text style={styles.scopeHelp}>{REVIEW_SCOPE_HELP[scope]}</Text>
        </Pressable>
      ))}

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Rush turnaround</Text>
        <Switch
          value={isRush}
          onValueChange={setIsRush}
          accessibilityLabel="Rush turnaround"
        />
      </View>
      <Muted>
        Total due: ${(fees.grossCents / 100).toFixed(2)} (held until
        certificate)
      </Muted>

      <Button
        title={file ? `PDF: ${file.name}` : "Select PDF"}
        variant="secondary"
        onPress={pickPdf}
      />

      <Subtitle>Acknowledgments</Subtitle>
      {CLIENT_SUBMIT_ACKNOWLEDGMENTS.map((a) => (
        <Pressable
          key={a.id}
          onPress={() =>
            setAcks((prev) => ({ ...prev, [a.id]: !prev[a.id] }))
          }
          style={styles.ack}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!acks[a.id] }}
        >
          <View
            style={[styles.box, acks[a.id] && styles.boxOn]}
            accessibilityElementsHidden
          >
            {acks[a.id] ? <Text style={styles.check}>✓</Text> : null}
          </View>
          <Text style={styles.ackText}>{a.text}</Text>
        </Pressable>
      ))}

      <Button
        title={
          loading
            ? "Processing…"
            : `Pay $${(fees.grossCents / 100).toFixed(2)} & submit`
        }
        onPress={submit}
        loading={loading}
        disabled={!allAcked}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
    minHeight: 48,
  },
  rowLabel: { fontSize: 16, fontWeight: "600", color: colors.ink },
  scope: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.card,
    minHeight: 48,
  },
  scopeOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  scopeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 4,
  },
  scopeHelp: { fontSize: 13, lineHeight: 18, color: colors.muted },
  ack: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
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
});
