import { VerbEntry, VerbPersonForms } from './types';
import { buildPastSix, stressFromEnd, stripStress } from './greek-stress';

export const AUX_PLUPERF: [string, string, string, string, string, string] = [
  'είχα',
  'είχες',
  'είχε',
  'είχαμε',
  'είχατε',
  'είχαν',
];

export const AUX_PERF: [string, string, string, string, string, string] = [
  'έχω',
  'έχεις',
  'έχει',
  'έχουμε',
  'έχετε',
  'έχουν',
];

export const AUX_FUT_PERF: [string, string, string, string, string, string] = [
  'θα έχω',
  'θα έχεις',
  'θα έχει',
  'θα έχουμε',
  'θα έχετε',
  'θα έχουν',
];

type Six = [string, string, string, string, string, string];

/** Expand a [1s, 1p] past pair like ['κατέβηκα', 'κατεβήκαμε'] into all 6 persons */
export function pastPair(sg1: string, pl1: string): Six {
  const sgBase = sg1.slice(0, -1); // remove -α
  const plBase = pl1.slice(0, -3); // remove -αμε
  return [sg1, sgBase + 'ες', sgBase + 'ε', pl1, plBase + 'ατε', sgBase + 'αν'];
}

/** Expand a present active Type A 1s like 'γράφω' -> [γράφω, γράφεις, γράφει, γράφουμε, γράφετε, γράφουν] */
export function presA(sg1: string): Six {
  const stem = sg1.slice(0, -1);
  return [stem + 'ω', stem + 'εις', stem + 'ει', stem + 'ουμε', stem + 'ετε', stem + 'ουν'];
}

/** Expand a present active oxytone -ώ (Type B2) or passive aorist subjunctive -θώ / -ώ like 'οδηγώ' / 'κατεβώ' */
export function presOxytone(sg1: string): Six {
  const stem = sg1.slice(0, -1);
  return [stem + 'ώ', stem + 'είς', stem + 'εί', stem + 'ούμε', stem + 'είτε', stem + 'ούν'];
}

/** Expand Type B1 (-άω) present: αγαπάω, αγαπάς, αγαπάει, αγαπάμε, αγαπάτε, αγαπάνε */
export function presB1(sg1: string): Six {
  const stem = sg1.endsWith('άω') ? sg1.slice(0, -2) : sg1.slice(0, -1);
  return [stem + 'άω', stem + 'άς', stem + 'άει', stem + 'άμε', stem + 'άτε', stem + 'άνε'];
}

/** Expand Type B1/B2 imperfect (-ούσα): μιλούσα, μιλούσες, μιλούσε, μιλούσαμε, μιλούσατε, μιλούσαν */
export function impfOusa(stem: string): Six {
  return pastPair(stem + 'ούσα', stem + 'ούσαμε');
}

/** Expand Type C1 (-ομαι) present: έρχομαι, έρχεσαι, έρχεται, ερχόμαστε, έρχεστε, έρχονται */
export function presC1(sg1: string): Six {
  const stem = sg1.slice(0, -4); // remove -ομαι (keeps stress e.g. έρχ-, σκέφτ-, ετοιμάζ-)
  const unstr = stripStress(stem);
  return [
    stem + 'ομαι',
    stem + 'εσαι',
    stem + 'εται',
    unstr + 'όμαστε',
    stem + 'εστε',
    stem + 'ονται',
  ];
}

/** Expand Type C1 (-ομαι) imperfect: ερχόμουν, ερχόσουν, ερχόταν, ερχόμασταν, ερχόσασταν, έρχονταν */
export function impfC1(sg1Present: string): Six {
  const stem = sg1Present.slice(0, -4);
  const unstr = stripStress(stem);
  return [
    unstr + 'όμουν',
    unstr + 'όσουν',
    unstr + 'όταν',
    unstr + 'όμασταν',
    unstr + 'όσασταν',
    stem + 'ονταν',
  ];
}

