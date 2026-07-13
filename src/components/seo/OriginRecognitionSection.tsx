// Renders the home-country degree-recognition block on origin-bearing study
// pages (AlmiWorld pSEO Localization Standard). Verified per-origin facts, or an
// honest-generic, hedged fallback — never a fabricated body or a name-swap.
import { resolveOriginRecognition, cleanConcern } from "@/lib/seo/origin-recognition";
import type { Origin } from "@/lib/seo/data";

export function OriginRecognitionSection({ origin }: { origin: Origin }) {
  const r = resolveOriginRecognition(origin);
  const url = r.recognitionUrl?.replace(/^https?:\/\//, "");
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-almi-ink">Using an Italian degree back in {origin.name}</h2>
      <p className="mt-2 text-almi-text">
        {r.localized ? (
          <>
            Recognition of a foreign degree in {origin.name} runs through{" "}
            <strong className="text-almi-ink">{r.recognitionBody}</strong>
            {url ? <> (<a href={r.recognitionUrl} className="text-almi-coral hover:underline" rel="nofollow noopener" target="_blank">{url}</a>)</> : null}. {r.equivalenceNote}
          </>
        ) : (
          r.equivalenceNote
        )}
      </p>
      <p className="mt-2 text-almi-text">
        A common concern from {origin.name}: “{cleanConcern(r.commonConcern)}” — worth planning early, alongside the Italian-language requirement.
        {r.sourceNote ? ` (${r.sourceNote})` : ""}
      </p>
      {r.searchTerms.length > 0 && (
        <p className="mt-2 text-xs text-almi-text-muted">
          Students from {origin.name} commonly search for: {r.searchTerms.join(" · ")}.
        </p>
      )}
    </section>
  );
}
