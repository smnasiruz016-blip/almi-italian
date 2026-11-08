import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// RR-397: new checkouts get NO card trial (the free 48 hours start at sign-up, with no card: ./taste.ts); running trials keep Stripe's own end date
import { trialForNewCheckout } from "./offer";

let cached: Stripe | null = null;
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.length < 20) throw new Error("STRIPE_SECRET_KEY missing/invalid");
  // Don't pin apiVersion — let the SDK use its own to avoid type drift on upgrades.
  cached = new Stripe(key, { typescript: true });
  return cached;
}

const baseUrl = () => process.env.APP_URL ?? "https://almiitalian.almiworld.com";

export async function getOrCreateCustomer(user: { id: string; email: string; name: string | null }): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { id: user.id }, select: { stripeCustomerId: true } });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: user.id, product: "almi-italian" },
  });
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createCheckoutSession(user: { id: string; email: string; name: string | null }): Promise<string> {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_PRICE_ID missing");
  const customerId = await getOrCreateCustomer(user);
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    // ⚠️ PINNED, NOT INHERITED. RR-397: the free 48 hours need no card and live in the app (./taste.ts), not in Stripe. A
    // CHECKOUT now charges $12 at once, so a payment method is always taken here. Stripe's default for a subscription that
    // charges at once is already "always", so this changes no behaviour; it changes who owns the behaviour. An upstream default
    // is a promise somebody else can revise, and scripts/gates/paywall-gate asserts this literal so a silent flip to
    // "if_required" fails the build.
    payment_method_collection: "always",
    line_items: [{ price: priceId, quantity: 1 }],
    // RR-397: ...trialForNewCheckout() hands Stripe nothing about a trial, so $12 is charged at checkout, then monthly.
    subscription_data: { ...trialForNewCheckout(), metadata: { userId: user.id } },
    metadata: { product: "almi-italian" }, // routing key for almi-billing-router (checkout.session.completed)
    success_url: `${baseUrl()}/account?checkout=success`,
    cancel_url: `${baseUrl()}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

export async function createPortalSession(customerId: string): Promise<string> {
  const portal = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl()}/account`,
  });
  return portal.url;
}
