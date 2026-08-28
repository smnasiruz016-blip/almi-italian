// WHO MAY READ /api/billing/health — the decision, on its own, so it can be tested.
//
// The route's guard was added in #34. Nothing asserted it, so nothing would have noticed it
// being loosened: the whole check is one `if`, and deleting it leaves a route that returns 200
// and looks healthier than before. Pulling the decision out here lets
// scripts/gates/billing-health-gate.mts drive every combination offline — no cookies, no
// database, and crucially no live Stripe call, because the anonymous path is refused before a
// Stripe client is ever constructed.
//
// WHY AUTH AND NOT RATE-LIMITING ALONE
// The endpoint discloses configuration: key mode (live/test), which price vars exist, whether
// the portal is active, and each price's unit amount. That is a confidentiality problem, and a
// single request is enough to leak it — throttling only changes how fast. So authentication is
// the control that actually addresses it.
//
// The limiter stays, in front, for a different reason: it prices an attempt to GUESS the
// secret, and it caps the Stripe quota this route can burn even for a caller who is authorised.
// Two controls for two distinct risks, not one control twice.

/**
 * Fail-closed by construction.
 *
 * `Boolean(envSecret)` is what makes an unset or empty ADMIN_API_SECRET authorise nobody. Without
 * it, `undefined === undefined` would be true for a caller who simply omits the header, and an
 * unconfigured deploy would serve the configuration to the whole internet — the failure being
 * that the route looks like it is working.
 *
 * @param envSecret     process.env.ADMIN_API_SECRET, as read.
 * @param headerSecret  the x-admin-secret request header, or null when absent.
 * @param isAdminSession whether the session cookie resolves to an admin (the browser door).
 */
export function isBillingHealthAuthorized(
  envSecret: string | undefined,
  headerSecret: string | null,
  isAdminSession: boolean,
): boolean {
  const bySecret = Boolean(envSecret) && headerSecret === envSecret;
  return bySecret || isAdminSession;
}
