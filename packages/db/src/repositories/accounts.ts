import type { Profile } from "@moonlight/types";

import { pool } from "../pool.js";
import { hashPassword, newSessionToken, verifyPassword } from "../password.js";
import { getProfile, saveProfile } from "./profiles.js";

/** How long a session lasts before the candidate has to sign in again. */
const SESSION_DAYS = 7;

/**
 * Registration, sign-in and sessions. Delivery 1 has no LinkedIn import, so
 * this is how a candidate gets into the product: they create the account and
 * fill the profile themselves.
 */

export async function emailTaken(email: string): Promise<boolean> {
  const { rowCount } = await pool.query("SELECT 1 FROM profiles WHERE lower(email) = lower($1)", [
    email,
  ]);
  return (rowCount ?? 0) > 0;
}

/**
 * A new candidate: an empty profile plus the credential to get back to it.
 * Everything except the name and the email is left blank on purpose — the
 * wizard is what fills it, and the completeness bar is what makes that obvious.
 */
export async function registerProfile(profile: Profile, password: string): Promise<Profile> {
  const saved = await saveProfile(profile);
  await pool.query("UPDATE profiles SET password_hash = $2 WHERE id = $1", [
    saved.id,
    await hashPassword(password),
  ]);
  return saved;
}

/** The profile behind an email and password, or null. Never says which was wrong. */
export async function authenticate(email: string, password: string): Promise<Profile | null> {
  const { rows } = await pool.query<{ id: string; password_hash: string | null }>(
    "SELECT id, password_hash FROM profiles WHERE lower(email) = lower($1)",
    [email],
  );
  const row = rows[0];
  if (!row?.password_hash) return null;
  if (!(await verifyPassword(password, row.password_hash))) return null;
  return getProfile(row.id);
}

export async function createSession(profileId: string): Promise<string> {
  const token = newSessionToken();
  await pool.query(
    `INSERT INTO sessions (token, profile_id, expires_at)
     VALUES ($1, $2, now() + ($3 || ' days')::interval)`,
    [token, profileId, String(SESSION_DAYS)],
  );
  return token;
}

/** The signed-in candidate, or null when the token is unknown or expired. */
export async function profileForSession(token: string): Promise<Profile | null> {
  const { rows } = await pool.query<{ profile_id: string }>(
    "SELECT profile_id FROM sessions WHERE token = $1 AND expires_at > now()",
    [token],
  );
  const row = rows[0];
  return row ? getProfile(row.profile_id) : null;
}

export async function deleteSession(token: string): Promise<void> {
  await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
}
