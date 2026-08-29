import Link from "next/link";
import { AuthNav } from "./AuthNav";
import { familyStrip } from "@smnasiruz016-blip/almi-data";

// AlmiWorld family navigation. The product list is NOT maintained here — it lives in
// @smnasiruz016-blip/almi-data, so adding a product is one edit there plus a version
// bump, not an edit in every repo. This array used to be inline, and inline is how it
// silently fell behind: it stopped at AlmiDanish because that is who existed when this
// repo was forked, and it had already drifted (almisalary had lost its trailing slash).
// ⚠️ "italian" is an IDENTITY, not a label — it omits THIS product from its own strip.
export const FAMILY_NAV = familyStrip("italian");

export function GlobalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-almi-line bg-almi-bg/95 backdrop-blur">
      {/* TWO-ROW, RIGHT-ALIGNED — ported from almi-prep-v2's GlobalHeader.
          This used to be ONE wrapping flex row: wordmark, then the family strip with
          `ml-auto`, then <AuthNav/>. With 26 family links the strip filled the row, so the
          auth cluster wrapped onto a new line and landed at its LEFT edge — reading as two
          more product links directly under the strip rather than as the way into the product.
          The links were never the problem; the placement was.

          Now the strip and the auth cluster are two rows of one right-aligned column, exactly
          as AlmiPrep arranges them. */}
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label="AlmiItalian home" className="inline-flex shrink-0 items-center gap-2">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-lg bg-almi-coral text-sm font-bold text-almi-ink">
            IT
          </span>
          <span className="text-xl font-semibold tracking-tight text-almi-ink">AlmiItalian</span>
        </Link>

        {/* ⚠️ NOT `hidden lg:flex`, which is what AlmiPrep uses here. Prep hides this column
            below lg and serves a HeaderMobileMenu drawer instead; this product has no such
            drawer, so copying the hide would delete the whole nav on mobile. The column stays
            visible at every width and the strip keeps wrapping exactly as it does today. */}
        <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
          <nav aria-label="Family navigation" className="flex flex-wrap justify-end gap-x-4 gap-y-1">
            {FAMILY_NAV.map((item) => (
              <a key={item.href} href={item.href} className="rounded-sm text-base font-semibold text-almi-ink hover:text-almi-coral-text">
                {item.label}
              </a>
            ))}
          </nav>
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
