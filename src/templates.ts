import { GrammarTip, Lesson, LessonExercise, Topic, TopicSection, VocabItem } from './types';
import { resolveVerbLemmas } from './verbs';
import { dialoguesByTopic } from './topics/dialogues';
import { MiniDialogue } from './verbs/types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function countItems(topic: Topic): { words: number; phrases: number; total: number } {
  let words = 0;
  let phrases = 0;
  for (const section of topic.sections) {
    if (section.kind === 'phrases') {
      phrases += section.items.length;
    } else {
      words += section.items.length;
    }
  }
  return { words, phrases, total: words + phrases };
}

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

function renderHead(title: string, description: string, assetPrefix: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="theme-color" content="#1d4e89" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Greek Sheets" />
  <link rel="manifest" href="${assetPrefix}manifest.webmanifest" />
  <link rel="icon" type="image/svg+xml" href="${assetPrefix}assets/icon.svg" />
  <link rel="apple-touch-icon" sizes="180x180" href="${assetPrefix}assets/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif:wght@400;600&display=swap" rel="stylesheet" />
  <script>
    (function(){try{var t=localStorage.getItem('greek-sheets-theme');if(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)t='dark';if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#121519');}}catch(e){}})();
  </script>
  <link rel="stylesheet" href="${assetPrefix}assets/styles.css" />
</head>`;
}

function renderThemeToggle(): string {
  return `<button id="theme-toggle" class="theme-toggle" type="button" title="Переключить тему" aria-label="Переключить тему">
        <span class="theme-icon-sun" aria-hidden="true">☀</span>
        <span class="theme-icon-moon" aria-hidden="true">☾</span>
      </button>`;
}

function renderEntry(
  topicSlug: string,
  sectionId: string,
  item: VocabItem,
  isVerbSection: boolean
): string {
  const levelClass = item.level === 'A1' ? 'badge-a1' : 'badge-a2';
  const searchBlob = `${item.el} ${item.ru} ${item.note ?? ''}`;
  const speakText = item.el.replace(/,\s*-[^\s,]+/g, '').trim();
  const favId = `${topicSlug}::${sectionId}::${item.el}`;
  const verbLemmas = isVerbSection ? resolveVerbLemmas(item.el) : [];
  const isVerb = verbLemmas.length > 0;

  return `
    <article class="entry-card${isVerb ? ' is-verb' : ''}" data-level="${item.level}" data-search="${escapeHtml(searchBlob)}" data-fav-id="${escapeHtml(favId)}"${isVerb ? ` data-verbs="${escapeHtml(verbLemmas.join(','))}"` : ''}>
      <div class="entry-main">
        <div class="entry-el-row">
          <span class="entry-el" lang="el">${escapeHtml(item.el)}</span>
          ${isVerb ? '<span class="verb-forms-pill" aria-hidden="true">формы ↗</span>' : ''}
        </div>
        <div class="entry-ru">${escapeHtml(item.ru)}</div>
        ${item.note ? `<div class="entry-note">${escapeHtml(item.note)}</div>` : ''}
      </div>
      <div class="entry-side">
        <button class="fav-btn" type="button" data-fav-toggle="${escapeHtml(favId)}" title="Добавить в избранное" aria-label="Добавить в избранное" aria-pressed="false">☆</button>
        <button class="speak-btn" type="button" data-speak="${escapeHtml(speakText)}" title="Прослушать произношение" aria-label="Прослушать: ${escapeHtml(speakText)}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        </button>
        <span class="badge ${levelClass}">${item.level}</span>
      </div>
    </article>`;
}

function renderSection(topicSlug: string, section: TopicSection): string {
  const isVerbSection =
    section.id === 'verbs' ||
    (topicSlug === 'irregular-verbs' && section.kind === 'words');
  const isWideGrid = topicSlug === 'irregular-verbs' && section.kind === 'words';
  const listClass =
    section.kind === 'phrases'
      ? 'phrase-list'
      : isWideGrid
        ? 'word-grid word-grid-wide'
        : 'word-grid';
  return `
  <section class="vocab-section" id="${escapeHtml(section.id)}">
    <div class="section-header">
      <div class="section-title-group">
        <h2>${escapeHtml(section.titleRu)}</h2>
        <span class="section-el" lang="el">${escapeHtml(section.titleEl)}</span>
      </div>
      <span class="section-count">${section.items.length}</span>
    </div>
    <div class="${listClass}">
      ${section.items.map((item) => renderEntry(topicSlug, section.id, item, isVerbSection)).join('')}
    </div>
  </section>`;
}

function renderDialogue(dialogue: MiniDialogue): string {
  const speakers = Array.from(new Set(dialogue.turns.map((t) => t.speaker)));
  const turnsHtml = dialogue.turns
    .map((turn, idx) => {
      const sideClass = speakers.indexOf(turn.speaker) % 2 === 0 ? 'dialogue-turn-a' : 'dialogue-turn-b';
      return `
      <div class="dialogue-turn ${sideClass}" data-turn-index="${idx}">
        <div class="dialogue-turn-head">
          <span class="dialogue-speaker" lang="el">${escapeHtml(turn.speaker)}</span>
          <button class="speak-btn" type="button" data-speak="${escapeHtml(turn.el)}" title="Прослушать реплику" aria-label="Прослушать: ${escapeHtml(turn.el)}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
          </button>
        </div>
        <div class="dialogue-el" lang="el">${escapeHtml(turn.el)}</div>
        <div class="dialogue-ru">${escapeHtml(turn.ru)}</div>
      </div>`;
    })
    .join('');

  return `
  <section class="dialogue-section" id="dialogue">
    <div class="section-header">
      <div class="section-title-group">
        <h2>${escapeHtml(dialogue.titleRu)}</h2>
        <span class="section-el" lang="el">${escapeHtml(dialogue.titleEl)}</span>
      </div>
      <button id="play-dialogue-btn" class="tool-btn-outline dialogue-play-btn" type="button">
        ▶ Прослушать диалог
      </button>
    </div>
    <div class="dialogue-list">
      ${turnsHtml}
    </div>
  </section>`;
}

function renderVerbModal(): string {
  const personTabs = [
    { idx: 0, ru: 'Я', el: 'εγώ' },
    { idx: 1, ru: 'ТЫ', el: 'εσύ' },
    { idx: 2, ru: 'ОН', el: 'αυτός / -ή / -ό' },
    { idx: 3, ru: 'МЫ', el: 'εμείς' },
    { idx: 4, ru: 'ВЫ', el: 'εσείς' },
    { idx: 5, ru: 'ОНИ', el: 'αυτοί / -ές / -ά' },
  ];

  return `
  <div id="verb-modal" class="verb-modal" role="dialog" aria-modal="true" aria-labelledby="verb-modal-lemma" hidden>
    <div class="verb-backdrop" data-close-verb></div>
    <div class="verb-dialog">
      <div class="verb-topbar">
        <div class="verb-title-wrap">
          <div id="verb-switcher" class="verb-switcher" hidden></div>
          <div class="verb-heading-row">
            <h2 id="verb-modal-lemma" class="verb-modal-lemma" lang="el"></h2>
            <button id="verb-lemma-speak" class="speak-btn" type="button" title="Прослушать глагол" aria-label="Прослушать глагол">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            </button>
          </div>
          <div id="verb-modal-ru" class="verb-modal-ru"></div>
        </div>
        <button class="review-close" type="button" aria-label="Закрыть" data-close-verb>✕</button>
      </div>

      <div id="verb-person-tabs" class="verb-person-tabs" role="tablist" aria-label="Лицо и число">
        ${personTabs
          .map(
            (p) => `
          <button class="verb-person-tab${p.idx === 0 ? ' active' : ''}" type="button" role="tab" data-person-idx="${p.idx}" aria-selected="${p.idx === 0 ? 'true' : 'false'}">
            <span class="verb-tab-ru">${p.ru}</span>
            <span class="verb-tab-el" lang="el">${p.el}</span>
          </button>`
          )
          .join('')}
      </div>

      <div class="verb-person-header">
        <button id="verb-prev-person" class="verb-nav-arrow" type="button" aria-label="Предыдущее лицо">‹</button>
        <div class="verb-person-heading">
          <div id="verb-person-title" class="verb-person-title">Я (Εγώ)</div>
          <div id="verb-person-sub" class="verb-person-sub">1-е лицо · Единственное число</div>
        </div>
        <button id="verb-next-person" class="verb-nav-arrow" type="button" aria-label="Следующее лицо">›</button>
      </div>

      <div id="verb-cube-viewport" class="verb-cube-viewport" aria-live="polite">
        <div id="verb-cube" class="verb-cube">
          <div id="verb-face-current" class="verb-cube-face"></div>
          <div id="verb-face-next" class="verb-cube-face verb-cube-face-side"></div>
          <div id="verb-face-prev" class="verb-cube-face verb-cube-face-side"></div>
        </div>
      </div>

      <div class="verb-bottom-grid">
        <div class="verb-info-card">
          <div class="verb-info-title">ПОВЕЛИТЕЛЬНОЕ</div>
          <div class="verb-imp-group">
            <div class="verb-imp-sub">Разовое</div>
            <div class="verb-imp-row">
              <span>ед.ч.</span>
              <button id="verb-imp-sg" class="verb-imp-val" type="button" lang="el"></button>
            </div>
            <div class="verb-imp-row">
              <span>мн.ч.</span>
              <button id="verb-imp-pl" class="verb-imp-val" type="button" lang="el"></button>
            </div>
          </div>
          <div class="verb-imp-group">
            <div class="verb-imp-sub">Длительное</div>
            <div class="verb-imp-row">
              <span>ед.ч.</span>
              <button id="verb-imp-csg" class="verb-imp-val" type="button" lang="el"></button>
            </div>
            <div class="verb-imp-row">
              <span>мн.ч.</span>
              <button id="verb-imp-cpl" class="verb-imp-val" type="button" lang="el"></button>
            </div>
          </div>
        </div>

        <div class="verb-info-card">
          <div class="verb-info-title">ПРИЧАСТИЕ</div>
          <div class="verb-part-block">
            <div class="verb-imp-sub">активное</div>
            <button id="verb-part-active" class="verb-part-val" type="button" lang="el"></button>
          </div>
          <div id="verb-part-passive-wrap" class="verb-part-block" hidden>
            <div class="verb-imp-sub">страдательное</div>
            <button id="verb-part-passive" class="verb-part-val" type="button" lang="el"></button>
          </div>
        </div>
      </div>

      <div class="verb-swipe-hint">Свайпните блок времён влево/вправо или нажмите на любую форму для озвучки</div>
    </div>
  </div>`;
}

function renderGrammarCard(tip: GrammarTip): string {
  return `
    <aside class="tip-card">
      <div class="tip-label">Σημείωση · Грамматика</div>
      <h3>${escapeHtml(tip.title)}</h3>
      <p>${escapeHtml(tip.body)}</p>
      <div class="tip-examples">
        ${tip.examples
          .map(
            (ex) =>
              `<div class="tip-example"><strong lang="el">${escapeHtml(ex.el)}</strong> — <span>${escapeHtml(ex.ru)}</span></div>`
          )
          .join('')}
      </div>
    </aside>`;
}

function renderReviewModal(): string {
  return `
  <div id="review-modal" class="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title" hidden>
    <div class="review-backdrop" data-close-review></div>
    <div class="review-dialog">
      <div class="review-header">
        <div class="review-header-left">
          <span id="review-title" class="review-title">Повторение</span>
          <span id="review-progress-text" class="badge badge-muted">1 / 1</span>
        </div>
        <div class="review-header-right">
          <button id="review-shuffle-btn" class="tool-btn-outline" type="button" title="Перемешать карточки">Перемешать</button>
          <button id="review-close-btn" class="review-close" type="button" aria-label="Закрыть" data-close-review>✕</button>
        </div>
      </div>

      <div class="review-progress-track" aria-hidden="true">
        <div id="review-progress-bar" class="review-progress-bar"></div>
      </div>

      <div id="review-stage" class="review-stage">
        <div id="flashcard" class="flashcard" role="button" tabindex="0" aria-label="Перевернуть карточку">
          <div class="flashcard-face flashcard-front">
            <div class="flashcard-meta">
              <span id="card-section-front" class="flashcard-section"></span>
              <span id="card-level-front" class="badge badge-a1">A1</span>
            </div>
            <div class="flashcard-lang">Русский</div>
            <div id="card-ru" class="flashcard-text"></div>
            <div class="flashcard-hint">Нажмите на карточку, чтобы перевернуть</div>
          </div>
          <div class="flashcard-face flashcard-back">
            <div class="flashcard-meta">
              <span id="card-section-back" class="flashcard-section"></span>
              <span id="card-level-back" class="badge badge-a1">A1</span>
            </div>
            <div class="flashcard-lang">Ελληνικά</div>
            <div id="card-el" class="flashcard-text flashcard-text-el" lang="el"></div>
            <div id="card-note" class="flashcard-note"></div>
            <button id="card-speak-btn" class="speak-btn flashcard-speak" type="button" title="Прослушать произношение" aria-label="Прослушать произношение">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
              <span>Озвучить</span>
            </button>
          </div>
        </div>
      </div>

      <div id="review-done" class="review-done" hidden>
        <div class="review-done-icon" aria-hidden="true">✓</div>
        <h3>Отлично! Все карточки пройдены</h3>
        <p id="review-done-summary"></p>
        <div class="review-done-actions">
          <button id="review-restart-btn" class="tool-btn-primary" type="button">Пройти ещё раз</button>
          <button class="tool-btn-outline" type="button" data-close-review>Вернуться к листу</button>
        </div>
      </div>

      <div id="review-controls" class="review-controls">
        <button id="review-prev-btn" class="tool-btn-outline" type="button">← Назад</button>
        <button id="review-flip-btn" class="tool-btn-outline" type="button">Перевернуть</button>
        <button id="review-next-btn" class="tool-btn-primary" type="button">Дальше →</button>
      </div>
    </div>
  </div>`;
}

function renderClozeParagraph(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(
    /\{\{([^}]+)\}\}/g,
    '<button class="cloze-blank" type="button" title="Нажмите, чтобы показать/скрыть ответ">$1</button>'
  );
}

function renderExercise(exercise: LessonExercise): string {
  const plainGreekText = exercise.paragraphsEl
    .map((p) => p.replace(/\{\{([^}]+)\}\}/g, '$1'))
    .join(' ');

  return `
  <section class="exercise-section" id="${escapeHtml(exercise.id)}">
    <div class="section-header">
      <div class="section-title-group">
        <h2>${escapeHtml(exercise.titleRu)}</h2>
        <span class="section-el" lang="el">${escapeHtml(exercise.titleEl)}</span>
      </div>
      <div class="exercise-actions">
        <button class="tool-btn-outline exercise-practice-btn" type="button" aria-pressed="false">Режим тренировки</button>
        <button class="tool-btn-outline exercise-trans-btn" type="button" aria-pressed="false">Перевод</button>
        <button class="tool-btn-outline exercise-speak-btn" type="button" data-speak-text="${escapeHtml(plainGreekText)}">▶ Прослушать</button>
      </div>
    </div>

    <div class="exercise-card">
      <div class="exercise-instruction">
        <strong lang="el">${escapeHtml(exercise.instructionEl)}</strong>
        <span>${escapeHtml(exercise.instructionRu)}</span>
      </div>
      ${
        exercise.wordBank && exercise.wordBank.length > 0
          ? `<div class="word-bank" aria-label="Слова для подстановки">
              ${exercise.wordBank
                .map((w) => `<span class="word-bank-chip" lang="el">${escapeHtml(w)}</span>`)
                .join('')}
            </div>`
          : ''
      }
      <div class="exercise-paragraphs">
        ${exercise.paragraphsEl
          .map(
            (pEl, idx) => `
          <div class="exercise-para-block">
            <p class="exercise-para-el" lang="el">${renderClozeParagraph(pEl)}</p>
            ${
              exercise.paragraphsRu[idx]
                ? `<p class="exercise-para-ru" hidden>${escapeHtml(exercise.paragraphsRu[idx])}</p>`
                : ''
            }
          </div>`
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

export function renderIndexPage(topics: Topic[], lessons: Lesson[]): string {
  const totalEntries = topics.reduce((sum, t) => sum + countItems(t).total, 0);

  const cardsHtml = topics
    .map((topic) => {
      const counts = countItems(topic);
      const levelsHtml = topic.levels
        .map((lvl) => `<span class="badge ${lvl === 'A1' ? 'badge-a1' : 'badge-a2'}">${lvl}</span>`)
        .join('');

      return `
      <a class="topic-card" href="./${escapeHtml(topic.slug)}/" data-accent="${topic.accent}">
        <div>
          <div class="topic-card-top">
            <span class="topic-icon" aria-hidden="true">${topic.icon}</span>
            <div class="topic-card-levels">${levelsHtml}</div>
          </div>
          <h2>${escapeHtml(topic.titleRu)}</h2>
          <div class="topic-card-el" lang="el">${escapeHtml(topic.titleEl)}</div>
          <p>${escapeHtml(topic.subtitle)}</p>
        </div>
        <div class="topic-card-footer">
          <span>${pluralRu(counts.words, 'слово', 'слова', 'слов')} · ${pluralRu(counts.phrases, 'фраза', 'фразы', 'фраз')}</span>
          <span class="topic-card-cta">Открыть →</span>
        </div>
      </a>`;
    })
    .join('');

  const lessonPreviewHtml = lessons
    .map((lesson) => {
      const wordCount = lesson.sections.reduce((s, sec) => s + sec.items.length, 0);
      const qCount = lesson.questions ? lesson.questions.items.length : 0;
      const exCount = lesson.exercises ? lesson.exercises.length : 0;
      const metaParts = [pluralRu(wordCount, 'слово', 'слова', 'слов')];
      if (qCount > 0) metaParts.push(pluralRu(qCount, 'вопрос', 'вопроса', 'вопросов'));
      if (exCount > 0) metaParts.push(pluralRu(exCount, 'текст', 'текста', 'текстов'));

      return `
      <a class="lesson-preview-card" href="./lessons/${escapeHtml(lesson.slug)}/" data-accent="${lesson.accent}">
        <div class="lesson-preview-top">
          <span class="badge badge-a1">Урок ${lesson.number}</span>
          <span class="lesson-date">${escapeHtml(lesson.date)}</span>
        </div>
        <div class="lesson-preview-title">${escapeHtml(lesson.titleRu)}</div>
        <div class="lesson-preview-el" lang="el">${escapeHtml(lesson.titleEl)}</div>
        <div class="lesson-preview-foot">
          <span>${metaParts.join(' · ')}</span>
          <span class="topic-card-cta">Открыть →</span>
        </div>
      </a>`;
    })
    .join('');

  return `${renderHead(
    'Greek Sheets — Слова и фразы на греческом (A1–A2)',
    'Минималистичные тематические шпаргалки для изучения новогреческого языка уровня A1–A2.',
    './'
  )}
<body data-sw="./sw.js" data-assets="./assets/">
  <header class="topbar">
    <div class="container topbar-inner">
      <a class="brand" href="./">
        <span class="brand-mark" aria-hidden="true">Ελ</span>
        <span>Greek Sheets</span>
      </a>
      <div class="topbar-actions">
        <nav class="topbar-nav" aria-label="Темы">
          <a class="topbar-pill topbar-pill-lessons" href="./lessons/">Уроки (${lessons.length})</a>
          ${topics
            .map(
              (t) => `<a class="topbar-pill" href="./${escapeHtml(t.slug)}/">${escapeHtml(t.titleRu)}</a>`
            )
            .join('')}
        </nav>
        ${renderThemeToggle()}
      </div>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <div class="hero-eyebrow">Ελληνικά · A1–A2</div>
      <h1>Тематические листы по греческому</h1>
      <p class="hero-desc">
        Короткие и понятные подборки слов, глаголов и живых фраз для подготовки к экзаменам Ελληνομάθεια A1–A2 и конспекты уроков с преподавателем.
      </p>
      <div class="hero-meta">
        <a class="badge badge-a1" href="./lessons/">${pluralRu(lessons.length, 'урок', 'урока', 'уроков')}</a>
        <span class="badge badge-a2">${pluralRu(topics.length, 'тема', 'темы', 'тем')}</span>
        <span class="badge badge-muted">${pluralRu(totalEntries, 'выражение', 'выражения', 'выражений')}</span>
        <button id="install-app-btn" class="install-btn" type="button" hidden>
          <span aria-hidden="true">↓</span>
          <span>Установить на телефон</span>
        </button>
      </div>
      <div id="ios-install-hint" class="ios-install-hint" hidden>
        <div>
          <strong>Установка на iPhone / iPad:</strong> нажмите кнопку <strong>«Поделиться»</strong> внизу экрана и выберите <strong>«На экран „Домой“»</strong>. Приложение будет работать даже офлайн.
        </div>
        <button id="ios-hint-close" class="ios-hint-close" type="button" aria-label="Закрыть подсказку">✕</button>
      </div>
    </section>

    <section class="home-search-bar" aria-label="Глобальный поиск и избранное">
      <div class="search-wrap">
        <input
          id="global-search-input"
          class="search-input"
          type="search"
          placeholder="Поиск по всем темам и урокам (на русском или греческом)..."
          autocomplete="off"
        />
      </div>
      <button id="home-fav-toggle" class="tool-btn-outline" type="button" aria-pressed="false">
        ★ Избранное <span id="home-fav-count" class="fav-count-pill">0</span>
      </button>
    </section>

    <section id="global-results-panel" class="global-results-panel" hidden>
      <div class="global-results-header">
        <h2 id="global-results-title">Результаты поиска</h2>
        <button id="global-results-clear" class="tool-btn-outline" type="button">Показать всё</button>
      </div>
      <div id="global-results-list" class="phrase-list"></div>
      <div id="global-results-empty" class="empty-state">
        Ничего не найдено.
      </div>
    </section>

    <div id="home-browse-content">
      <section class="home-lessons-block" aria-label="Уроки с преподавателем">
        <div class="home-block-header">
          <div class="home-block-title-group">
            <h2>Уроки с преподавателем</h2>
            <span class="section-el" lang="el">Μαθήματα</span>
          </div>
          <a class="home-block-link" href="./lessons/">Все уроки (${lessons.length}) →</a>
        </div>
        <div class="lessons-preview-grid">
          ${lessonPreviewHtml}
        </div>
      </section>

      <div class="home-block-header">
        <div class="home-block-title-group">
          <h2>Тематические листы</h2>
          <span class="section-el" lang="el">Θεματικά φύλλα</span>
        </div>
        <span class="section-count">${topics.length}</span>
      </div>

      <section id="topics-grid" class="topics-grid" aria-label="Список тем">
        ${cardsHtml}
      </section>
    </div>

    <section class="study-guide" aria-label="Как пользоваться">
      <div class="guide-item">
        <strong>Режим самопроверки</strong>
        <span>На любой странице можно скрыть греческий или перевод и открывать карточки кликом.</span>
      </div>
      <div class="guide-item">
        <strong>Озвучка фраз</strong>
        <span>Нажмите на значок динамика рядом со словом, чтобы услышать произношение.</span>
      </div>
      <div class="guide-item">
        <strong>Работает офлайн</strong>
        <span>Установите сайт на экран телефона как приложение — все темы доступны без интернета.</span>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <span>Greek Sheets · Новогреческий язык A1–A2</span>
      <span>Ελληνικά για κάθε μέρα</span>
    </div>
  </footer>

  ${renderVerbModal()}

  <script src="./assets/app.js"></script>
</body>
</html>
`;
}

export function renderTopicPage(topic: Topic, allTopics: Topic[]): string {
  const counts = countItems(topic);
  const otherTopics = allTopics.filter((t) => t.slug !== topic.slug);
  const dialogue = dialoguesByTopic[topic.slug];

  const levelsHtml = topic.levels
    .map((lvl) => `<span class="badge ${lvl === 'A1' ? 'badge-a1' : 'badge-a2'}">${lvl}</span>`)
    .join('');

  const tipHtml = topic.tip
    ? `
    <aside class="tip-card">
      <div class="tip-label">Σημείωση · Подсказка</div>
      <h3>${escapeHtml(topic.tip.title)}</h3>
      <p>${escapeHtml(topic.tip.body)}</p>
      <div class="tip-examples">
        ${topic.tip.examples
          .map(
            (ex) =>
              `<div class="tip-example"><strong lang="el">${escapeHtml(ex.el)}</strong> — <span>${escapeHtml(ex.ru)}</span></div>`
          )
          .join('')}
      </div>
    </aside>`
    : '';

  return `${renderHead(
    `${topic.titleRu} (${topic.titleEl}) — Greek Sheets`,
    topic.subtitle,
    '../'
  )}
<body data-accent="${topic.accent}" data-sw="../sw.js" data-assets="../assets/">
  <header class="topbar">
    <div class="container topbar-inner">
      <a class="back-link" href="../">← Все темы</a>
      <div class="topbar-actions">
        <nav class="topbar-nav" aria-label="Переключение тем">
          ${allTopics
            .map(
              (t) =>
                `<a class="topbar-pill ${t.slug === topic.slug ? 'active' : ''}" href="../${escapeHtml(t.slug)}/">${escapeHtml(t.titleRu)}</a>`
            )
            .join('')}
        </nav>
        ${renderThemeToggle()}
      </div>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <div class="hero-eyebrow">${topic.icon} Тематический лист</div>
      <h1>${escapeHtml(topic.titleRu)}</h1>
      <div class="hero-el" lang="el">${escapeHtml(topic.titleEl)}</div>
      <p class="hero-desc">${escapeHtml(topic.subtitle)}</p>
      <div class="hero-meta">
        ${levelsHtml}
        <span class="badge badge-muted">${pluralRu(counts.words, 'слово', 'слова', 'слов')}</span>
        <span class="badge badge-muted">${pluralRu(counts.phrases, 'фраза', 'фразы', 'фраз')}</span>
      </div>
    </section>

    <div class="toolbar" role="region" aria-label="Инструменты изучения">
      <div class="search-wrap">
        <input
          id="search-input"
          class="search-input"
          type="search"
          placeholder="Поиск на греческом или русском..."
          autocomplete="off"
        />
      </div>
      <div class="toolbar-group" role="group" aria-label="Фильтр по уровню">
        <button class="tool-btn active" type="button" data-level-filter="all">Все</button>
        <button class="tool-btn" type="button" data-level-filter="A1">A1</button>
        <button class="tool-btn" type="button" data-level-filter="A2">A2</button>
      </div>
      <button id="fav-filter-btn" class="tool-btn-outline" type="button" aria-pressed="false">★ Избранное</button>
      <button id="mask-el-btn" class="tool-btn-outline" type="button">Скрыть греческий</button>
      <button id="mask-ru-btn" class="tool-btn-outline" type="button">Скрыть перевод</button>
      <button id="review-btn" class="tool-btn-primary" type="button">Повторить</button>
      <button id="print-btn" class="tool-btn-outline" type="button">Печать</button>
    </div>

    <nav class="section-jumps" aria-label="Разделы темы">
      ${topic.sections
        .map(
          (s) => `<a class="jump-link" href="#${escapeHtml(s.id)}">${escapeHtml(s.titleRu)}</a>`
        )
        .join('')}
      ${dialogue ? '<a class="jump-link jump-link-dialogue" href="#dialogue">Мини-диалог</a>' : ''}
    </nav>

    ${tipHtml}

    <div id="empty-state" class="empty-state">
      По вашему запросу ничего не найдено. Попробуйте очистить поиск или переключить уровень.
    </div>

    ${topic.sections.map((s) => renderSection(topic.slug, s)).join('')}

    ${dialogue ? renderDialogue(dialogue) : ''}

    ${
      otherTopics.length > 0
        ? `
    <section class="other-topics">
      <h2 class="other-topics-title">Другие темы</h2>
      <div class="other-topics-list">
        ${otherTopics
          .map(
            (t) =>
              `<a class="other-topic-link" href="../${escapeHtml(t.slug)}/"><span>${t.icon}</span><span>${escapeHtml(t.titleRu)}</span></a>`
          )
          .join('')}
      </div>
    </section>`
        : ''
    }
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <span><a href="../">← На главную Greek Sheets</a></span>
      <span>Подсказка: в режиме скрытия кликните на карточку, чтобы подсмотреть ответ</span>
    </div>
  </footer>

  ${renderReviewModal()}

  ${renderVerbModal()}

  <script src="../assets/app.js"></script>
</body>
</html>
`;
}

export function renderLessonsIndexPage(lessons: Lesson[]): string {
  const totalWords = lessons.reduce(
    (sum, l) => sum + l.sections.reduce((s, sec) => s + sec.items.length, 0),
    0
  );

  const cardsHtml = lessons
    .map((lesson) => {
      const wordCount = lesson.sections.reduce((s, sec) => s + sec.items.length, 0);
      const qCount = lesson.questions ? lesson.questions.items.length : 0;
      const exCount = lesson.exercises ? lesson.exercises.length : 0;
      const parts = [pluralRu(wordCount, 'слово', 'слова', 'слов')];
      if (qCount > 0) parts.push(pluralRu(qCount, 'вопрос', 'вопроса', 'вопросов'));
      if (exCount > 0) parts.push(pluralRu(exCount, 'упражнение', 'упражнения', 'упражнений'));

      return `
      <a class="topic-card" href="./${escapeHtml(lesson.slug)}/" data-accent="${lesson.accent}">
        <div>
          <div class="topic-card-top">
            <span class="lesson-num-badge">Урок ${lesson.number}</span>
            <span class="badge badge-muted">${escapeHtml(lesson.date)}</span>
          </div>
          <h2>${escapeHtml(lesson.titleRu)}</h2>
          <div class="topic-card-el" lang="el">${escapeHtml(lesson.titleEl)}</div>
          <p>${escapeHtml(lesson.subtitle)}</p>
        </div>
        <div class="topic-card-footer">
          <span>${parts.join(' · ')}</span>
          <span class="topic-card-cta">Открыть →</span>
        </div>
      </a>`;
    })
    .join('');

  return `${renderHead(
    'Уроки (Μαθήματα) — Greek Sheets',
    'Конспекты уроков греческого языка по датам: слова, грамматика, вопросы и упражнения.',
    '../'
  )}
<body data-sw="../sw.js" data-assets="../assets/">
  <header class="topbar">
    <div class="container topbar-inner">
      <a class="back-link" href="../">← На главную</a>
      <div class="topbar-actions">
        <nav class="topbar-nav" aria-label="Уроки">
          ${lessons
            .map(
              (l) =>
                `<a class="topbar-pill" href="./${escapeHtml(l.slug)}/">Урок ${l.number} · ${escapeHtml(l.date)}</a>`
            )
            .join('')}
        </nav>
        ${renderThemeToggle()}
      </div>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <div class="hero-eyebrow">Μαθήματα · Конспекты</div>
      <h1>Уроки с преподавателем</h1>
      <p class="hero-desc">
        Слова, грамматические заметки, вопросы для разговора и упражнения, разложенные по урокам и датам.
      </p>
      <div class="hero-meta">
        <span class="badge badge-a1">${pluralRu(lessons.length, 'урок', 'урока', 'уроков')}</span>
        <span class="badge badge-muted">${pluralRu(totalWords, 'слово', 'слова', 'слов')}</span>
      </div>
    </section>

    <section class="topics-grid" aria-label="Список уроков">
      ${cardsHtml}
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <span><a href="../">← Все тематические листы</a></span>
      <span>Greek Sheets · Μαθήματα</span>
    </div>
  </footer>

  <script src="../assets/app.js"></script>
</body>
</html>
`;
}

export function renderLessonPage(lesson: Lesson, allLessons: Lesson[]): string {
  const wordCount = lesson.sections.reduce((s, sec) => s + sec.items.length, 0);
  const idx = allLessons.findIndex((l) => l.slug === lesson.slug);
  const prevLesson = idx > 0 ? allLessons[idx - 1] : null;
  const nextLesson = idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;

  const grammarHtml =
    lesson.grammarNotes && lesson.grammarNotes.length > 0
      ? `
      <section class="lesson-grammar-section" id="grammar">
        <div class="section-header">
          <div class="section-title-group">
            <h2>Грамматика урока</h2>
            <span class="section-el" lang="el">Γραμματική</span>
          </div>
          <span class="section-count">${lesson.grammarNotes.length}</span>
        </div>
        <div class="grammar-cards-stack">
          ${lesson.grammarNotes.map(renderGrammarCard).join('')}
        </div>
      </section>`
      : '';

  const questionsHtml = lesson.questions
    ? `
    <section class="lesson-questions-section" id="questions">
      <div class="section-header">
        <div class="section-title-group">
          <h2>${escapeHtml(lesson.questions.titleRu)}</h2>
          <span class="section-el" lang="el">${escapeHtml(lesson.questions.titleEl)}</span>
        </div>
        <span class="section-count">${lesson.questions.items.length}</span>
      </div>
      <div class="questions-list">
        ${lesson.questions.items
          .map(
            (q, qIdx) => `
          <article class="question-card">
            <div class="question-head">
              <span class="question-num">${qIdx + 1}</span>
              <div class="question-main">
                <div class="question-el" lang="el">${escapeHtml(q.el)}</div>
                <div class="question-ru">${escapeHtml(q.ru)}</div>
                ${q.note ? `<div class="entry-note">${escapeHtml(q.note)}</div>` : ''}
              </div>
              <button class="speak-btn" type="button" data-speak="${escapeHtml(q.el)}" title="Прослушать вопрос" aria-label="Прослушать вопрос">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              </button>
            </div>
            ${
              q.answerEl
                ? `<div class="question-answer">
                    <div class="question-answer-head">
                      <span class="question-answer-label">Ответ</span>
                      <button class="speak-btn" type="button" data-speak="${escapeHtml(q.answerEl)}" title="Прослушать ответ" aria-label="Прослушать ответ">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                        </svg>
                      </button>
                    </div>
                    <div class="question-el" lang="el">${escapeHtml(q.answerEl)}</div>
                    ${q.answerRu ? `<div class="question-ru">${escapeHtml(q.answerRu)}</div>` : ''}
                  </div>`
                : ''
            }
          </article>`
          )
          .join('')}
      </div>
    </section>`
    : '';

  const exercisesHtml =
    lesson.exercises && lesson.exercises.length > 0
      ? lesson.exercises.map(renderExercise).join('')
      : '';

  const linksHtml =
    lesson.links && lesson.links.length > 0
      ? `
      <section class="lesson-links-section" id="links">
        <div class="section-header">
          <div class="section-title-group">
            <h2>Материалы и ссылки</h2>
            <span class="section-el" lang="el">Σύνδεσμοι</span>
          </div>
        </div>
        <div class="lesson-links-list">
          ${lesson.links
            .map(
              (link) => `
            <a class="lesson-link-card" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
              <div>
                <strong>${escapeHtml(link.title)}</strong>
                ${link.note ? `<span>${escapeHtml(link.note)}</span>` : ''}
                <div class="lesson-link-url">${escapeHtml(link.url)}</div>
              </div>
              <span class="topic-card-cta" aria-hidden="true">↗</span>
            </a>`
            )
            .join('')}
        </div>
      </section>`
      : '';

  return `${renderHead(
    `Урок ${lesson.number} (${lesson.date}) — ${lesson.titleRu} · Greek Sheets`,
    lesson.subtitle,
    '../../'
  )}
<body data-accent="${lesson.accent}" data-sw="../../sw.js" data-assets="../../assets/">
  <header class="topbar">
    <div class="container topbar-inner">
      <a class="back-link" href="../">← Все уроки</a>
      <div class="topbar-actions">
        <nav class="topbar-nav" aria-label="Переключение уроков">
          ${allLessons
            .map(
              (l) =>
                `<a class="topbar-pill ${l.slug === lesson.slug ? 'active' : ''}" href="../${escapeHtml(l.slug)}/">Урок ${l.number} · ${escapeHtml(l.date)}</a>`
            )
            .join('')}
          <a class="topbar-pill" href="../../">Темы</a>
        </nav>
        ${renderThemeToggle()}
      </div>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <div class="hero-eyebrow">Урок ${lesson.number} · ${escapeHtml(lesson.date)}</div>
      <h1>${escapeHtml(lesson.titleRu)}</h1>
      <div class="hero-el" lang="el">${escapeHtml(lesson.titleEl)}</div>
      <p class="hero-desc">${escapeHtml(lesson.subtitle)}</p>
      <div class="hero-meta">
        <span class="badge badge-a1">${escapeHtml(lesson.date)}</span>
        <span class="badge badge-muted">${pluralRu(wordCount, 'слово', 'слова', 'слов')}</span>
        ${lesson.questions ? `<span class="badge badge-muted">${pluralRu(lesson.questions.items.length, 'вопрос', 'вопроса', 'вопросов')}</span>` : ''}
        ${lesson.exercises ? `<span class="badge badge-a2">${pluralRu(lesson.exercises.length, 'упражнение', 'упражнения', 'упражнений')}</span>` : ''}
      </div>
    </section>

    <div class="toolbar" role="region" aria-label="Инструменты изучения">
      <div class="search-wrap">
        <input
          id="search-input"
          class="search-input"
          type="search"
          placeholder="Поиск по уроку..."
          autocomplete="off"
        />
      </div>
      <button id="fav-filter-btn" class="tool-btn-outline" type="button" aria-pressed="false">★ Избранное</button>
      <button id="mask-el-btn" class="tool-btn-outline" type="button">Скрыть греческий</button>
      <button id="mask-ru-btn" class="tool-btn-outline" type="button">Скрыть перевод</button>
      <button id="review-btn" class="tool-btn-primary" type="button">Повторить</button>
      <button id="print-btn" class="tool-btn-outline" type="button">Печать</button>
    </div>

    <nav class="section-jumps" aria-label="Разделы урока">
      ${lesson.sections
        .map(
          (s) => `<a class="jump-link" href="#${escapeHtml(s.id)}">${escapeHtml(s.titleRu)}</a>`
        )
        .join('')}
      ${lesson.grammarNotes?.length ? '<a class="jump-link" href="#grammar">Грамматика</a>' : ''}
      ${lesson.questions ? '<a class="jump-link" href="#questions">Вопросы</a>' : ''}
      ${lesson.exercises?.map((ex) => `<a class="jump-link" href="#${escapeHtml(ex.id)}">${escapeHtml(ex.titleEl)}</a>`).join('') ?? ''}
      ${lesson.links?.length ? '<a class="jump-link" href="#links">Ссылки</a>' : ''}
    </nav>

    <div id="empty-state" class="empty-state">
      По вашему запросу ничего не найдено.
    </div>

    ${lesson.sections.map((s) => renderSection(`lesson-${lesson.number}`, s)).join('')}

    ${grammarHtml}

    ${questionsHtml}

    ${exercisesHtml}

    ${linksHtml}

    <section class="other-topics">
      <h2 class="other-topics-title">Навигация по урокам</h2>
      <div class="other-topics-list">
        ${prevLesson ? `<a class="other-topic-link" href="../${escapeHtml(prevLesson.slug)}/">← Урок ${prevLesson.number} (${escapeHtml(prevLesson.date)})</a>` : ''}
        <a class="other-topic-link" href="../">Все уроки (${allLessons.length})</a>
        ${nextLesson ? `<a class="other-topic-link" href="../${escapeHtml(nextLesson.slug)}/">Урок ${nextLesson.number} (${escapeHtml(nextLesson.date)}) →</a>` : ''}
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <span><a href="../../">← На главную Greek Sheets</a></span>
      <span>Урок ${lesson.number} · ${escapeHtml(lesson.date)}</span>
    </div>
  </footer>

  ${renderReviewModal()}

  ${renderVerbModal()}

  <script src="../../assets/app.js"></script>
</body>
</html>
`;
}
