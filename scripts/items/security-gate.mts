// Security gate — the rate limiter limits, and the logger never logs a secret.
//
// Run: npm run gate:security   (wired into `build`, so it blocks)
//
// Two things that are easy to add and easy to have silently not work:
//
//   C7  a rate limiter that counts but never refuses
//   C9  a structured logger whose "no PII, no secrets" property is a claim in a comment
//
// Both are proved behaviourally here, and both detectors are shown RED first — against
// synthetic input, so neither is proved by the code it is meant to police.

import { rateLimit, LIMITS, tooManyRequests } from "../../src/lib/rate-limit";
import { __redactMessage, clientHash } from "../../src/lib/observability";

let failed = false;
const fail = (m: string) => { console.error(`  ✗ ${m}`); failed = true; };
const ok = (m: string) => console.log(`  ✓ ${m}`);

console.log("Security gate — rate limit + log redaction\n");

// ── C7. THE LIMITER ACTUALLY REFUSES ────────────────────────────────────────
console.log("C7 — rate limiting:");
{
  const id = "gate-fixture-client";
  const opts = { limit: 3, windowMs: 60_000 };
  const verdicts = [1, 2, 3, 4, 5].map(() => rateLimit("gate-fixture", id, opts));
  const allowed = verdicts.filter((v) => v.ok).length;
  if (allowed !== 3) fail(`limit 3 allowed ${allowed} request(s) — the counter is not counting`);
  else ok(`limit 3: first 3 allowed, request 4 and 5 refused`);

  const refused = verdicts[3];
  if (refused.ok) fail("the 4th request over a limit of 3 was allowed — the limiter never refuses");
  else if (refused.retryAfterSeconds <= 0) fail(`refusal carried retryAfterSeconds=${refused.retryAfterSeconds}; a client cannot back off on that`);
  else ok(`refusal carries Retry-After ${refused.retryAfterSeconds}s`);

  // Buckets must be independent, or one endpoint's traffic locks out another.
  const other = rateLimit("gate-fixture-other", id, opts);
  if (!other.ok) fail("a different bucket was already exhausted — bucket keys are colliding");
  else ok("buckets are independent: a different endpoint has its own budget");

  // Different callers must not share a budget, or one noisy client locks out everyone.
  const otherClient = rateLimit("gate-fixture", "gate-fixture-client-2", opts);
  if (!otherClient.ok) fail("a different client was already exhausted — client keys are colliding");
  else ok("clients are independent: one caller cannot exhaust another's budget");

  // The window has to expire, or a limiter is a permanent ban.
  const past = rateLimit("gate-fixture-expiry", "c", { limit: 1, windowMs: 1 });
  if (!past.ok) fail("first request into a fresh bucket was refused");
  await new Promise((r) => setTimeout(r, 5));
  const afterWindow = rateLimit("gate-fixture-expiry", "c", { limit: 1, windowMs: 1 });
  if (!afterWindow.ok) fail("the window never expires — this is a permanent lockout, not a rate limit");
  else ok("the window expires: the budget comes back");

  const res = tooManyRequests(42);
  if (res.status !== 429) fail(`tooManyRequests() returned ${res.status}, expected 429`);
  else if (res.headers.get("Retry-After") !== "42") fail("tooManyRequests() did not set Retry-After");
  else ok("tooManyRequests() is a 429 with Retry-After");

  // Every configured limit must be finite and positive — a limit of 0 locks everyone out and a
  // huge one is decoration.
  for (const [name, l] of Object.entries(LIMITS)) {
    if (!(l.limit > 0 && l.limit < 1000 && l.windowMs > 0)) fail(`LIMITS.${name} = ${JSON.stringify(l)} is not a usable limit`);
  }
  ok(`${Object.keys(LIMITS).length} configured limit(s), all finite and positive`);
}

// ── C9. THE REDACTOR ────────────────────────────────────────────────────────
// RED FIRST: each string below CONTAINS a secret. If the redactor returned its input unchanged
// every assertion would still "pass" a naive check, so each case asserts both that the secret is
// gone AND that something survived — a redactor that returns "" is not a redactor.
console.log("\nC9 — log redaction:");
{
  const CASES: [string, string, string][] = [
    ["anthropic key", "call failed for sk-ant-api03-AAAAAAAAAAAAAAAAAAAAAAAA", "sk-ant-api03-"],
    ["stripe webhook secret", "bad signature whsec_ABCDEFGHIJKLMNOPQRSTUVWX", "whsec_"],
    ["blob token", "upload denied vercel_blob_rw_ABCDEFGHIJKLMNOP", "vercel_blob_rw_"],
    ["email address", "no user for mario.rossi@example.com in lookup", "@example.com"],
    ["password in a message", "query failed: password=hunter2 supplied", "hunter2"],
    ["bearer token", "rejected: authorization=Bearer abc.def.ghi", "abc.def.ghi"],
  ];
  for (const [label, input, secret] of CASES) {
    const out = __redactMessage(input);
    if (out.includes(secret)) fail(`${label}: the secret survived redaction — "${out.slice(0, 70)}"`);
    else if (out.trim() === "") fail(`${label}: redactor returned an empty string; it is deleting, not redacting`);
    else ok(`${label} redacted → "${out.slice(0, 62)}"`);
  }

  // …and the RED direction stated outright: an unredacted string must NOT pass these assertions.
  const naive = (s: string) => s; // what a broken redactor looks like
  const leaks = CASES.filter(([, input, secret]) => naive(input).includes(secret)).length;
  if (leaks !== CASES.length) fail("RED PROOF FAILED — the fixtures do not actually contain secrets, so passing them proves nothing");
  else ok(`RED proof: all ${CASES.length} fixture(s) genuinely contain a secret an unredacted logger would emit`);

  // Long messages are truncated, so a logger cannot be used to dump a payload.
  const long = __redactMessage("x".repeat(5000));
  if (long.length > 600) fail(`a 5000-char message logged ${long.length} chars — the cap is not applied`);
  else ok(`long messages are capped at ${long.length} chars`);
}

// ── C9. THE CLIENT HASH ─────────────────────────────────────────────────────
console.log("\nC9 — client identification:");
{
  const reqFor = (ip: string) => new Request("https://example.test/", { headers: { "x-forwarded-for": ip } });
  const a1 = clientHash(reqFor("203.0.113.9"));
  const a2 = clientHash(reqFor("203.0.113.9"));
  const b = clientHash(reqFor("198.51.100.4"));
  if (a1 !== a2) fail("the same client hashed to two different ids — a burst cannot be counted");
  else ok("the same client hashes stably within the process");
  if (a1 === b) fail("two different clients hashed to the same id — the log cannot tell them apart");
  else ok("different clients hash differently");
  if (a1.includes("203.0.113")) fail("the raw IP survived into the hash — that is personal data in a log line");
  else ok("the raw IP does not appear in the id");
  const unknown = clientHash(new Request("https://example.test/"));
  if (!unknown) fail("a request with no forwarding header produced no id at all");
  else ok("a caller with no IP header still gets an id (all such callers bucket together)");
}

console.log("");
if (failed) {
  console.error("Security gate FAILED\n");
  process.exit(1);
}
console.log("Security gate passed\n");
