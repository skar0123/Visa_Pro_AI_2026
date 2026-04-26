import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

export interface User {
  id: string;
  email: string;
  plan: "free" | "premium";
  usage_count: number;
  created_at: string;
  upgraded_at?: string;
}

export const FREE_USAGE_LIMIT = 3;

const DATA_DIR =
  process.env.LEADS_DATA_DIR ||
  (process.env.NODE_ENV === "production" ? "/tmp" : join(process.cwd(), "data"));

const USERS_FILE = join(DATA_DIR, "visapro_users.json");

// Module-scoped in-memory cache
let cache: Map<string, User> | null = null;

function ensureDir(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

function load(): Map<string, User> {
  if (cache) return cache;
  cache = new Map();
  ensureDir();
  try {
    if (existsSync(USERS_FILE)) {
      const arr: User[] = JSON.parse(readFileSync(USERS_FILE, "utf8"));
      for (const u of arr) {
        if (u.email) cache.set(u.email.toLowerCase(), u);
      }
    }
  } catch {}
  return cache;
}

function persist(): void {
  try {
    ensureDir();
    writeFileSync(
      USERS_FILE,
      JSON.stringify([...load().values()], null, 2),
      "utf8"
    );
  } catch {}
}

export function getOrCreateUser(email: string): User {
  const key = email.toLowerCase().trim();
  const users = load();
  if (users.has(key)) return users.get(key)!;

  const user: User = {
    id: randomUUID(),
    email: key,
    plan: "free",
    usage_count: 0,
    created_at: new Date().toISOString(),
  };
  users.set(key, user);
  persist();
  return user;
}

export function getUserByEmail(email: string): User | null {
  const key = email.toLowerCase().trim();
  return load().get(key) ?? null;
}

export function upgradeToPremium(email: string): User | null {
  const key = email.toLowerCase().trim();
  const users = load();
  const user = users.get(key);
  if (!user) return null;
  user.plan = "premium";
  user.upgraded_at = new Date().toISOString();
  persist();
  return user;
}

export function incrementUsage(email: string): void {
  const key = email.toLowerCase().trim();
  const users = load();
  const user = users.get(key);
  if (!user) return;
  user.usage_count += 1;
  persist();
}

export function getAllUsers(): User[] {
  return [...load().values()].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
