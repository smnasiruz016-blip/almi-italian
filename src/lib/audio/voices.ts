// ASCOLTO audio: speaker splitting and voice assignment.
//
// ONE implementation, imported by both the renderer (scripts/audio/render-ascolto.mts) and
// the coverage gate. Two copies would drift, and the drift would only surface as a stored
// clip that no longer matches what the gate believes was rendered.
//
// Pure: no vendor, no network, no cost, no filesystem.
//
// ── WHY THE LABEL VOCABULARY COMES FROM THE ITEM, NOT A REGEX ───────────────
// A generic /^Name:/ scan over these scripts is wrong in both directions. It finds
// "Attenzione: giovedì la piscina resta chiusa" — an announcement opener that MUST be
// spoken — and it would miss nothing useful that the item does not already declare.
//
// So splitting is driven by the item's OWN `prompts`. A MATCHING item that asks the learner
// to match "Elena" to an activity already names its speakers; nothing else in the bank is a
// speaker. An item whose prompts are topics ("Il giardino", "Turismo") is narrated by one
// voice, which is what it is.
//
// ── WHY THE LABEL IS SPOKEN, WHERE AlmiCELPIP STRIPS IT ─────────────────────
// CELPIP removes "Role:" from the spoken text and lets the voice change signal the speaker.
// That is right for CELPIP and WRONG here, and the difference is in the question being
// asked. In these five items the prompts ARE the labels: the learner is asked which option
// belongs to "Elena", and a listener who never hears the name has no way to know which of
// four voices was Elena. Stripping the label would not make the item harder; it would make
// it unanswerable.
//
// A distinct voice per speaker is still assigned — it marks the turn boundaries — but the
// name is what identifies the speaker, so the name stays.

export type SpeakerRun = { label: string | null; voice: string; text: string };

/**
 * Two-party dialogue split on the em-dash turn marker.
 *
 * 13 of the 60 ASCOLTO scripts are interviews, phone calls and negotiations written with the
 * Italian typographic dialogue dash — "— Buongiorno… — Mi dispiace…". That dash IS the turn
 * marker, so splitting on it reads existing markup rather than inventing structure, exactly
 * as splitting on "Elena:" does. Rendered in one voice these items are close to unanswerable:
 * the learner cannot tell the interviewer from the person being interviewed.
 *
 * Every one of them alternates strictly between two parties, so voices alternate too. The
 * pair is one female and one male for maximum distinguishability, ordered by the item id.
 *
 * Returns null when the script is not a dash dialogue, so the caller can fall through.
 */
/**
 * Per-item gender pinning for dash-split dialogues.
 *
 * The dash splitter normally picks a female/male pair from an id-derived offset, which is fine
 * when the turns are anonymous. It is NOT fine when the SCRIPT names who is speaking: in
 * "Conversazione al bar" the third speaker asks "E tu, Giulia?" and the fourth turn is Giulia's
 * reply. A male voice answering that breaks the item — the learner identifies Giulia by being
 * addressed, and the prompts ask them to match her.
 *
 * NAME_GENDER cannot help here: it keys on a "Label:" prefix and these turns have none. So the
 * genders are pinned per item, per turn, explicitly and reviewably.
 *
 * Keyed by stableItemId (sha256 of {exam, level, section, title}), with the title in the
 * comment so a human can check the mapping without computing a hash.
 */
const PINNED_TURN_GENDERS: Record<string, ("F" | "M")[]> = {
  // CILS_STANDARD/UNO · ASCOLTO · "Conversazione al bar: le ordinazioni"
  // Four people order in sequence; turn 4 is Giulia, addressed by name at the end of turn 3.
  // ONLY Giulia's gender is fixed by the script — the first three are positional ("Prima
  // persona"…) and unnamed. So they alternate, which is what gives four DISTINCT voices:
  // edge-tts offers exactly two Italian voices per gender, so pinning three of one gender
  // would force two speakers onto one voice and undo the whole point of the split.
  "0a9daba1a9d6374e": ["M", "F", "M", "F"],
};

