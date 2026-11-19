export interface VerbPersonForms {
  aorist: string;
  imperfect: string;
  pluperfectAux: string;
  present: string;
  perfectAux: string;
  futureSimple: string;
  futureCont: string;
  futurePerfAux: string;
}

export interface VerbEntry {
  lemma: string;
  translation: string;
  infinitive: string;
  defaultPerson?: number;
  persons: [
    VerbPersonForms,
    VerbPersonForms,
    VerbPersonForms,
    VerbPersonForms,
    VerbPersonForms,
    VerbPersonForms
  ];
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
}

export interface DialogueTurn {
  speaker: string;
  el: string;
  ru: string;
}

export interface MiniDialogue {
  titleRu: string;
  titleEl: string;
  turns: DialogueTurn[];
}
