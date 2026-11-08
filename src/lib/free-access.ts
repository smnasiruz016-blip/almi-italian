/**
 * RR-397 · the "free 48 hours, no card" helpers for pages and copy. hasPaidAccess() (src/lib/access.ts) is asked FIRST and is
 * unchanged, so card trials, comps, the owner and paying users are exactly as before.
 *
 *   hasPracticeAccess(user)   practice WITHOUT AI: paid, or inside the free 48 hours
 *   lockedCopy(user)          the honest message when the door is shut ("Your free 48 hours are over" + "Unlock for $12/month")
 *
 * AlmiItalian's AI door is NOT here: it is decideAiEntitlement() in src/lib/ai/entitlement.ts (the product's own metered decision,
 * which every evaluate route and both evaluators already call). The free 48 hours were put INTO that decision: after
 * hasPaidAccess() says no and the email is verified, a free account inside its 48 hours gets 1 Produzione scritta + 1 Produzione
 * orale (tasteMayUseAi) within today's free-AI budget (freeAiAllowedToday). The practice door is refuseSection() in
 * src/lib/section-access.ts. The full mock is not part of the free 48 hours.
 */
import { hasPaidAccess, type PaidUser } from "./access";
import { isTasteActive, isTasteOver, type TasteUser } from "./taste";
import { TASTE_OVER_TITLE, UNLOCK_LABEL } from "./offer";

type AccessUser = PaidUser & TasteUser;

export function hasPracticeAccess(user: AccessUser | null): boolean {
  if (!user) return false;
  return hasPaidAccess(user) || isTasteActive(user);
}

/** The honest line for a shut door. */
export function lockedCopy(user: TasteUser, now: number = Date.now()): { title: string; line: string; cta: string; href: string } {
  if (isTasteOver(user, now)) return { title: TASTE_OVER_TITLE, line: "Unlock everything for $12/month. Cancel anytime.", cta: UNLOCK_LABEL, href: "/pricing" };
  return { title: "Unlock everything", /* RR-397: an account with no free 48 hours (it subscribed or was comped before) is never offered free time it cannot get */ line: "$12/month. Cancel anytime.", cta: UNLOCK_LABEL, href: "/pricing" };
}
