import { Topic, TopicSection, VocabItem } from './types';
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

export function renderIndexPage(topics: Topic[]): string {
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
        Короткие и понятные подборки слов и живых фраз для подготовки к экзаменам Ελληνομάθεια A1–A2 и повседневного общения.
      </p>
      <div class="hero-meta">
        <span class="badge badge-a1">${pluralRu(topics.length, 'тема', 'темы', 'тем')}</span>
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
          placeholder="Поиск по всем ${topics.length} темам (на русском или греческом)..."
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
        <button id="global-results-clear" class="tool-btn-outline" type="button">Показать все темы</button>
      </div>
      <div id="global-results-list" class="phrase-list"></div>
      <div id="global-results-empty" class="empty-state">
        Ничего не найдено.
      </div>
    </section>

    <section id="topics-grid" class="topics-grid" aria-label="Список тем">
      ${cardsHtml}
    </section>

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
  </div>

  ${renderVerbModal()}

  <script src="../assets/app.js"></script>
</body>
</html>
`;
}
