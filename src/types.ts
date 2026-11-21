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

export interface LessonQuestion {
  el: string;
  ru: string;
  answerEl?: string;
  answerRu?: string;
  note?: string;
}

export interface LessonExercise {
  id: string;
  titleEl: string;
  titleRu: string;
  instructionEl: string;
  instructionRu: string;
  wordBank?: string[];
  /** Paragraphs in Greek; wrap fill-in-the-blank answers in {{...}} */
  paragraphsEl: string[];
  /** Corresponding Russian translation paragraphs */
  paragraphsRu: string[];
}

export interface LessonLink {
  title: string;
  url: string;
  note?: string;
}

export interface Lesson {
  /** URL slug under /lessons/, e.g. 'lesson-1' */
  slug: string;
  /** Sequential lesson number (1, 2, 3...) */
  number: number;
  /** Display date with year, e.g. '16.11.2026' */
  date: string;
  titleRu: string;
  titleEl: string;
  subtitle: string;
  accent: 'aegean' | 'olive' | 'terracotta';
  /** Slugs of related topic sheets (e.g. ['location', 'travel']) */
  relatedTopics?: string[];
  /** Structured vocabulary & phrase sections (verbs sections open 3D Verb Cube!) */
  sections: TopicSection[];
  /** Grammar explanations from the teacher */
  grammarNotes?: GrammarTip[];
  /** Speaking / discussion questions (with optional model answers) */
  questions?: {
    titleRu: string;
    titleEl: string;
    items: LessonQuestion[];
  };
  /** Reading / fill-in-the-blank exercises */
  exercises?: LessonExercise[];
  /** External materials or links from the teacher */
  links?: LessonLink[];
}
