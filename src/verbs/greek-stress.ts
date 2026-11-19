const ACCENT_MAP: Record<string, string> = {
  α: 'ά',
  ε: 'έ',
  η: 'ή',
  ι: 'ί',
  ο: 'ό',
  υ: 'ύ',
  ω: 'ώ',
  ϊ: 'ΐ',
  ϋ: 'ΰ',
  Α: 'Ά',
  Ε: 'Έ',
  Η: 'Ή',
  Ι: 'Ί',
  Ο: 'Ό',
  Υ: 'Ύ',
  Ω: 'Ώ',
};

const UNACCENT_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ACCENT_MAP).map(([k, v]) => [v, k])
);

const DIGRAPHS = new Set(['αι', 'ει', 'οι', 'υι', 'ου', 'αυ', 'ευ', 'ηυ']);
const VOWELS = new Set(['α', 'ε', 'η', 'ι', 'ο', 'υ', 'ω', 'ϊ', 'ϋ']);

export function stripStress(word: string): string {
  return word.replace(/[άέήίόύώΐΰΆΈΉΊΌΎΏ]/g, (ch) => UNACCENT_MAP[ch] ?? ch);
}

/** Find syllable nuclei as [start, end) index ranges in an unstressed Greek word */
function findNuclei(unstressed: string): Array<[number, number]> {
  const lower = unstressed.toLowerCase();
  const nuclei: Array<[number, number]> = [];
  let i = 0;
  while (i < lower.length) {
    if (i + 1 < lower.length && DIGRAPHS.has(lower.slice(i, i + 2))) {
      nuclei.push([i, i + 2]);
      i += 2;
    } else if (VOWELS.has(lower[i])) {
      nuclei.push([i, i + 1]);
      i += 1;
    } else {
      i += 1;
    }
  }
  return nuclei;
}

/** Place Greek tonos on the Nth syllable from the end (1 = ultima, 2 = penult, 3 = antepenult) */
export function stressFromEnd(word: string, fromEnd: 1 | 2 | 3): string {
  const clean = stripStress(word);
  const nuclei = findNuclei(clean);
  if (nuclei.length === 0) return clean;
  const idx = Math.max(0, nuclei.length - fromEnd);
  const [start, end] = nuclei[idx];
  // In Greek digraphs (αι, ει, οι, υι, ου, αυ, ευ, ηυ), tonos goes on the SECOND letter
  const targetPos = end - 1;
  const ch = clean[targetPos];
  const stressed = ACCENT_MAP[ch] ?? ch;
  return clean.slice(0, targetPos) + stressed + clean.slice(targetPos + 1);
}

export function countSyllables(word: string): number {
  return findNuclei(stripStress(word)).length;
}

/**
 * Build the 6 past forms (-α, -ες, -ε, -αμε, -ατε, -αν) from an unstressed past stem.
 * Automatically adds syllabic augment έ- for 1-syllable stems (e.g. γραφ- -> έγραφα / γράφαμε)
 * unless noAugment is true or customAugment (e.g. 'εί' for είπα / 'ή' for ήπια) is given.
 */
export function buildPastSix(
  pastStem: string,
  options?: {
    augment?: string;
    noAugment?: boolean;
    /** For stems that already include internal augment in sg+3p, e.g. ['κατέβαιν', 'κατεβαίν'] */
    plStem?: string;
    /** Explicit antepenult override for sg/3p if stem has special vowel hiatus (e.g. άδειασε) */
    sgStemOverride?: string;
  }
): [string, string, string, string, string, string] {
  const cleanStem = stripStress(pastStem);
  const syls = countSyllables(cleanStem);
  const needsAugment = !options?.noAugment && syls === 1 && !/^[αεηιουω]/i.test(cleanStem);
  const sgBase = options?.sgStemOverride
    ? stripStress(options.sgStemOverride)
    : options?.augment
      ? stripStress(options.augment) + cleanStem
      : needsAugment
        ? 'ε' + cleanStem
        : cleanStem;
  const plBase = options?.plStem ? stripStress(options.plStem) : cleanStem;

  const s1 = stressFromEnd(sgBase + 'α', 3);
  const s2 = stressFromEnd(sgBase + 'ες', 3);
  const s3 = stressFromEnd(sgBase + 'ε', 3);
  const p1 = stressFromEnd(plBase + 'αμε', 3);
  const p2 = stressFromEnd(plBase + 'ατε', 3);
  const p3 = stressFromEnd(sgBase + 'αν', 3);
  return [s1, s2, s3, p1, p2, p3];
}