/** Expand Type C2 (-άμαι) present: κοιμάμαι, κοιμάσαι, κοιμάται, κοιμόμαστε, κοιμάστε, κοιμούνται */
export function presC2(sg1: string): Six {
  const stem = stripStress(sg1.slice(0, -4)); // remove -άμαι
  return [
    stem + 'άμαι',
    stem + 'άσαι',
    stem + 'άται',
    stem + 'όμαστε',
    stem + 'άστε',
    stem + 'ούνται',
  ];
}

/** Expand Type C2 (-άμαι) imperfect: κοιμόμουν, ... */
export function impfC2(sg1: string): Six {
  const stem = stripStress(sg1.slice(0, -4));
  return [
    stem + 'όμουν',
    stem + 'όσουν',
    stem + 'όταν',
    stem + 'όμασταν',
    stem + 'όσασταν',
    stem + 'όντουσαν',
  ];
}

/** Expand Type C3 (-ιέμαι) present: βαριέμαι, βαριέσαι, βαριέται, βαριόμαστε, βαριέστε, βαριούνται */
export function presC3(sg1: string): Six {
  const stem = stripStress(sg1.slice(0, -5)); // remove -ιέμαι
  return [
    stem + 'ιέμαι',
    stem + 'ιέσαι',
    stem + 'ιέται',
    stem + 'ιόμαστε',
    stem + 'ιέστε',
    stem + 'ιούνται',
  ];
}

/** Expand Type C3 (-ιέμαι) imperfect: βαριόμουν, ... */
export function impfC3(sg1: string): Six {
  const stem = stripStress(sg1.slice(0, -5));
  return [
    stem + 'ιόμουν',
    stem + 'ιόσουν',
    stem + 'ιόταν',
    stem + 'ιόμασταν',
    stem + 'ιόσασταν',
    stem + 'ιόντουσαν',
  ];
}

/** Expand Type C4 (-ούμαι) present: αθλούμαι, αθλείσαι, αθλείται, αθλούμαστε, αθλείστε, αθλούνται */
export function presC4(sg1: string): Six {
  const stem = stripStress(sg1.slice(0, -5)); // remove -ούμαι
  return [
    stem + 'ούμαι',
    stem + 'είσαι',
    stem + 'είται',
    stem + 'ούμαστε',
    stem + 'είστε',
    stem + 'ούνται',
  ];
}

/** Expand Type C4 (-ούμαι) imperfect: αθλούμουν, ... */
export function impfC4(sg1: string): Six {
  const stem = stripStress(sg1.slice(0, -5));
  return [
    stem + 'ούμουν',
    stem + 'ούσουν',
    stem + 'ούταν',
    stem + 'ούμασταν',
    stem + 'ούσασταν',
    stem + 'ούνταν',
  ];
}

/** Prefix all 6 forms with 'θα ' */
export function withTha(forms: Six): Six {
  return forms.map((f) => (f === '—' ? '—' : `θα ${f}`)) as Six;
}

/** Assemble a full VerbEntry from 6-tuples */
export function makeVerb(cfg: {
  lemma: string;
  translation: string;
  infinitive: string;
  defaultPerson?: number;
  present: Six;
  imperfect: Six;
  aorist: Six;
  futureSimple: Six;
  futureCont?: Six;
  imperative: {
    simpleSg: string;
    simplePl: string;
    contSg: string;
    contPl: string;
  };
  participle: {
    active: string;
    passive?: string;
  };
}): VerbEntry {
  const futCont = cfg.futureCont ?? withTha(cfg.present);
  const persons = [0, 1, 2, 3, 4, 5].map((i): VerbPersonForms => ({
    aorist: cfg.aorist[i],
    imperfect: cfg.imperfect[i],
    pluperfectAux: cfg.infinitive === '—' || cfg.aorist[i] === '—' ? '' : AUX_PLUPERF[i],
    present: cfg.present[i],
    perfectAux: cfg.infinitive === '—' || cfg.present[i] === '—' ? '' : AUX_PERF[i],
    futureSimple: cfg.futureSimple[i],
    futureCont: futCont[i],
    futurePerfAux: cfg.infinitive === '—' || cfg.futureSimple[i] === '—' ? '' : AUX_FUT_PERF[i],
  })) as VerbEntry['persons'];

  return {
    lemma: cfg.lemma,
    translation: cfg.translation,
    infinitive: cfg.infinitive,
    defaultPerson: cfg.defaultPerson,
    persons,
    imperative: cfg.imperative,
    participle: cfg.participle,
  };
}

