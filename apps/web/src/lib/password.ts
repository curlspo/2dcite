import "server-only";
import bcrypt from "bcryptjs";

/** bcrypt cost factor — OWASP recommends ≥10; 12 balances security vs latency. */
const ROUNDS = 12;

/**
 * Precomputed bcrypt hash used only when the user is missing, so login timing
 * does not trivially distinguish "no such user" from "bad password" (A07).
 * Password material here is not a real account secret.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$lBlj62PC4GmZwRDmIj2/8eLgVTNn1OzHxLMlFHf5S177Cx2UNxnaq";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Always run a bcrypt compare to reduce user-enumeration timing signals. */
export async function verifyPasswordOrDummy(
  password: string,
  hash: string | null | undefined
): Promise<boolean> {
  if (hash) {
    return verifyPassword(password, hash);
  }
  await verifyPassword(password, DUMMY_PASSWORD_HASH);
  return false;
}
