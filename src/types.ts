export type CefrLevel = 'A1' | 'A2';

export interface VocabItem {
  /** Greek word or phrase (with article if applicable) */
  el: string;
  /** Russian translation */
  ru: string;
  /** Optional short pronunciation or grammar hint (e.g. plural, usage note) */
  note?: string;
  /** CEFR level */
  level: CefrLevel;
}

export interface TopicSection {
  id: string;
  titleRu: string;
  titleEl: string;
  kind: 'words' | 'phrases';
  items: VocabItem[];
}

export interface GrammarTip {
  title: string;
  body: string;
  examples: { el: string; ru: string }[];
}

export interface Topic {
  slug: string;
  titleRu: string;
  titleEl: string;
  subtitle: string;
  levels: CefrLevel[];
  icon: string;
  accent: 'aegean' | 'olive' | 'terracotta';
  sections: TopicSection[];
  tip?: GrammarTip;
}
