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
    </div>
  </div>`;
}

function renderToolsMenu(opts: {
  searchPlaceholder: string;
  showLevels: boolean;
  jumps: { href: string; label: string }[];
  extraLinks?: { href: string; label: string }[];
}): string {
  return `
  <div id="tools-menu" class="tools-menu" hidden>
    <div class="tools-menu-backdrop" data-close-tools></div>
    <div class="tools-menu-sheet" role="dialog" aria-label="Фильтры и разделы">
      <div class="tools-menu-head">
        <span>Фильтры и навигация</span>
        <button class="review-close" type="button" aria-label="Закрыть меню" data-close-tools>✕</button>
      </div>

      <div class="tools-menu-block">
        <input
          id="search-input"
          class="search-input"
          type="search"
          placeholder="${escapeHtml(opts.searchPlaceholder)}"
          autocomplete="off"
        />
      </div>

      ${
        opts.showLevels
          ? `<div class="tools-menu-block">
              <div class="tools-menu-label">Уровень</div>
              <div class="toolbar-group" role="group" aria-label="Фильтр по уровню">
                <button class="tool-btn active" type="button" data-level-filter="all">Все</button>
                <button class="tool-btn" type="button" data-level-filter="A1">A1</button>
                <button class="tool-btn" type="button" data-level-filter="A2">A2</button>
              </div>
            </div>`
          : ''
      }

      <div class="tools-menu-block">
        <div class="tools-menu-label">Режимы</div>
        <div class="tools-menu-pills">
          <button id="fav-filter-btn" class="tool-btn-outline" type="button" aria-pressed="false">★ Избранное</button>
          <button id="mask-el-btn" class="tool-btn-outline" type="button">Скрыть греческий</button>
          <button id="mask-ru-btn" class="tool-btn-outline" type="button">Скрыть перевод</button>
          <button id="print-btn" class="tool-btn-outline" type="button">Печать</button>
        </div>
      </div>

      ${
        opts.jumps.length > 0
          ? `<div class="tools-menu-block">
              <div class="tools-menu-label">Разделы</div>
              <nav class="tools-menu-pills" aria-label="Разделы">
                ${opts.jumps
                  .map(
                    (j) => `<a class="jump-link" href="${escapeHtml(j.href)}" data-close-tools>${escapeHtml(j.label)}</a>`
                  )
                  .join('')}
              </nav>
            </div>`
          : ''
      }

      ${
        opts.extraLinks && opts.extraLinks.length > 0
          ? `<div class="tools-menu-block">
              <div class="tools-menu-label">Перейти</div>
              <div class="tools-menu-pills">
                ${opts.extraLinks
                  .map(
                    (l) => `<a class="jump-link" href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`
                  )
                  .join('')}
              </div>
            </div>`
          : ''
      }
    </div>
  </div>`;
}

function renderToolsMenuTrigger(): string {
  return `<button id="tools-menu-btn" class="icon-btn" type="button" aria-expanded="false" aria-controls="tools-menu" title="Поиск, фильтры и разделы" aria-label="Поиск, фильтры и разделы">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="14" y2="18"></line>
          </svg>
          <span id="tools-active-dot" class="tools-active-dot" hidden></span>
        </button>`;
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
        <button class="tool-btn-outline exercise-practice-btn" type="button" aria-pressed="false">Тренировка</button>
        <button class="tool-btn-outline exercise-trans-btn" type="button" aria-pressed="false">Перевод</button>
        <button class="tool-btn-outline exercise-speak-btn" type="button" data-speak-text="${escapeHtml(plainGreekText)}">▶</button>
      </div>
    </div>

    <div class="exercise-card">
      <div class="exercise-instruction">
        <strong lang="el">${escapeHtml(exercise.instructionEl)}</strong>
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

export function renderIndexPage(topics: Topic[], _lessons: Lesson[]): string {
  const cardsHtml = topics
    .map((topic) => {
      const counts = countItems(topic);

      return `
      <a class="topic-card topic-card-compact" href="./${escapeHtml(topic.slug)}/" data-accent="${topic.accent}">
        <div class="topic-card-row">
          <span class="topic-icon" aria-hidden="true">${topic.icon}</span>
          <div class="topic-card-body">
            <h2>${escapeHtml(topic.titleRu)}</h2>
            <div class="topic-card-el" lang="el">${escapeHtml(topic.titleEl)}</div>
          </div>
          <span class="topic-card-count">${counts.total}</span>
        </div>
      </a>`;
    })
    .join('');

  return `${renderHead(
    'Greek Sheets — Ελληνικά A1–A2',
    'Тематические листы и уроки для изучения новогреческого языка уровня A1–A2.',
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
        <a class="topbar-pill topbar-pill-lessons" href="./lessons/">В уроки</a>
        <button id="home-fav-toggle" class="icon-btn icon-btn-fav" type="button" aria-pressed="false" title="Избранное" aria-label="Избранное">
          <span aria-hidden="true">★</span>
          <span id="home-fav-count" class="icon-badge">0</span>
        </button>
        <button id="home-search-toggle" class="icon-btn" type="button" aria-expanded="false" aria-controls="home-search-drawer" title="Поиск" aria-label="Поиск">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        <button id="install-app-btn" class="icon-btn" type="button" title="Установить на телефон" aria-label="Установить на телефон" hidden>↓</button>
        ${renderThemeToggle()}
      </div>
    </div>
  </header>

  <main class="container page-main">
    <div id="ios-install-hint" class="ios-install-hint" hidden>
      <div><strong>На iPhone:</strong> «Поделиться» → «На экран „Домой“»</div>
      <button id="ios-hint-close" class="ios-hint-close" type="button" aria-label="Закрыть">✕</button>
    </div>

    <div id="home-search-drawer" class="home-search-drawer" hidden>
      <input
        id="global-search-input"
        class="search-input"
        type="search"
        placeholder="Поиск по темам и урокам..."
        autocomplete="off"
      />
    </div>

    <section id="global-results-panel" class="global-results-panel" hidden>
      <div class="global-results-header">
        <h2 id="global-results-title">Результаты</h2>
        <button id="global-results-clear" class="tool-btn-outline" type="button">Закрыть</button>
      </div>
      <div id="global-results-list" class="phrase-list"></div>
      <div id="global-results-empty" class="empty-state">
        Ничего не найдено.
      </div>
    </section>

    <div id="home-browse-content">
      <div class="home-block-header">
        <div class="home-block-title-group">
          <h2>Темы</h2>
          <span class="section-el" lang="el">Θέματα A1–A2</span>
        </div>
        <span class="section-count">${topics.length}</span>
      </div>

      <section id="topics-grid" class="topics-grid" aria-label="Список тем">
        ${cardsHtml}
      </section>
    </div>
  </main>

  ${renderVerbModal()}

  <script src="./assets/app.js"></script>
</body>
</html>
`;
}

export function renderTopicPage(topic: Topic, allTopics: Topic[]): string {
  const otherTopics = allTopics.filter((t) => t.slug !== topic.slug);
  const dialogue = dialoguesByTopic[topic.slug];

  const tipHtml = topic.tip
    ? `
    <details class="tip-collapsible">
      <summary class="tip-collapsible-summary">
        <span class="tip-label-inline">Σημείωση</span>
        <span class="tip-summary-title">${escapeHtml(topic.tip.title)}</span>
        <span class="tip-chevron" aria-hidden="true">▾</span>
      </summary>
      <div class="tip-collapsible-body">
        <p>${escapeHtml(topic.tip.body)}</p>
        <div class="tip-examples">
          ${topic.tip.examples
            .map(
              (ex) =>
                `<div class="tip-example"><strong lang="el">${escapeHtml(ex.el)}</strong> — <span>${escapeHtml(ex.ru)}</span></div>`
            )
            .join('')}
        </div>
      </div>
    </details>`
    : '';

  const jumps = [
    ...topic.sections.map((s) => ({ href: `#${s.id}`, label: s.titleRu })),
    ...(dialogue ? [{ href: '#dialogue', label: 'Мини-диалог' }] : []),
  ];

  return `${renderHead(
    `${topic.titleRu} (${topic.titleEl}) — Greek Sheets`,
    topic.subtitle,
    '../'
  )}
<body data-accent="${topic.accent}" data-sw="../sw.js" data-assets="../assets/">
  <header class="topbar">
    <div class="container topbar-inner">
      <a class="back-link" href="../">← Темы</a>
      <div class="topbar-actions">
        <button id="review-btn" class="tool-btn-primary" type="button">Повторить</button>
        ${renderToolsMenuTrigger()}
        ${renderThemeToggle()}
      </div>
    </div>
  </header>

  <main class="container page-main">
    <header class="page-head">
      <h1>${escapeHtml(topic.titleRu)}</h1>
      <div class="page-head-el" lang="el">${escapeHtml(topic.titleEl)}</div>
    </header>

    <div id="active-filters-bar" class="active-filters-bar" hidden>
      <span id="active-filters-text"></span>
      <button id="reset-filters-btn" class="active-filters-reset" type="button">Сбросить</button>
    </div>

    ${tipHtml}

    <div id="empty-state" class="empty-state">
      Ничего не найдено.
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

  ${renderToolsMenu({
    searchPlaceholder: 'Поиск по теме...',
    showLevels: true,
    jumps,
    extraLinks: [
      { href: '../', label: '← Все темы' },
      { href: '../lessons/', label: 'Уроки' },
    ],
  })}

  ${renderReviewModal()}

  ${renderVerbModal()}

  <script src="../assets/app.js"></script>
</body>
</html>
`;
}

