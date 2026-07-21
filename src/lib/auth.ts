import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Canonical AlmiWorld auth: bcrypt password hashing + a hashed session token in an httpOnly cookie.
// The session cookie. Named for THIS product — it carried the Korean product's name
// on every visitor's browser until 2026-07-20, inherited when this repo was forked
// from almi-korean and invisible to every check we had.
const SESSION_COOKIE = "almi_italian_session";

/** Cookie names we still READ but never write. Renaming a session cookie normally
 *  logs out every live session — the browser keeps sending the old name and nothing
 *  reads it. Nobody has to be logged out here: the cookie is only a container for the
 *  token, and the session is found in the DB by tokenHash, so the NAME on the
 *  envelope is irrelevant to the lookup. Read both, write one, and the rename is free.
 *
 *  🔴 REMOVAL: safe to delete this list once every legacy cookie has expired. They
 *  were issued with a 30-day life (SESSION_DURATION_MS), so any still valid on
 *  2026-08-20 was issued before this rename shipped (2026-07-20). After that date
 *  this is dead code holding another product's name in the repo. Delete it then; do
 *  not let it become permanent furniture. */
const LEGACY_SESSION_COOKIES = ["almi_korean_session"]; // hygiene-allow: legacy-cookie-almi_korean

/** Read the session token from the current cookie name, falling back to legacy names.
 *  Current name wins: a browser can carry both while a legacy cookie ages out. */
async function readSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  for (const name of [SESSION_COOKIE, ...LEGACY_SESSION_COOKIES]) {
    const value = store.get(name)?.value;
    if (value) return value;
  }
  return undefined;
}
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

const newToken = () => randomBytes(32).toString("base64url");
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createSession(userId: string): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.authSession.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const token = await readSessionToken();
  if (token) await prisma.authSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  // Clear BOTH names. Deleting only the current one would leave a stale legacy cookie
  // in the browser that logs the user straight back in.
  const store = await cookies();
  for (const name of [SESSION_COOKIE, ...LEGACY_SESSION_COOKIES]) store.delete(name);
}

export async function getCurrentUser() {
  const token = await readSessionToken();
  if (!token) return null;
  const session = await prisma.authSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.authSession.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
