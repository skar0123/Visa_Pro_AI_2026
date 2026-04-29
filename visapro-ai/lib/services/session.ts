import { createHmac } from "crypto";

export interface SessionPayload {
  email: string;
  isPaid: boolean;
  createdAt: number;
  exp: number;
}

function getSecret(): string {
  return process.env.SESSION_SECRET || "";
}

export function createSession(email: string, isPaid: boolean): string {
  const secret = getSecret();
  if (!secret) throw new Error("SESSION_SECRET is not configured");

  const payload: SessionPayload = {
    email: email.toLowerCase().trim(),
    isPaid,
    createdAt: Date.now(),
    exp: Date.now() + (isPaid ? 30 * 864e5 : 7 * 864e5),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  const secret = getSecret();
  if (!secret || !token) return null;
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 1) return null;
    const data = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac("sha256", secret).update(data).digest("base64url");
    if (sig !== expected) return null;
    const payload: SessionPayload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromCookie(request: { headers: { get(name: string): string | null } }): SessionPayload | null {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(/visapro_session=([^;]+)/);
  if (!match) return null;
  return verifySession(decodeURIComponent(match[1]));
}

export function buildSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = 30 * 24 * 60 * 60;
  return [
    `visapro_session=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Strict",
    ...(isProd ? ["Secure"] : []),
  ].join("; ");
}
