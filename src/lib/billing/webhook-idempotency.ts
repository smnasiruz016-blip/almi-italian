// WEBHOOK IDEMPOTENCY - the claim, and why it is a write and not a read.
//
// almi-billing-router forwards one Stripe event up to THREE times on any non-2xx
// (BACKOFF_MS = [300, 900, 2700] in its src/lib/forward.ts) and abandons an attempt at 10s.
// Its own comment states the assumption it makes of every product: "products are idempotent
// on the same event id". This product was not: a forwarded customer.subscription.created that
// failed to ack sent the learner a second and a third confirmation email.
//
// The logic lives here, behind a two-method interface, so the gate can drive it without a
// database. The route wires the real Prisma client in; scripts/gates/webhook-idempotency-gate.mts
// wires a fake that can be told to raise P2002 on demand. A guard nobody can exercise is a
// guard nobody has tested.

/** The slice of the Prisma client this needs. Narrow on purpose - it is what makes it fakeable. */
export type ClaimStore = {
  create(args: { data: { id: string; eventType: string } }): Promise<unknown>;
  delete(args: { where: { id: string } }): Promise<unknown>;
};

/** Prisma's unique-constraint violation. The ONLY error that means "already claimed". */
export const UNIQUE_VIOLATION = "P2002";

/**
 * Claim an event, or report that someone else already has.
 *
 * The claim is the INSERT. Every other product in the network reads with alreadyProcessed()
 * and then writes with markProcessed() - two statements with a gap between them. That holds
 * against a slow Stripe re-drive, but the threat here is a retry arriving while the first
 * attempt is STILL RUNNING: the router gave up at 10s, the function it abandoned did not. Two
 * reads would both return "not processed", both handlers would run, and the guard would have
 * bought nothing. Writing first collapses the window into the primary key.
 *
 * Anything that is not P2002 is rethrown. A guard that swallows an unknown failure - the table
 * missing, the connection down - degrades silently into no guard at all, which is worse than
 * none, because it still looks like one.
 */
export async function claimEvent(
  store: ClaimStore,
  eventId: string,
  eventType: string,
): Promise<boolean> {
  try {
    await store.create({ data: { id: eventId, eventType } });
    return true;
  } catch (err) {
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === UNIQUE_VIOLATION) {
      return false;
    }
    throw err;
  }
}

/**
 * Give the claim back when the handler did not finish.
 *
 * Claiming before the work closes the concurrency window but opens another: if the handler
 * throws, the row says "done" and the next attempt is turned away, so a real subscription
 * change is lost in silence. The other products avoid that by marking only on success, which
 * is exactly why they are exposed to the race instead. Releasing on failure keeps both.
 *
 * Never throws: it runs on the failure path, and masking the original error with a second one
 * would hide the reason the handler failed in the first place.
 */
export async function releaseClaim(store: ClaimStore, eventId: string): Promise<void> {
  try {
    await store.delete({ where: { id: eventId } });
  } catch (err) {
    console.error("[stripe-webhook] could not release claim; event will not be retried", {
      eventId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
