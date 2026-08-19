import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing. It lives here rather than in packages/core because it needs
 * randomness and CPU work, and core is pure by rule.
 *
 * scrypt from node:crypto, so the repository takes no dependency to store a
 * password safely. Format: scrypt$<salt hex>$<key hex>. The salt is per
 * password, so two candidates who pick the same one do not share a hash.
 */

const derive = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

/**
 * Compared with timingSafeEqual so a wrong password cannot be narrowed down by
 * how long the answer took. Anything malformed is a failed check, never a throw.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;

  const actual = await derive(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  return timingSafeEqual(actual, expected);
}

/** A session token the caller cannot guess. 32 bytes of entropy, url-safe. */
export const newSessionToken = (): string => randomBytes(32).toString("base64url");
