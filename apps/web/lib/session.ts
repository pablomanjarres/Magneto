import { cookies } from "next/headers";
import type { Profile } from "@moonlight/types";
import { profileForSession } from "@moonlight/db";

/**
 * Who is signed in. One place knows the cookie's name and shape, so swapping
 * the mechanism later touches this file and nothing else.
 *
 * The cookie holds an opaque token, never a profile id: an id in a cookie is
 * a guess away from reading someone else's profile.
 */
export const SESSION_COOKIE = "moonlight_session";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
} as const;

export async function currentProfile(): Promise<Profile | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? profileForSession(token) : null;
}

export async function currentToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** A Set-Cookie value. Small enough not to be worth a dependency. */
export function sessionCookie(value: string, maxAge = SESSION_COOKIE_OPTIONS.maxAge): string {
  return [
    `${SESSION_COOKIE}=${value}`,
    `Path=${SESSION_COOKIE_OPTIONS.path}`,
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
    "HttpOnly",
  ].join("; ");
}

/** The same cookie, already expired. */
export const clearedSessionCookie = (): string => sessionCookie("", 0);
