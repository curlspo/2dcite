import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getApiBaseUrl } from "./config";

/**
 * Download a job PDF with bearer auth and open the share sheet
 * (iOS cannot attach Authorization when opening a URL in Safari).
 */
export async function openJobDocument(
  jobId: string,
  token: string,
  fileName = "document.pdf"
): Promise<void> {
  const safeName = fileName.replace(/[^\w.\-]+/g, "_") || "document.pdf";
  const url = `${getApiBaseUrl()}/jobs/${jobId}/document`;
  const base = FileSystem.cacheDirectory;
  if (!base) throw new Error("File cache is not available on this device.");
  const dest = `${base}${jobId}-${safeName}`;

  const result = await FileSystem.downloadAsync(url, dest, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error("Could not download document (check sign-in and access).");
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: "Open confidential review PDF",
    });
  } else {
    throw new Error("Sharing is not available on this device.");
  }
}

export async function openCertificatePdf(
  jobId: string,
  token: string,
  certNumber = "certificate"
): Promise<void> {
  const safe = certNumber.replace(/[^\w.\-]+/g, "_");
  const url = `${getApiBaseUrl()}/jobs/${jobId}/certificate?download=1`;
  const base = FileSystem.cacheDirectory;
  if (!base) throw new Error("File cache is not available on this device.");
  const dest = `${base}${safe}.pdf`;

  const result = await FileSystem.downloadAsync(url, dest, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error("Certificate not available yet.");
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: "Certificate of Citation Review",
    });
  } else {
    throw new Error("Sharing is not available on this device.");
  }
}