/**
 * Shorthand for regular Type A (-ω) verbs.
 * Provide aoristSubj1s (e.g. 'αγοράσω' / 'γράψω') and optionally explicit [sg1, pl1] for aorist/imperfect.
 */
export function verbA(
  lemma: string,
  translation: string,
  aorSubj1s: string,
  opts?: {
    aor?: [string, string];
    impf?: [string, string];
    impSg?: string;
    impPl?: string;
    contSg?: string;
    part?: string;
    passivePart?: string;
    oxytoneFut?: boolean;
    infinitive?: string;
  }
): VerbEntry {
  const present = presA(lemma);
  const presStem = lemma.slice(0, -1);
  const imperfect = opts?.impf ? pastPair(opts.impf[0], opts.impf[1]) : buildPastSix(presStem);

  const aorStem = aorSubj1s.slice(0, -1);
  const aorist = opts?.aor ? pastPair(opts.aor[0], opts.aor[1]) : buildPastSix(aorStem);

  const futForms = opts?.oxytoneFut ? presOxytone(aorSubj1s) : presA(aorSubj1s);
  const futureSimple = withTha(futForms);
  const infinitive = opts?.infinitive ?? futForms[2]; // 3s aorist subjunctive = απαρέμφατο!

  const defaultSimpleSg = stressFromEnd(stripStress(aorStem) + 'ε', 3);
  const defaultSimplePl = stripStress(aorStem).endsWith('σ')
    ? stressFromEnd(stripStress(aorStem) + 'τε', 2)
    : stressFromEnd(stripStress(aorStem) + 'τε', 2);
  const defaultContSg = stressFromEnd(stripStress(presStem) + 'ε', 3);

  return makeVerb({
    lemma,
    translation,
    infinitive,
    present,
    imperfect,
    aorist,
    futureSimple,
    imperative: {
      simpleSg: opts?.impSg ?? defaultSimpleSg,
      simplePl: opts?.impPl ?? defaultSimplePl,
      contSg: opts?.contSg ?? defaultContSg,
      contPl: present[4],
    },
    participle: {
      active: opts?.part ?? presStem + 'οντας',
      passive: opts?.passivePart,
    },
  });
}

/** Shorthand for Type B1 (-άω / -ώ) verbs like αγαπάω, μιλάω, ρωτάω */
export function verbB1(
  lemma: string,
  translation: string,
  aorSubj1s: string,
  opts?: {
    aor?: [string, string];
    impf?: [string, string];
    impSg?: string;
    impPl?: string;
    contSg?: string;
    passivePart?: string;
  }
): VerbEntry {
  const stem = lemma.endsWith('άω') ? lemma.slice(0, -2) : lemma.slice(0, -1);
  const present = presB1(lemma);
  const imperfect = opts?.impf ? pastPair(opts.impf[0], opts.impf[1]) : impfOusa(stem);
  const aorStem = aorSubj1s.slice(0, -1);
  const aorist = opts?.aor ? pastPair(opts.aor[0], opts.aor[1]) : buildPastSix(aorStem);
  const futForms = presA(aorSubj1s);
  const futureSimple = withTha(futForms);

  const defaultSimpleSg = stressFromEnd(stripStress(aorStem) + 'ε', 3);
  const defaultSimplePl = stressFromEnd(stripStress(aorStem) + 'τε', 2);
  const defaultContSg = stressFromEnd(stripStress(stem) + 'α', 2);

  return makeVerb({
    lemma,
    translation,
    infinitive: futForms[2],
    present,
    imperfect,
    aorist,
    futureSimple,
    imperative: {
      simpleSg: opts?.impSg ?? defaultSimpleSg,
      simplePl: opts?.impPl ?? defaultSimplePl,
      contSg: opts?.contSg ?? defaultContSg,
      contPl: present[4],
    },
    participle: {
      active: stem + 'ώντας',
      passive: opts?.passivePart,
    },
  });
}