export function renderLessonsIndexPage(lessons: Lesson[]): string {
  const cardsHtml = lessons
    .map((lesson) => {
      const wordCount = lesson.sections.reduce((s, sec) => s + sec.items.length, 0);
      const qCount = lesson.questions ? lesson.questions.items.length : 0;
      const exCount = lesson.exercises ? lesson.exercises.length : 0;
      const parts = [pluralRu(wordCount, 'слово', 'слова', 'слов')];
      if (qCount > 0) parts.push(pluralRu(qCount, 'вопрос', 'вопроса', 'вопросов'));
      if (exCount > 0) parts.push(pluralRu(exCount, 'текст', 'текста', 'текстов'));

      return `
      <a class="lesson-preview-card" href="./${escapeHtml(lesson.slug)}/" data-accent="${lesson.accent}">
        <div class="lesson-preview-top">
          <span class="badge badge-a1">Урок ${lesson.number}</span>
          <span class="lesson-date">${escapeHtml(lesson.date)}</span>
        </div>
        <div class="lesson-preview-title">${escapeHtml(lesson.titleRu)}</div>
        <div class="lesson-preview-el" lang="el">${escapeHtml(lesson.titleEl)}</div>
        <div class="lesson-preview-foot">
          <span>${parts.join(' · ')}</span>
          <span class="topic-card-cta">→</span>
        </div>
      </a>`;
    })
    .join('');

  return `${renderHead(
    'Уроки (Μαθήματα) — Greek Sheets',
    'Конспекты уроков греческого языка по датам.',
    '../'
  )}
<body data-sw="../sw.js" data-assets="../assets/">
  <header class="topbar">
    <div class="container topbar-inner">
      <a class="back-link" href="../">← Главная</a>
      <div class="topbar-actions">
        ${renderThemeToggle()}
      </div>
    </div>
  </header>

  <main class="container page-main">
    <header class="page-head">
      <h1>Уроки</h1>
      <div class="page-head-el" lang="el">Μαθήματα</div>
    </header>

    <section class="lessons-preview-grid" aria-label="Список уроков">
      ${cardsHtml}
    </section>
  </main>

  <script src="../assets/app.js"></script>
</body>
</html>
`;
}

