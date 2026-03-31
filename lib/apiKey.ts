import { randomBytes, createHash } from "crypto";

/**
 * Generate a new API key in the format: sk_live_[32 random hex chars]
 * Returns both the plain key (shown once to user) and the hashed version (stored in DB).
 */
export function generateApiKey(): { plain: string; hashed: string } {
  const random = randomBytes(24).toString("hex");
  const plain = `sk_live_${random}`;
  const hashed = hashApiKey(plain);
  return { plain, hashed };
}

/**
 * Hash an API key for secure storage and lookup.
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
