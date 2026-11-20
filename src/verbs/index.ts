import { VerbEntry } from './types';
import { irregularAndPassiveVerbs } from './data-irregular';
import { regularActiveVerbs } from './data-regular';

export const ALL_VERBS: VerbEntry[] = [
  ...irregularAndPassiveVerbs,
  ...regularActiveVerbs,
];

export const VERBS_BY_LEMMA: Record<string, VerbEntry> = Object.fromEntries(
  ALL_VERBS.map((v) => [v.lemma, v])
);

/** Map 3rd-person / alternate / idiomatic verb forms to canonical lemma */
const ALIAS_TO_LEMMA: Record<string, string> = {
  πάω: 'πηγαίνω',
  πάει: 'πηγαίνω',
  έχει: 'έχω',
  κάνει: 'κάνω',
  αλλάζει: 'αλλάζω',
  ανεβαίνει: 'ανεβαίνω',
  πέφτει: 'πέφτω',
  βρέχει: 'βρέχω',
  φυσάει: 'φυσάω',
  λείπει: 'λείπω',
  αγαπώ: 'αγαπάω',
  απαντώ: 'απαντάω',
  βοηθώ: 'βοηθάω',
  γελώ: 'γελάω',
  διψώ: 'διψάω',
  ζητώ: 'ζητάω',
  κερνώ: 'κερνάω',
  κολυμπώ: 'κολυμπάω',
  μετρώ: 'μετράω',
  μιλώ: 'μιλάω',
  ξεκινώ: 'ξεκινάω',
  ξεχνώ: 'ξεχνάω',
  ξυπνώ: 'ξυπνάω',
  πατώ: 'πατάω',
  πεινώ: 'πεινάω',
  περνώ: 'περνάω',
  περπατώ: 'περπατάω',
  πετώ: 'πετάω',
  πονώ: 'πονάω',
  πουλώ: 'πουλάω',
  προχωρώ: 'προχωράω',
  ρωτώ: 'ρωτάω',
  σταματώ: 'σταματάω',
  συζητώ: 'συζητάω',
  συναντώ: 'συναντάω',
  τραγουδώ: 'τραγουδάω',
  φορώ: 'φοράω',
  χαλώ: 'χαλάω',
};

/**
 * Given a Greek verb entry string from any topic (e.g. "έρχομαι → ήρθα → θα έρθω",
 * "δουλεύω / εργάζομαι", "κλείνω (εισιτήριο / δωμάτιο)", "μου λείπει"),
 * return the list of unique canonical lemmas present in VERBS_BY_LEMMA.
 */
export function resolveVerbLemmas(el: string): string[] {
  // Strip everything after arrow (→ ...) and parenthetical notes (...)
  const base = el
    .split('→')[0]
    .replace(/\([^)]*\)/g, ' ')
    .trim();

  // Split slash-separated variants ("δουλεύω / εργάζομαι")
  const parts = base
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);

  const lemmas: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const tokens = part.split(/\s+/);
    // Try tokens in order (skipping clitics like μου, τα)
    for (const token of tokens) {
      const clean = token.replace(/[.,;!?;:]/g, '');
      const canonical = VERBS_BY_LEMMA[clean]
        ? clean
        : ALIAS_TO_LEMMA[clean] && VERBS_BY_LEMMA[ALIAS_TO_LEMMA[clean]]
          ? ALIAS_TO_LEMMA[clean]
          : null;
      if (canonical && !seen.has(canonical)) {
        seen.add(canonical);
        lemmas.push(canonical);
        break;
      }
    }
  }

  return lemmas;
}
