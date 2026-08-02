"use client";

// Root error boundary — the one that fires when the ROOT LAYOUT itself throws.
//
// ── WHY IT LOOKS DIFFERENT FROM error.tsx ───────────────────────────────────
// global-error.tsx REPLACES the root layout, so it must render its own <html> and <body>. That
// also means it cannot rely on anything the layout provides: no header, no footer, and — the
// part that catches people out — no stylesheet, because `globals.css` is imported BY the layout
// that just failed. Tailwind class names here would resolve to nothing and this page would be
// unstyled text at the exact moment the product is already broken.
//
// So every style below is inline, and the palette is written as literal hex rather than the
// almi-* tokens: the tokens live in the CSS that is not loaded. It is duplication, on purpose,
// in the one file that cannot share.
//
// ── WHAT IS DELIBERATELY NOT SHOWN ──────────────────────────────────────────
// `error.message` — same reasoning as error.tsx, and it matters more here. A root-layout failure
// is the case most likely to be a misconfiguration, and misconfiguration messages are the ones
// that quote connection strings and env var names. Only `digest` is rendered.

const INK = "#1f2933";
const TEXT = "#3e4c59";
const MUTED = "#7b8794";
const CORAL = "#ff6b5a";
const LINE = "#e4e7eb";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: "#fffdfb", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
        <main style={{ maxWidth: "36rem", margin: "0 auto", padding: "5rem 1.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: CORAL }}>
            AlmiItalian
          </p>
          <h1 style={{ margin: "0.75rem 0 0", fontSize: "1.875rem", fontWeight: 700, color: INK }}>
            The site failed to start
          </h1>
          <p style={{ margin: "1rem 0 0", lineHeight: 1.6, color: TEXT }}>
            This is a fault on our side. Your account and any practice you have already submitted
            are unaffected — nothing was lost by this page failing to load.
          </p>
          <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <button
              onClick={reset}
              style={{ border: "none", borderRadius: "9999px", backgroundColor: CORAL, color: INK, padding: "0.625rem 1.5rem", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer" }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{ borderRadius: "9999px", border: `1px solid ${LINE}`, color: INK, padding: "0.625rem 1.5rem", fontWeight: 500, fontSize: "0.95rem", textDecoration: "none" }}
            >
              Go to the homepage
            </a>
          </div>
          {error.digest && (
            <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: MUTED }}>
              If you report this, quote reference <code style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{error.digest}</code>.
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
