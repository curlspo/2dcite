/**
 * Input sanitization helpers for user-supplied strings.
 * Zod schemas should transform through these before persistence.
 */

/** Strip null bytes and most C0/C1 control characters (keep tab/newline for long text). */
export function stripControlChars(
  value: string,
  opts: { allowNewlines?: boolean } = {}
): string {
  const allowNl = opts.allowNewlines ?? false;
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    // Null byte always removed
    if (code === 0) continue;
    // Allow tab (9), LF (10), CR (13) when multiline
    if (allowNl && (code === 9 || code === 10 || code === 13)) {
      out += value[i];
      continue;
    }
    // Drop other C0 controls and DEL
    if (code < 32 || code === 127) continue;
    // Drop C1 controls
    if (code >= 128 && code <= 159) continue;
    out += value[i];
  }
  return out;
}

export function sanitizeSingleLine(value: string): string {
  return stripControlChars(value, { allowNewlines: false })
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeMultiline(value: string): string {
  return stripControlChars(value, { allowNewlines: true })
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Cap consecutive blank lines
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function sanitizeEmail(value: string): string {
  return sanitizeSingleLine(value).toLowerCase();
}

/** Soft HTML-ish tag strip (defense in depth; we do not render untrusted HTML). */
export function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

export function sanitizeUserText(
  value: string,
  opts: { multiline?: boolean; stripHtml?: boolean } = {}
): string {
  let v = opts.multiline
    ? sanitizeMultiline(value)
    : sanitizeSingleLine(value);
  if (opts.stripHtml !== false) {
    v = stripHtmlTags(v);
  }
  return v;
}