function splitByDash(script: string, itemId: string): SpeakerRun[] | null {
  // Em dash (U+2014) and en dash (U+2013) both appear as dialogue markers in Italian text.
  const parts = script
    .split(/\s*[—–]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;

  const pinned = PINNED_TURN_GENDERS[itemId];
  if (pinned) {
    // Explicitly cast. Distinct voices within each gender, in order, so two speakers of the same
    // gender never share a voice.
    if (pinned.length !== parts.length) {
      throw new Error(
        `item ${itemId}: ${pinned.length} pinned turn gender(s) but the script splits into ${parts.length} turns — re-pin or re-check the dashes`,
      );
    }
    let f = 0;
    let m = 0;
    const runs = parts.map((text, i) => {
      const g = pinned[i];
      const pool = g === "F" ? IT_VOICES.FEMALE : IT_VOICES.MALE;
      const idx = g === "F" ? f++ : m++;
      if (idx >= pool.length) {
        // Loud, not silent. Wrapping would put two different speakers on one voice, which is
        // the exact defect the dash split exists to fix.
        throw new Error(
          `item ${itemId}: pinned genders need ${idx + 1} ${g === "F" ? "female" : "male"} voices but edge-tts offers ${pool.length} for it-IT — re-balance the pin`,
        );
      }
      return { label: null, voice: pool[idx], text };
    });
    if (new Set(runs.map((r) => r.voice)).size !== runs.length) {
      throw new Error(`item ${itemId}: pinned turns collapsed onto fewer voices than turns`);
    }
    return runs;
  }

  const off = offsetFor(itemId, 2);
  const pair = off === 0
    ? [IT_VOICES.FEMALE[0], IT_VOICES.MALE[0]]
    : [IT_VOICES.MALE[1], IT_VOICES.FEMALE[1]];

  return parts.map((text, i) => ({ label: null, voice: pair[i % 2], text }));
}

/** The four Italian neural voices edge-tts offers (`python -m edge_tts --list-voices`,
 *  checked 2026-08-26). There are exactly four, which is exactly what a four-speaker
 *  MATCHING item needs. */
export const IT_VOICES = {
  FEMALE: ["it-IT-ElsaNeural", "it-IT-IsabellaNeural"],
  MALE: ["it-IT-DiegoNeural", "it-IT-GiuseppeMultilingualNeural"],
} as const;

/** Every voice, in a FIXED order. Used for generic labels ("Persona 1"), where no gender is
 *  implied and only distinctness matters. Order is load-bearing: changing it re-renders
 *  every generic item with different voices. */
export const ALL_VOICES: string[] = [
  IT_VOICES.FEMALE[0],
  IT_VOICES.MALE[0],
  IT_VOICES.FEMALE[1],
  IT_VOICES.MALE[1],
];

/**
 * Gender of the first names that actually appear as speaker labels in this bank.
 *
 * Deliberately NOT a general Italian name-gender library: it lists the eight names present,
 * so a reviewer can check it against the bank by eye, and a new name fails loudly in
 * voiceForSpeakers() rather than silently drawing whatever the rotation lands on. A woman
 * called Elena must not be read by a male voice — that is a content defect no byte count
 * would ever see.
 */
export const NAME_GENDER: Record<string, "F" | "M"> = {
  elena: "F",
  paolo: "M",
  rita: "F",
  sandro: "M",
  anna: "F",
  bruno: "M",
  carla: "F",
  dario: "M",
};

/** Generic labels carry no gender: "Persona 1", "Intervento 3", "Prima persona". */
export function isGenericLabel(label: string): boolean {
  return /^(persona|intervento|voce|parlante|prima|seconda|terza|quarta)\b/i.test(label.trim());
}

/** A stable 0..n-1 offset derived from the item id, so voice assignment is reproducible:
 *  re-running the renderer on an unchanged bank produces byte-comparable output. */
function offsetFor(itemId: string, mod: number): number {
  // The id is already a sha256 prefix; its first bytes are as good as any hash.
  const n = parseInt(itemId.slice(0, 8), 16);
  return Number.isFinite(n) ? n % mod : 0;
}

/**
 * Assign one voice per speaker label, deterministically for a given item id.
 *
 * Named speakers keep their gender. Generic labels rotate through ALL_VOICES from an
 * id-derived offset, so two different items with "Persona 1..4" do not sound identical
 * while each on its own is perfectly reproducible.
 *
 * Throws on an unknown name rather than guessing — see NAME_GENDER.
 */
export function voiceForSpeakers(itemId: string, labels: string[]): string[] {
  // Keyed by DISTINCT speaker, then mapped back over the occurrence list. Assigning per
  // occurrence would give a speaker who talks twice two different voices — the same defect
  // as two speakers sharing one, arriving from the other direction.
  const distinct: string[] = [];
  for (const l of labels) {
    const k = l.trim().toLowerCase();
    if (!distinct.includes(k)) distinct.push(k);
  }

  const assigned = new Map<string, string>();
  if (distinct.every((k) => isGenericLabel(k))) {
    const off = offsetFor(itemId, ALL_VOICES.length);
    distinct.forEach((k, i) => assigned.set(k, ALL_VOICES[(off + i) % ALL_VOICES.length]));
  } else {
    let fUsed = 0;
    let mUsed = 0;
    for (const k of distinct) {
      const g = NAME_GENDER[k];
      if (!g) {
        throw new Error(
          `no gender recorded for speaker "${k}" — add it to NAME_GENDER in src/lib/audio/voices.ts`,
        );
      }
      const pool = g === "F" ? IT_VOICES.FEMALE : IT_VOICES.MALE;
      const used = g === "F" ? fUsed++ : mUsed++;
      if (used >= pool.length) {
        // Loud, not silent. Wrapping would collapse two characters onto one sound, which is
        // a content defect no byte count would ever see.
        throw new Error(
          `item ${itemId} needs ${used + 1} ${g === "F" ? "female" : "male"} voices but edge-tts offers ${pool.length} for it-IT — re-cast the item or add a voice`,
        );
      }
      assigned.set(k, pool[used]);
    }
  }

  const out = labels.map((l) => assigned.get(l.trim().toLowerCase())!);
  const uniqueVoices = new Set(out).size;
  if (uniqueVoices < distinct.length) {
    throw new Error(`item ${itemId}: ${distinct.length} speakers collapsed onto ${uniqueVoices} voice(s)`);
  }
  return out;
}

/**
 * Split a script into per-speaker runs using the item's own prompt labels.
 *
 * Returns a single narrated run when the item declares no speakers, or when fewer than two
 * of its labels actually appear — an item is never split on a guess.
 *
 * The label is KEPT in the spoken text (see the header). It is returned separately too, so
 * the renderer can record which voice said which name.
 */
export function splitByLabels(
  script: string,
  labels: string[],
  itemId: string,
): SpeakerRun[] {
  const narrated = (): SpeakerRun[] => [
    { label: null, voice: ALL_VOICES[offsetFor(itemId, ALL_VOICES.length)], text: script.trim() },
  ];
  if (labels.length < 2) return splitByDash(script, itemId) ?? narrated();

  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // A label only counts at a word boundary followed by a colon, so "Persona 1:" matches and
  // the word "persona" inside a sentence does not.
  const re = new RegExp(`(?<![A-Za-zÀ-ù])(${labels.map(esc).join("|")})\\s*:`, "gi");
  const marks: { label: string; at: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(script)) !== null) marks.push({ label: m[1], at: m.index });
  // No usable labels. FALL THROUGH TO THE DASH SPLIT rather than straight to one narrator:
  // an item can declare prompts and still mark its turns with the dialogue dash. That is
  // exactly "Conversazione al bar", whose four prompts are positional ("Prima persona"…) and
  // appear nowhere in the script — it was being read in a single voice, which made the turn
  // boundaries inaudible and the item close to unanswerable from audio alone.
  if (marks.length < 2) return splitByDash(script, itemId) ?? narrated();

  const order = marks.map((k) => k.label);
  const voices = voiceForSpeakers(itemId, order);
  const runs: SpeakerRun[] = [];
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].at : script.length;
    const text = script.slice(marks[i].at, end).trim();
    if (text) runs.push({ label: marks[i].label, voice: voices[i], text });
  }
  return runs;
}
