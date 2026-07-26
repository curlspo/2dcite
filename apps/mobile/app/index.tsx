import { Text, View, StyleSheet, ScrollView } from "react-native";
import {
  LIABILITY_FOOTER,
  FUNDS_HOLD_COPY,
  DISCLAIMER_COPY_VERSION,
} from "@2dcite/shared";

/**
 * Phase 0 mobile shell — iOS App Store app will share @2dcite/api-client
 * and the same /api/v1 contract as web. Auth + jobs land in later phases.
 */
export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand}>2dcite</Text>
      <Text style={styles.headline}>
        Independent citation review for attorneys and judges
      </Text>
      <Text style={styles.body}>
        This iOS app will use the same accounts and API as 2dcite.com: submit
        jobs, complete student reviews, download certificates, and receive push
        notifications when assignments or certificates are ready.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Funds</Text>
        <Text style={styles.cardBody}>{FUNDS_HOLD_COPY.clientPayOnUpload}</Text>
        <Text style={[styles.cardBody, styles.mt]}>{FUNDS_HOLD_COPY.releaseOnCertificate}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status</Text>
        <Text style={styles.cardBody}>
          Phase 0 shell. Sign-in and role-based navigation ship in Phase 1.
        </Text>
      </View>
      <Text style={styles.footer}>{LIABILITY_FOOTER}</Text>
      <Text style={styles.version}>Disclaimer copy {DISCLAIMER_COPY_VERSION}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  headline: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a2332",
    lineHeight: 28,
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5b6575",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e0d8",
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#5b6575",
  },
  mt: {
    marginTop: 8,
  },
  footer: {
    marginTop: 16,
    fontSize: 11,
    lineHeight: 16,
    color: "#5b6575",
  },
  version: {
    marginTop: 8,
    fontSize: 10,
    color: "#9aa3b2",
  },
});
