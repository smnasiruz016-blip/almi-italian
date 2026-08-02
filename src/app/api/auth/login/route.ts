import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { limitByClient, tooManyRequests } from "@/lib/rate-limit";
import { logRefusal } from "@/lib/observability";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  // Before the password comparison, not after — a limiter that runs after the bcrypt call
  // still lets an attacker spend our CPU at their chosen rate.
  const limit = limitByClient("login", req);
  if (!limit.ok) {
    logRefusal({ route: "/api/auth/login", status: 429, reason: "rate-limited", req });
    return tooManyRequests(limit.retryAfterSeconds);
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    // One reason for both branches, deliberately: distinguishing "no such account" from "wrong
    // password" in the LOG is fine, but the two must stay indistinguishable in the RESPONSE or
    // the endpoint becomes an account-existence oracle. The log records which; the caller is
    // told neither.
    logRefusal({ route: "/api/auth/login", status: 401, reason: user ? "bad-password" : "no-such-user", req });
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
