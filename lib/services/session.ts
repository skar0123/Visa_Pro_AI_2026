import { createHmac } from "crypto";
import { NextRequest } from "next/server";

export interface SessionPayload {
  email: string;
  isPaid: boolean;
  visaPreference?: string;
  createdAt: number;
  exp: number;
}

function secret(): string {
  return process.env.SESSION_SECRET || "visapro-default-secret-replace-in-prod";
}

export function createSession(
  email: string,
  isPaid: boolean,
  visaPreference?: string
): string {
  const payload: SessionPayload = {
    email: email.toLowerCase().trim(),
    isPaid,
    visaPreference,
    createdAt: Date.now(),
    exp: Date.now() + (isPaid ? 30 * 864e5 : 7 * 864e5),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  if (!token) return null;
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const data = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac("sha256", secret()).update(data).digest("base64url");
    if (sig !== expected) return null;
    const payload: SessionPayload = JSON.parse(
      Buffer.from(data, "base64url").toString()
    );
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest): SessionPayload | null {
  // Only the HTTP-only cookie is trusted.
  // Authorization header fallback intentionally removed — localStorage tokens
  // must NOT be able to bypass backend access control.
  const cookies = request.headers.get("cookie") || "";
  const cookieMatch = cookies.match(/visapro_session=([^;]+)/);
  if (cookieMatch) {
    const session = verifySession(decodeURIComponent(cookieMatch[1]));
    if (session) return session;
  }
  return null;
}

// Build a Set-Cookie value for a paid/free session
export function buildSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  return [
    `visapro_session=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Strict",
    ...(isProd ? ["Secure"] : []),
  ].join("; ");
}

export function clearSessionCookie(): string {
  return "visapro_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict";
}