export function renderLessonPage(
  lesson: Lesson,
  allLessons: Lesson[],
  allTopics: Topic[]
): string {
  const idx = allLessons.findIndex((l) => l.slug === lesson.slug);
  const prevLesson = idx > 0 ? allLessons[idx - 1] : null;
  const nextLesson = idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
  const relatedTopicObjs = (lesson.relatedTopics ?? [])
    .map((slug) => allTopics.find((t) => t.slug === slug))
    .filter((t): t is Topic => Boolean(t));

  const relatedTopicsHtml =
    relatedTopicObjs.length > 0
      ? `
    <div class="lesson-related-topics" aria-label="Темы урока">
      <span class="lesson-related-label">Темы урока:</span>
      ${relatedTopicObjs
        .map(
          (t) =>
            `<a class="related-topic-pill" href="../../${escapeHtml(t.slug)}/"><span>${t.icon}</span><span>${escapeHtml(t.titleRu)}</span><span aria-hidden="true">↗</span></a>`
        )
        .join('')}
    </div>`
      : '';

  const grammarHtml =
    lesson.grammarNotes && lesson.grammarNotes.length > 0
      ? `
      <section class="lesson-grammar-section" id="grammar">
        <div class="section-header">
          <div class="section-title-group">
            <h2>Грамматика</h2>
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
              <button class="speak-btn" type="button" data-speak="${escapeHtml(q.el)}" title="Прослушать" aria-label="Прослушать">
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
                      <button class="speak-btn" type="button" data-speak="${escapeHtml(q.answerEl)}" title="Прослушать" aria-label="Прослушать">
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
            <h2>Ссылки</h2>
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
                <div class="lesson-link-url">${escapeHtml(link.url)}</div>
              </div>
              <span class="topic-card-cta" aria-hidden="true">↗</span>
            </a>`
            )
            .join('')}
        </div>
      </section>`
      : '';

  const jumps = [
    ...lesson.sections.map((s) => ({ href: `#${s.id}`, label: s.titleRu })),
    ...(lesson.grammarNotes?.length ? [{ href: '#grammar', label: 'Грамматика' }] : []),
    ...(lesson.questions ? [{ href: '#questions', label: 'Вопросы' }] : []),
    ...(lesson.exercises?.map((ex) => ({ href: `#${ex.id}`, label: ex.titleEl })) ?? []),
    ...(lesson.links?.length ? [{ href: '#links', label: 'Ссылки' }] : []),
  ];

  return `${renderHead(
    `Урок ${lesson.number} (${lesson.date}) — ${lesson.titleRu} · Greek Sheets`,
    lesson.subtitle,
    '../../'
  )}
<body data-accent="${lesson.accent}" data-sw="../../sw.js" data-assets="../../assets/">
  <header class="topbar">
    <div class="container topbar-inner">
      <a class="back-link" href="../">← Уроки</a>
      <div class="topbar-actions">
        <button id="review-btn" class="tool-btn-primary" type="button">Повторить</button>
        ${renderToolsMenuTrigger()}
        ${renderThemeToggle()}
      </div>
    </div>
  </header>

  <main class="container page-main">
    <header class="page-head">
      <div class="page-head-row">
        <h1>Урок ${lesson.number} · ${escapeHtml(lesson.titleRu)}</h1>
        <span class="badge badge-muted">${escapeHtml(lesson.date)}</span>
      </div>
      <div class="page-head-el" lang="el">${escapeHtml(lesson.titleEl)}</div>
      ${relatedTopicsHtml}
    </header>

    <div id="active-filters-bar" class="active-filters-bar" hidden>
      <span id="active-filters-text"></span>
      <button id="reset-filters-btn" class="active-filters-reset" type="button">Сбросить</button>
    </div>

    <div id="empty-state" class="empty-state">
      Ничего не найдено.
    </div>

    ${lesson.sections.map((s) => renderSection(`lesson-${lesson.number}`, s)).join('')}

    ${grammarHtml}

    ${questionsHtml}

    ${exercisesHtml}

    ${linksHtml}

    <section class="other-topics">
      <div class="other-topics-list">
        ${prevLesson ? `<a class="other-topic-link" href="../${escapeHtml(prevLesson.slug)}/">← Урок ${prevLesson.number} (${escapeHtml(prevLesson.date)})</a>` : ''}
        <a class="other-topic-link" href="../">Все уроки</a>
        ${nextLesson ? `<a class="other-topic-link" href="../${escapeHtml(nextLesson.slug)}/">Урок ${nextLesson.number} (${escapeHtml(nextLesson.date)}) →</a>` : ''}
      </div>
    </section>
  </main>

  ${renderToolsMenu({
    searchPlaceholder: 'Поиск по уроку...',
    showLevels: false,
    jumps,
    extraLinks: [
      ...allLessons
        .filter((l) => l.slug !== lesson.slug)
        .map((l) => ({ href: `../${l.slug}/`, label: `Урок ${l.number} · ${l.date}` })),
      { href: '../../', label: 'Все темы' },
    ],
  })}

  ${renderReviewModal()}

  ${renderVerbModal()}

  <script src="../../assets/app.js"></script>
</body>
</html>
`;
}
