import Link from "next/link";
import { AuthNav } from "./AuthNav";
import { AlmiWorldBar } from "@/components/almiworld/AlmiWorldBar";

// RR-398: on top, the AlmiWorld family bar (logo + Home to almiworld.com, and the same menus as almiworld.com) from the one
// generated kit; under it AlmiItalian's own wordmark and AuthNav (Practice, Log in / Account, its own button). The old family
// strip (familyStrip from @smnasiruz016-blip/almi-data, 26 links) is gone from the header and the footer. The bar is a server
// component with no client JS (its menus are <details>), so the header stays static.

export function GlobalHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-almi-line bg-almi-bg/95 backdrop-blur">
      <AlmiWorldBar />
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
          {/* RR-398: the family links now live in the AlmiWorld bar above. */}
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
