import { SignJWT, jwtVerify } from "jose";
import { appSecret } from "./env";

export const SESSION_COOKIE = "cockpit_session";
export const SESSION_DAYS = 30;

function key() {
  return new TextEncoder().encode(appSecret());
}

export async function signSession(userId: number): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return typeof payload.uid === "number" ? payload.uid : null;
  } catch {
    return null;
  }
}

/** Kurzlebige, signierte Werte (z. B. OAuth-State) */
export async function signValue(data: Record<string, unknown>, ttl = "15m"): Promise<string> {
  return new SignJWT(data).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(ttl).sign(key());
}

export async function verifyValue<T extends Record<string, unknown>>(token: string | null | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload as T;
  } catch {
    return null;
  }
}
