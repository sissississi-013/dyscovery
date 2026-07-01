import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

/**
 * Lightweight, signed profile cookie. This is a pragmatic stand-in for full
 * parent authentication (which is a launch requirement): it lets us persist and
 * scope data per family now. The cookie is httpOnly and HMAC-signed so it can't
 * be tampered with client-side.
 */

const COOKIE = "dys_profile";
const SECRET = process.env.PROFILE_COOKIE_SECRET || "dev-secret-change-me";

export type ProfileCookie = { parentId: string; childProfileId: string };

function sign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

export async function setProfileCookie(payload: ProfileCookie): Promise<void> {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const value = `${data}.${sign(data)}`;
  const store = await cookies();
  store.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function readProfileCookie(): Promise<ProfileCookie | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const [data, sig] = raw.split(".");
  if (!data || !sig) return null;
  // Constant-time-ish comparison via crypto.
  const expected = sign(data);
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function clearProfileCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
