import { createHmac } from "crypto";
import { NextRequest } from "next/server";

function secret(): string {
  return process.env.SESSION_SECRET || "visapro-default-secret-replace-in-prod";
}

export function buildAdminToken(email: string): string {
  const exp = Date.now() + 24 * 60 * 60 * 1000; // 24h
  const data = Buffer.from(JSON.stringify({ email, exp })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyAdminToken(token: string): { email: string } | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 1) return null;
    const data = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac("sha256", secret()).update(data).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export function getAdminFromRequest(request: NextRequest): { email: string } | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/visapro_admin=([^;]+)/);
  if (!match) return null;
  return verifyAdminToken(decodeURIComponent(match[1]));
}

export function buildAdminCookie(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  return [
    `visapro_admin=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "Max-Age=86400",
    "SameSite=Strict",
    ...(isProd ? ["Secure"] : []),
  ].join("; ");
}

export function clearAdminCookie(): string {
  return "visapro_admin=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict";
}
