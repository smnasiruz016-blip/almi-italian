// RR-398 · the AlmiWorld family footer (the same columns and links as almiworld.com, Shamool Foundation included), from the one
// generated kit (src/lib/almiworld-family.ts + src/components/almiworld/, made by almiworld-site/tools/make-family-kit.mjs). The
// old footer's family strip (from @smnasiruz016-blip/almi-data) is gone; no eBooks, no old WordPress links. AlmiItalian's own
// links sit in one row under the columns.
import { AlmiWorldFooter } from "@/components/almiworld/AlmiWorldFooter";

export function GlobalFooter() {
  return (
    <AlmiWorldFooter
      own={[
        { label: "AlmiItalian", href: "/" },
        { label: "Practice", href: "/practice" },
        { label: "Pricing", href: "/pricing" },
        { label: "Privacy", href: "/privacy" },
      ]}
    />
  );
}
