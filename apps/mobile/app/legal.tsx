import { ScrollView } from "react-native";
import {
  LIABILITY_CORE,
  CONFIDENTIALITY_CORE,
  POST_FILING_CORE,
  FUNDS_HOLD_COPY,
  DISCLAIMER_COPY_VERSION,
} from "@2dcite/shared";
import { Card, Muted, Subtitle, Title } from "../src/components/ui";
import { colors } from "../src/lib/theme";

export default function LegalScreen() {
  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, backgroundColor: colors.background }}
    >
      <Title>Legal notices</Title>
      <Muted>Copy version {DISCLAIMER_COPY_VERSION}</Muted>

      <Card>
        <Subtitle>Liability</Subtitle>
        <Muted>{LIABILITY_CORE.ultimateLiability}</Muted>
        <Muted>{LIABILITY_CORE.nonDelegableDuty}</Muted>
        <Muted>{LIABILITY_CORE.noPlatformResponsibility}</Muted>
        <Muted>{LIABILITY_CORE.notLegalAdvice}</Muted>
      </Card>

      <Card>
        <Subtitle>Confidentiality</Subtitle>
        <Muted>{CONFIDENTIALITY_CORE.noResponsibilityForConfidential}</Muted>
        <Muted>{CONFIDENTIALITY_CORE.limitedSubmissionToa}</Muted>
        <Muted>{CONFIDENTIALITY_CORE.studentConfidentiality}</Muted>
        <Muted>{CONFIDENTIALITY_CORE.noDisclosureOfFailedCitations}</Muted>
      </Card>

      <Card>
        <Subtitle>Post-filing / post-issuance</Subtitle>
        <Muted>{POST_FILING_CORE.postFilingAndPostIssuanceOk}</Muted>
        <Muted>{POST_FILING_CORE.opportunityToCorrectOrWithdraw}</Muted>
        <Muted>{POST_FILING_CORE.noDutyToCorrect}</Muted>
      </Card>

      <Card>
        <Subtitle>Payments</Subtitle>
        <Muted>{FUNDS_HOLD_COPY.clientPayOnUpload}</Muted>
        <Muted>{FUNDS_HOLD_COPY.releaseOnCertificate}</Muted>
      </Card>
    </ScrollView>
  );
}