/** Shorthand for Type B2 (-ώ) verbs like οδηγώ, τηλεφωνώ, χρησιμοποιώ */
export function verbB2(
  lemma: string,
  translation: string,
  aorSubj1s: string,
  opts?: {
    aor?: [string, string];
    impf?: [string, string];
    impSg?: string;
    impPl?: string;
    contSg?: string;
    part?: string;
    passivePart?: string;
  }
): VerbEntry {
  const stem = lemma.slice(0, -1);
  const present = presOxytone(lemma);
  const imperfect = opts?.impf ? pastPair(opts.impf[0], opts.impf[1]) : impfOusa(stem);
  const aorStem = aorSubj1s.slice(0, -1);
  const aorist = opts?.aor ? pastPair(opts.aor[0], opts.aor[1]) : buildPastSix(aorStem);
  const futForms = presA(aorSubj1s);
  const futureSimple = withTha(futForms);

  const defaultSimpleSg = stressFromEnd(stripStress(aorStem) + 'ε', 3);
  const defaultSimplePl = stressFromEnd(stripStress(aorStem) + 'τε', 2);

  return makeVerb({
    lemma,
    translation,
    infinitive: futForms[2],
    present,
    imperfect,
    aorist,
    futureSimple,
    imperative: {
      simpleSg: opts?.impSg ?? defaultSimpleSg,
      simplePl: opts?.impPl ?? defaultSimplePl,
      contSg: opts?.contSg ?? '—',
      contPl: present[4],
    },
    participle: {
      active: opts?.part ?? stem + 'ώντας',
      passive: opts?.passivePart,
    },
  });
}

/** Shorthand for passive/deponent verbs (-ομαι / -άμαι / -ιέμαι / -ούμαι) */
export function verbPassive(
  lemma: string,
  translation: string,
  type: 'C1' | 'C2' | 'C3' | 'C4',
  aorPair: [string, string],
  futSubj1s: string,
  opts?: {
    impSg?: string;
    impPl?: string;
    contSg?: string;
    contPl?: string;
    passivePart?: string;
    activePart?: string;
    impf?: Six;
    infinitive?: string;
  }
): VerbEntry {
  const present =
    type === 'C1'
      ? presC1(lemma)
      : type === 'C2'
        ? presC2(lemma)
        : type === 'C3'
          ? presC3(lemma)
          : presC4(lemma);
  const imperfect =
    opts?.impf ??
    (type === 'C1'
      ? impfC1(lemma)
      : type === 'C2'
        ? impfC2(lemma)
        : type === 'C3'
          ? impfC3(lemma)
          : impfC4(lemma));

  const aorist = pastPair(aorPair[0], aorPair[1]);
  const futForms = futSubj1s.endsWith('ώ') ? presOxytone(futSubj1s) : presA(futSubj1s);
  const futureSimple = withTha(futForms);
  const infinitive = opts?.infinitive ?? futForms[2];

  return makeVerb({
    lemma,
    translation,
    infinitive,
    present,
    imperfect,
    aorist,
    futureSimple,
    imperative: {
      simpleSg: opts?.impSg ?? '—',
      simplePl: opts?.impPl ?? (futSubj1s.endsWith('ώ') ? futForms[4] : '—'),
      contSg: opts?.contSg ?? '—',
      contPl: opts?.contPl ?? present[4],
    },
    participle: {
      active: opts?.activePart ?? '—',
      passive: opts?.passivePart,
    },
  });
}
