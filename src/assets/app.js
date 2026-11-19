(() => {
  // PWA: Service Worker registration & Install prompt
  const swPath = document.body.getAttribute('data-sw');
  if ('serviceWorker' in navigator && swPath) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swPath).catch(() => {});
    });
  }

  const installBtn = document.getElementById('install-app-btn');
  const iosHint = document.getElementById('ios-install-hint');
  const iosHintClose = document.getElementById('ios-hint-close');

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const isIos =
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

  let deferredInstallPrompt = null;

  if (installBtn && !isStandalone) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      installBtn.hidden = false;
    });

    if (isIos) {
      installBtn.hidden = false;
    }

    installBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        try {
          const choice = await deferredInstallPrompt.userChoice;
          if (choice && choice.outcome === 'accepted') {
            installBtn.hidden = true;
          }
        } catch (_) {}
        deferredInstallPrompt = null;
      } else if (isIos && iosHint) {
        iosHint.hidden = !iosHint.hidden;
      }
    });

    window.addEventListener('appinstalled', () => {
      installBtn.hidden = true;
      if (iosHint) iosHint.hidden = true;
      deferredInstallPrompt = null;
    });
  }

  if (iosHintClose && iosHint) {
    iosHintClose.addEventListener('click', () => {
      iosHint.hidden = true;
    });
  }

  // Theme toggle (light / dark)
  const THEME_KEY = 'greek-sheets-theme';
  const themeToggle = document.getElementById('theme-toggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeColorMeta) themeColorMeta.setAttribute('content', '#121519');
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeColorMeta) themeColorMeta.setAttribute('content', '#1d4e89');
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (_) {}
    });
  }

  // Favorites storage (localStorage)
  const FAV_KEY = 'greek-sheets-favorites';
  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (_) {
      return new Set();
    }
  }

  function saveFavorites(set) {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(set)));
    } catch (_) {}
  }

  const favorites = loadFavorites();

  function updateFavButton(btn, isFav) {
    btn.classList.toggle('is-fav', isFav);
    btn.textContent = isFav ? '★' : '☆';
    btn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
    btn.title = isFav ? 'Убрать из избранного' : 'Добавить в избранное';
  }

  const searchInput = document.getElementById('search-input');
  const levelButtons = document.querySelectorAll('[data-level-filter]');
  const favFilterBtn = document.getElementById('fav-filter-btn');
  const maskElBtn = document.getElementById('mask-el-btn');
  const maskRuBtn = document.getElementById('mask-ru-btn');
  const printBtn = document.getElementById('print-btn');
  const entries = Array.from(document.querySelectorAll('.entry-card'));
  const sections = Array.from(document.querySelectorAll('.vocab-section'));
  const emptyState = document.getElementById('empty-state');

  let activeLevel = 'all';
  let onlyFavorites = false;
  let query = '';

  const normalize = (str) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  function updateTopicFavCounter() {
    if (!favFilterBtn) return;
    let count = 0;
    entries.forEach((card) => {
      const id = card.getAttribute('data-fav-id');
      if (id && favorites.has(id)) count += 1;
    });
    favFilterBtn.textContent = count > 0 ? `★ Избранное (${count})` : '★ Избранное';
  }

  function applyFilters() {
    const q = normalize(query.trim());
    let totalVisible = 0;

    sections.forEach((section) => {
      const sectionEntries = Array.from(section.querySelectorAll('.entry-card'));
      let visibleInSection = 0;

      sectionEntries.forEach((card) => {
        const level = card.getAttribute('data-level') || '';
        const text = normalize(card.getAttribute('data-search') || '');
        const favId = card.getAttribute('data-fav-id') || '';
        const matchesLevel = activeLevel === 'all' || level === activeLevel;
        const matchesFav = !onlyFavorites || favorites.has(favId);
        const matchesQuery = !q || text.includes(q);
        const show = matchesLevel && matchesFav && matchesQuery;

        card.classList.toggle('is-hidden', !show);
        if (show) {
          visibleInSection += 1;
          totalVisible += 1;
        }
      });

      section.style.display = visibleInSection > 0 ? '' : 'none';
      const countEl = section.querySelector('.section-count');
      if (countEl) {
        countEl.textContent = `${visibleInSection}`;
      }
    });

    if (emptyState) {
      emptyState.classList.toggle('visible', totalVisible === 0);
    }
  }

  // Initialize topic page favorite buttons
  document.querySelectorAll('.entry-card .fav-btn').forEach((btn) => {
    const id = btn.getAttribute('data-fav-toggle');
    if (!id) return;
    updateFavButton(btn, favorites.has(id));
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (favorites.has(id)) {
        favorites.delete(id);
      } else {
        favorites.add(id);
      }
      saveFavorites(favorites);
      updateFavButton(btn, favorites.has(id));
      updateTopicFavCounter();
      if (onlyFavorites) applyFilters();
    });
  });
  updateTopicFavCounter();

  if (favFilterBtn) {
    favFilterBtn.addEventListener('click', () => {
      onlyFavorites = !onlyFavorites;
      favFilterBtn.classList.toggle('active', onlyFavorites);
      favFilterBtn.setAttribute('aria-pressed', onlyFavorites ? 'true' : 'false');
      applyFilters();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      query = e.target.value;
      applyFilters();
    });
  }

  levelButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeLevel = btn.getAttribute('data-level-filter') || 'all';
      levelButtons.forEach((b) => b.classList.toggle('active', b === btn));
      applyFilters();
    });
  });

  function clearRevealed() {
    entries.forEach((card) => card.classList.remove('revealed'));
  }

  if (maskElBtn) {
    maskElBtn.addEventListener('click', () => {
      const next = !document.body.classList.contains('mask-el');
      document.body.classList.toggle('mask-el', next);
      if (next) {
        document.body.classList.remove('mask-ru');
        if (maskRuBtn) maskRuBtn.classList.remove('active');
      }
      maskElBtn.classList.toggle('active', next);
      clearRevealed();
    });
  }

  if (maskRuBtn) {
    maskRuBtn.addEventListener('click', () => {
      const next = !document.body.classList.contains('mask-ru');
      document.body.classList.toggle('mask-ru', next);
      if (next) {
        document.body.classList.remove('mask-el');
        if (maskElBtn) maskElBtn.classList.remove('active');
      }
      maskRuBtn.classList.toggle('active', next);
      clearRevealed();
    });
  }

  entries.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.speak-btn') || e.target.closest('.fav-btn')) return;
      const verbsAttr = card.getAttribute('data-verbs');
      const isBlurMode =
        document.body.classList.contains('mask-el') ||
        document.body.classList.contains('mask-ru');

      if (verbsAttr && e.target.closest('.verb-forms-pill')) {
        openVerbModal(verbsAttr.split(','));
        return;
      }

      if (isBlurMode) {
        if (!card.classList.contains('revealed')) {
          card.classList.add('revealed');
          return;
        }
        if (verbsAttr) {
          openVerbModal(verbsAttr.split(','));
          return;
        }
        card.classList.remove('revealed');
        return;
      }

      if (verbsAttr) {
        openVerbModal(verbsAttr.split(','));
      }
    });
  });

  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }

  function speakGreek(text, btn) {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'el-GR';
    utterance.rate = 0.92;

    if (btn) btn.classList.add('speaking');
    utterance.onend = () => btn && btn.classList.remove('speaking');
    utterance.onerror = () => btn && btn.classList.remove('speaking');
    window.speechSynthesis.speak(utterance);
  }

  // Pronunciation via Web Speech API (el-GR)
  const speakButtons = document.querySelectorAll('.entry-card .speak-btn, .dialogue-turn .speak-btn');
  if ('speechSynthesis' in window) {
    speakButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        stopDialoguePlayback();
        const text = btn.getAttribute('data-speak');
        speakGreek(text, btn);
      });
    });
  } else {
    speakButtons.forEach((btn) => {
      btn.style.display = 'none';
    });
  }

  // Mini-Dialogue playback & blur reveal
  const dialogueTurns = Array.from(document.querySelectorAll('.dialogue-turn'));
  const playDialogueBtn = document.getElementById('play-dialogue-btn');
  let dialoguePlaying = false;
  let dialogueRunId = 0;

  function stopDialoguePlayback() {
    dialogueRunId += 1;
    dialoguePlaying = false;
    dialogueTurns.forEach((t) => t.classList.remove('is-speaking'));
    if (playDialogueBtn) playDialogueBtn.textContent = '▶ Прослушать диалог';
  }

  dialogueTurns.forEach((turn) => {
    turn.addEventListener('click', (e) => {
      if (e.target.closest('.speak-btn')) return;
      if (
        document.body.classList.contains('mask-el') ||
        document.body.classList.contains('mask-ru')
      ) {
        turn.classList.toggle('revealed');
      }
    });
  });

  if (playDialogueBtn) {
    if (!('speechSynthesis' in window)) {
      playDialogueBtn.style.display = 'none';
    } else {
      playDialogueBtn.addEventListener('click', () => {
        if (dialoguePlaying) {
          window.speechSynthesis.cancel();
          stopDialoguePlayback();
          return;
        }
        window.speechSynthesis.cancel();
        dialogueRunId += 1;
        const runId = dialogueRunId;
        dialoguePlaying = true;
        playDialogueBtn.textContent = '■ Остановить';

        const speakTurn = (idx) => {
          if (runId !== dialogueRunId || idx >= dialogueTurns.length) {
            if (runId === dialogueRunId) stopDialoguePlayback();
            return;
          }
          dialogueTurns.forEach((t, i) => t.classList.toggle('is-speaking', i === idx));
          const turn = dialogueTurns[idx];
          const text = turn.querySelector('.dialogue-el')?.textContent?.trim() || '';
          const utt = new SpeechSynthesisUtterance(text);
          utt.lang = 'el-GR';
          utt.rate = 0.92;
          utt.onend = () => {
            if (runId !== dialogueRunId) return;
            setTimeout(() => speakTurn(idx + 1), 280);
          };
          utt.onerror = () => {
            if (runId === dialogueRunId) stopDialoguePlayback();
          };
          window.speechSynthesis.speak(utt);
        };

        speakTurn(0);
      });
    }
  }

  // Home page: Global Search & All Favorites
  const globalSearchInput = document.getElementById('global-search-input');
  const homeFavToggle = document.getElementById('home-fav-toggle');
  const homeFavCount = document.getElementById('home-fav-count');
  const globalResultsPanel = document.getElementById('global-results-panel');
  const globalResultsTitle = document.getElementById('global-results-title');
  const globalResultsList = document.getElementById('global-results-list');
  const globalResultsEmpty = document.getElementById('global-results-empty');
  const globalResultsClear = document.getElementById('global-results-clear');
  const topicsGrid = document.getElementById('topics-grid');

  let searchIndexPromise = null;
  let homeShowFavorites = false;

  function updateHomeFavBadge() {
    if (homeFavCount) {
      homeFavCount.textContent = String(favorites.size);
    }
  }

  function loadSearchIndex() {
    if (!searchIndexPromise) {
      searchIndexPromise = fetch('./assets/search-index.json')
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []);
    }
    return searchIndexPromise;
  }

  function escapeText(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createGlobalResultCard(item) {
    const article = document.createElement('article');
    const hasVerbs = Array.isArray(item.verbs) && item.verbs.length > 0;
    article.className = `entry-card${hasVerbs ? ' is-verb' : ''}`;
    const levelClass = item.level === 'A1' ? 'badge-a1' : 'badge-a2';
    const isFav = favorites.has(item.id);

    article.innerHTML = `
      <div class="entry-main">
        <div class="entry-el-row">
          <span class="entry-el" lang="el">${escapeText(item.el)}</span>
          ${hasVerbs ? '<span class="verb-forms-pill" aria-hidden="true">формы ↗</span>' : ''}
        </div>
        <div class="entry-ru">${escapeText(item.ru)}</div>
        ${item.note ? `<div class="entry-note">${escapeText(item.note)}</div>` : ''}
        <a class="result-topic-link" href="./${escapeText(item.topicSlug)}/#${escapeText(item.sectionId)}">
          ${escapeText(item.topicTitle)} · ${escapeText(item.sectionTitle)} →
        </a>
      </div>
      <div class="entry-side">
        <button class="fav-btn ${isFav ? 'is-fav' : ''}" type="button" title="${isFav ? 'Убрать из избранного' : 'Добавить в избранное'}" aria-label="Избранное" aria-pressed="${isFav ? 'true' : 'false'}">${isFav ? '★' : '☆'}</button>
        ${
          'speechSynthesis' in window
            ? `<button class="speak-btn" type="button" title="Прослушать произношение" aria-label="Прослушать">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              </button>`
            : ''
        }
        <span class="badge ${levelClass}">${escapeText(item.level)}</span>
      </div>
    `;

    if (hasVerbs) {
      article.addEventListener('click', (e) => {
        if (e.target.closest('.fav-btn') || e.target.closest('.speak-btn') || e.target.closest('a')) return;
        openVerbModal(item.verbs);
      });
    }

    const favBtn = article.querySelector('.fav-btn');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        if (favorites.has(item.id)) {
          favorites.delete(item.id);
        } else {
          favorites.add(item.id);
        }
        saveFavorites(favorites);
        updateFavButton(favBtn, favorites.has(item.id));
        updateHomeFavBadge();
        if (homeShowFavorites) renderHomeResults();
      });
    }

    const speakBtn = article.querySelector('.speak-btn');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        speakGreek(item.speak || item.el, speakBtn);
      });
    }

    return article;
  }

  async function renderHomeResults() {
    if (!globalResultsPanel || !globalResultsList || !topicsGrid) return;
    const rawQuery = globalSearchInput ? globalSearchInput.value.trim() : '';
    const q = normalize(rawQuery);
    const active = Boolean(q) || homeShowFavorites;

    globalResultsPanel.hidden = !active;
    topicsGrid.hidden = active;

    if (!active) return;

    const index = await loadSearchIndex();
    let matches = index;

    if (homeShowFavorites) {
      matches = matches.filter((item) => favorites.has(item.id));
    }
    if (q) {
      matches = matches.filter((item) =>
        normalize(`${item.el} ${item.ru} ${item.note} ${item.topicTitle}`).includes(q)
      );
    }

    globalResultsList.innerHTML = '';

    const shown = matches.slice(0, 60);
    shown.forEach((item) => {
      globalResultsList.appendChild(createGlobalResultCard(item));
    });

    if (globalResultsTitle) {
      if (homeShowFavorites && q) {
        globalResultsTitle.textContent = `Избранное по запросу «${rawQuery}» (${matches.length})`;
      } else if (homeShowFavorites) {
        globalResultsTitle.textContent = `Избранное (${matches.length})`;
      } else {
        globalResultsTitle.textContent =
          matches.length > shown.length
            ? `Найдено ${matches.length} (показаны первые ${shown.length})`
            : `Найдено: ${matches.length}`;
      }
    }

    if (globalResultsEmpty) {
      globalResultsEmpty.textContent = homeShowFavorites && !q
        ? 'В избранном пока пусто. Нажимайте ☆ на карточках в любой теме, чтобы сохранить сложные слова.'
        : 'По вашему запросу ничего не найдено.';
      globalResultsEmpty.classList.toggle('visible', matches.length === 0);
    }
  }

  if (globalSearchInput || homeFavToggle) {
    updateHomeFavBadge();

    if (globalSearchInput) {
      globalSearchInput.addEventListener('input', () => {
        renderHomeResults();
      });
    }

    if (homeFavToggle) {
      homeFavToggle.addEventListener('click', () => {
        homeShowFavorites = !homeShowFavorites;
        homeFavToggle.classList.toggle('active', homeShowFavorites);
        homeFavToggle.setAttribute('aria-pressed', homeShowFavorites ? 'true' : 'false');
        renderHomeResults();
      });
    }

    if (globalResultsClear) {
      globalResultsClear.addEventListener('click', () => {
        if (globalSearchInput) globalSearchInput.value = '';
        homeShowFavorites = false;
        if (homeFavToggle) {
          homeFavToggle.classList.remove('active');
          homeFavToggle.setAttribute('aria-pressed', 'false');
        }
        renderHomeResults();
      });
    }
  }

  // Flashcard Review Mode ("Повторить")
  const reviewBtn = document.getElementById('review-btn');
  const reviewModal = document.getElementById('review-modal');
  const reviewStage = document.getElementById('review-stage');
  const reviewDone = document.getElementById('review-done');
  const reviewDoneSummary = document.getElementById('review-done-summary');
  const reviewControls = document.getElementById('review-controls');
  const reviewProgressText = document.getElementById('review-progress-text');
  const reviewProgressBar = document.getElementById('review-progress-bar');
  const flashcard = document.getElementById('flashcard');
  const cardRu = document.getElementById('card-ru');
  const cardEl = document.getElementById('card-el');
  const cardNote = document.getElementById('card-note');
  const cardSectionFront = document.getElementById('card-section-front');
  const cardSectionBack = document.getElementById('card-section-back');
  const cardLevelFront = document.getElementById('card-level-front');
  const cardLevelBack = document.getElementById('card-level-back');
  const cardSpeakBtn = document.getElementById('card-speak-btn');
  const prevBtn = document.getElementById('review-prev-btn');
  const nextBtn = document.getElementById('review-next-btn');
  const flipBtn = document.getElementById('review-flip-btn');
  const shuffleBtn = document.getElementById('review-shuffle-btn');
  const restartBtn = document.getElementById('review-restart-btn');
  const closeTriggers = document.querySelectorAll('[data-close-review]');

  let deck = [];
  let currentIndex = 0;

  function collectCards() {
    const visible = entries.filter((card) => !card.classList.contains('is-hidden'));
    const source = visible.length > 0 ? visible : entries;

    return source.map((card) => {
      const elNode = card.querySelector('.entry-el');
      const ruNode = card.querySelector('.entry-ru');
      const noteNode = card.querySelector('.entry-note');
      const speakNode = card.querySelector('.speak-btn');
      const sectionNode = card.closest('.vocab-section')?.querySelector('h2');

      return {
        el: elNode ? elNode.textContent.trim() : '',
        ru: ruNode ? ruNode.textContent.trim() : '',
        note: noteNode ? noteNode.textContent.trim() : '',
        speak: speakNode ? speakNode.getAttribute('data-speak') || '' : '',
        level: card.getAttribute('data-level') || 'A1',
        section: sectionNode ? sectionNode.textContent.trim() : '',
      };
    });
  }

  function shuffleArray(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function setLevelBadge(node, level) {
    if (!node) return;
    node.textContent = level;
    node.className = `badge ${level === 'A1' ? 'badge-a1' : 'badge-a2'}`;
  }

  function resetFlipInstant() {
    if (!flashcard) return;
    flashcard.style.transition = 'none';
    flashcard.classList.remove('is-flipped');
    void flashcard.offsetWidth;
    flashcard.style.transition = '';
  }

  function renderCard() {
    if (!deck.length) return;

    const isDone = currentIndex >= deck.length;
    if (reviewStage) reviewStage.hidden = isDone;
    if (reviewControls) reviewControls.hidden = isDone;
    if (reviewDone) reviewDone.hidden = !isDone;

    if (isDone) {
      if (reviewProgressText) reviewProgressText.textContent = `${deck.length} / ${deck.length}`;
      if (reviewProgressBar) reviewProgressBar.style.width = '100%';
      if (reviewDoneSummary) {
        reviewDoneSummary.textContent = `Пройдено карточек: ${deck.length}. Можно перемешать и повторить ещё раз.`;
      }
      return;
    }

    resetFlipInstant();

    const item = deck[currentIndex];
    if (cardRu) cardRu.textContent = item.ru;
    if (cardEl) cardEl.textContent = item.el;
    if (cardNote) cardNote.textContent = item.note;
    if (cardSectionFront) cardSectionFront.textContent = item.section;
    if (cardSectionBack) cardSectionBack.textContent = item.section;
    setLevelBadge(cardLevelFront, item.level);
    setLevelBadge(cardLevelBack, item.level);

    if (cardSpeakBtn) {
      cardSpeakBtn.style.display = 'speechSynthesis' in window ? '' : 'none';
      cardSpeakBtn.setAttribute('data-speak', item.speak || item.el);
    }

    if (reviewProgressText) {
      reviewProgressText.textContent = `${currentIndex + 1} / ${deck.length}`;
    }
    if (reviewProgressBar) {
      const pct = ((currentIndex + 1) / deck.length) * 100;
      reviewProgressBar.style.width = `${pct}%`;
    }
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) {
      nextBtn.textContent = currentIndex === deck.length - 1 ? 'Завершить ✓' : 'Дальше →';
    }
  }

  function openReview() {
    if (!reviewModal) return;
    deck = shuffleArray(collectCards());
    currentIndex = 0;
    renderCard();
    reviewModal.hidden = false;
    document.body.classList.add('modal-open');
    if (flashcard) flashcard.focus();
  }

  function closeReview() {
    if (!reviewModal) return;
    reviewModal.hidden = true;
    document.body.classList.remove('modal-open');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function toggleFlip() {
    if (!flashcard || currentIndex >= deck.length) return;
    flashcard.classList.toggle('is-flipped');
  }

  if (reviewBtn && reviewModal) {
    reviewBtn.addEventListener('click', openReview);

    closeTriggers.forEach((el) => el.addEventListener('click', closeReview));

    if (flashcard) {
      flashcard.addEventListener('click', (e) => {
        if (e.target.closest('.speak-btn')) return;
        toggleFlip();
      });
    }

    if (flipBtn) flipBtn.addEventListener('click', toggleFlip);

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex -= 1;
          renderCard();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentIndex < deck.length) {
          currentIndex += 1;
          renderCard();
        }
      });
    }

    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        deck = shuffleArray(deck);
        currentIndex = 0;
        renderCard();
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        deck = shuffleArray(deck);
        currentIndex = 0;
        renderCard();
      });
    }

    if (cardSpeakBtn) {
      cardSpeakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = cardSpeakBtn.getAttribute('data-speak');
        speakGreek(text, cardSpeakBtn);
      });
    }

    document.addEventListener('keydown', (e) => {
      if (reviewModal.hidden) return;
      if (e.key === 'Escape') {
        closeReview();
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (e.target && e.target.tagName === 'BUTTON') return;
        e.preventDefault();
        toggleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < deck.length) {
          currentIndex += 1;
          renderCard();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          currentIndex -= 1;
          renderCard();
        }
      }
    });
  }

  // Verb Conjugation 3D Cube Modal
  const VERB_PERSONS = [
    { title: 'Я (Εγώ)', sub: '1-е лицо · Единственное число' },
    { title: 'Ты (Εσύ)', sub: '2-е лицо · Единственное число' },
    { title: 'Он / она / оно (Αυτός)', sub: '3-е лицо · Единственное число' },
    { title: 'Мы (Εμείς)', sub: '1-е лицо · Множественное число' },
    { title: 'Вы (Εσείς)', sub: '2-е лицо · Множественное число' },
    { title: 'Они (Αυτοί)', sub: '3-е лицо · Множественное число' },
  ];

  const verbModal = document.getElementById('verb-modal');
  const verbLemmaEl = document.getElementById('verb-modal-lemma');
  const verbRuEl = document.getElementById('verb-modal-ru');
  const verbLemmaSpeak = document.getElementById('verb-lemma-speak');
  const verbSwitcher = document.getElementById('verb-switcher');
  const verbPersonTabs = Array.from(document.querySelectorAll('.verb-person-tab'));
  const verbPrevBtn = document.getElementById('verb-prev-person');
  const verbNextBtn = document.getElementById('verb-next-person');
  const verbPersonTitle = document.getElementById('verb-person-title');
  const verbPersonSub = document.getElementById('verb-person-sub');
  const verbViewport = document.getElementById('verb-cube-viewport');
  const verbCube = document.getElementById('verb-cube');
  const verbFaceCurrent = document.getElementById('verb-face-current');
  const verbFaceNext = document.getElementById('verb-face-next');
  const verbFacePrev = document.getElementById('verb-face-prev');
  const verbImpSg = document.getElementById('verb-imp-sg');
  const verbImpPl = document.getElementById('verb-imp-pl');
  const verbImpCsg = document.getElementById('verb-imp-csg');
  const verbImpCpl = document.getElementById('verb-imp-cpl');
  const verbPartActive = document.getElementById('verb-part-active');
  const verbPartPassiveWrap = document.getElementById('verb-part-passive-wrap');
  const verbPartPassive = document.getElementById('verb-part-passive');
  const verbCloseTriggers = document.querySelectorAll('[data-close-verb]');

  let verbsDictPromise = null;
  let activeVerb = null;
  let activePerson = 0;
  let cubeAnimating = false;
  let suppressChipClick = false;

  function loadVerbsDict() {
    if (!verbsDictPromise) {
      const assetsBase = document.body.getAttribute('data-assets') || './assets/';
      verbsDictPromise = fetch(`${assetsBase}verbs.json`)
        .then((res) => (res.ok ? res.json() : {}))
        .catch(() => ({}));
    }
    return verbsDictPromise;
  }

  function renderFormChip(text, aux) {
    if (aux && text && text !== '—') {
      const full = `${aux} ${text}`;
      return `<button class="form-chip" type="button" data-form-speak="${escapeText(full)}" lang="el"><span class="form-aux">${escapeText(aux)}</span> ${escapeText(text)}</button>`;
    }
    if (!text || text === '—') {
      return `<div class="form-chip form-chip-muted">—</div>`;
    }
    return `<button class="form-chip" type="button" data-form-speak="${escapeText(text)}" lang="el">${escapeText(text)}</button>`;
  }

  function renderVerbFaceHtml(verb, personIdx) {
    const p = verb.persons[personIdx];
    const inf = verb.infinitive;
    const hasCompound = inf && inf !== '—';

    return `
      <div class="tense-band tense-band-past">
        <div class="tense-band-head">
          <span class="tense-pill tense-pill-past">Прошедшее</span>
          <span class="tense-el-label" lang="el">Παρελθόν</span>
        </div>
        <div class="tense-row">
          ${renderFormChip(p.aorist)}
          ${renderFormChip(p.imperfect)}
        </div>
        <div class="tense-row tense-row-full">
          ${hasCompound && p.pluperfectAux ? renderFormChip(inf, p.pluperfectAux) : renderFormChip('—')}
        </div>
      </div>

      <div class="tense-band tense-band-present">
        <div class="tense-band-head">
          <span class="tense-pill tense-pill-present">Настоящее</span>
          <span class="tense-el-label" lang="el">Ενεστώτας</span>
        </div>
        <div class="tense-row">
          ${renderFormChip(p.present)}
          ${hasCompound && p.perfectAux ? renderFormChip(inf, p.perfectAux) : renderFormChip('—')}
        </div>
      </div>

      <div class="tense-band tense-band-future">
        <div class="tense-band-head">
          <span class="tense-pill tense-pill-future">Будущее</span>
          <span class="tense-el-label" lang="el">Μέλλοντας</span>
        </div>
        <div class="tense-row">
          ${renderFormChip(p.futureSimple)}
          ${renderFormChip(p.futureCont)}
        </div>
        <div class="tense-row tense-row-full">
          ${hasCompound && p.futurePerfAux ? renderFormChip(inf, p.futurePerfAux) : renderFormChip('—')}
        </div>
      </div>
    `;
  }

  function setClickableFormText(el, val) {
    if (!el) return;
    const text = val || '—';
    el.textContent = text;
    el.disabled = text === '—';
    el.setAttribute('data-form-speak', text === '—' ? '' : text);
  }

  function updateVerbPersonChrome(idx) {
    const meta = VERB_PERSONS[idx];
    if (verbPersonTitle) verbPersonTitle.textContent = meta.title;
    if (verbPersonSub) verbPersonSub.textContent = meta.sub;
    verbPersonTabs.forEach((tab) => {
      const tIdx = Number(tab.getAttribute('data-person-idx'));
      const isAct = tIdx === idx;
      tab.classList.toggle('active', isAct);
      tab.setAttribute('aria-selected', isAct ? 'true' : 'false');
    });
    if (verbPrevBtn) verbPrevBtn.disabled = idx <= 0;
    if (verbNextBtn) verbNextBtn.disabled = idx >= 5;
  }

  function resetCubeToFlat() {
    if (!verbCube || !verbFaceCurrent || !verbFaceNext || !verbFacePrev) return;
    verbCube.classList.remove('is-3d');
    verbCube.style.transition = 'none';
    verbCube.style.transform = '';
    verbFaceCurrent.style.transform = '';
    verbFaceNext.style.transform = '';
    verbFacePrev.style.transform = '';
  }

  function engageCubeGeometry(nextIdx, prevIdx) {
    if (!verbViewport || !verbCube || !verbFaceCurrent || !verbFaceNext || !verbFacePrev || !activeVerb) {
      return 0;
    }
    const width = verbViewport.clientWidth || 440;
    const half = width / 2;

    if (nextIdx !== null && nextIdx >= 0 && nextIdx <= 5) {
      verbFaceNext.innerHTML = renderVerbFaceHtml(activeVerb, nextIdx);
      verbFaceNext.style.transform = `rotateY(90deg) translateZ(${half}px)`;
    } else {
      verbFaceNext.innerHTML = '';
      verbFaceNext.style.transform = '';
    }

    if (prevIdx !== null && prevIdx >= 0 && prevIdx <= 5) {
      verbFacePrev.innerHTML = renderVerbFaceHtml(activeVerb, prevIdx);
      verbFacePrev.style.transform = `rotateY(-90deg) translateZ(${half}px)`;
    } else {
      verbFacePrev.innerHTML = '';
      verbFacePrev.style.transform = '';
    }

    verbFaceCurrent.style.transform = `rotateY(0deg) translateZ(${half}px)`;
    verbCube.classList.add('is-3d');
    return half;
  }

  function animateCubeTo(targetIdx) {
    if (!activeVerb || cubeAnimating || targetIdx === activePerson || targetIdx < 0 || targetIdx > 5) return;
    const dir = targetIdx > activePerson ? -1 : 1; // -1 rotates left to show right face, +1 rotates right to show left face
    const half = engageCubeGeometry(dir === -1 ? targetIdx : null, dir === 1 ? targetIdx : null);

    cubeAnimating = true;
    verbCube.style.transition = 'none';
    verbCube.style.transform = `translateZ(-${half}px) rotateY(0deg)`;
    void verbCube.offsetWidth;

    updateVerbPersonChrome(targetIdx);
    verbCube.style.transition = 'transform 0.36s cubic-bezier(0.22, 1, 0.36, 1)';
    verbCube.style.transform = `translateZ(-${half}px) rotateY(${dir * 90}deg)`;

    const finish = () => {
      activePerson = targetIdx;
      verbFaceCurrent.innerHTML = renderVerbFaceHtml(activeVerb, activePerson);
      resetCubeToFlat();
      cubeAnimating = false;
    };

    const onEnd = (e) => {
      if (e.target !== verbCube) return;
      verbCube.removeEventListener('transitionend', onEnd);
      finish();
    };
    verbCube.addEventListener('transitionend', onEnd);
    setTimeout(() => {
      if (cubeAnimating) {
        verbCube.removeEventListener('transitionend', onEnd);
        finish();
      }
    }, 420);
  }

  function renderActiveVerb(verb) {
    activeVerb = verb;
    activePerson = typeof verb.defaultPerson === 'number' ? verb.defaultPerson : 0;
    cubeAnimating = false;

    if (verbLemmaEl) verbLemmaEl.textContent = verb.lemma;
    if (verbRuEl) verbRuEl.textContent = verb.translation;
    if (verbLemmaSpeak) {
      verbLemmaSpeak.style.display = 'speechSynthesis' in window ? '' : 'none';
      verbLemmaSpeak.setAttribute('data-speak', verb.lemma);
    }

    resetCubeToFlat();
    if (verbFaceCurrent) {
      verbFaceCurrent.innerHTML = renderVerbFaceHtml(verb, activePerson);
    }
    updateVerbPersonChrome(activePerson);

    setClickableFormText(verbImpSg, verb.imperative.simpleSg);
    setClickableFormText(verbImpPl, verb.imperative.simplePl);
    setClickableFormText(verbImpCsg, verb.imperative.contSg);
    setClickableFormText(verbImpCpl, verb.imperative.contPl);
    setClickableFormText(verbPartActive, verb.participle.active);

    if (verbPartPassiveWrap && verbPartPassive) {
      if (verb.participle.passive) {
        verbPartPassiveWrap.hidden = false;
        setClickableFormText(verbPartPassive, verb.participle.passive);
      } else {
        verbPartPassiveWrap.hidden = true;
      }
    }
  }

  async function openVerbModal(lemmas) {
    if (!verbModal || !lemmas || !lemmas.length) return;
    const dict = await loadVerbsDict();
    const resolved = lemmas.map((l) => dict[l]).filter(Boolean);
    if (!resolved.length) return;

    if (verbSwitcher) {
      if (resolved.length > 1) {
        verbSwitcher.hidden = false;
        verbSwitcher.innerHTML = resolved
          .map(
            (v, idx) =>
              `<button class="verb-switch-pill${idx === 0 ? ' active' : ''}" type="button" data-verb-idx="${idx}" lang="el">${escapeText(v.lemma)}</button>`
          )
          .join('');
        verbSwitcher.querySelectorAll('.verb-switch-pill').forEach((pill) => {
          pill.addEventListener('click', () => {
            const idx = Number(pill.getAttribute('data-verb-idx'));
            verbSwitcher.querySelectorAll('.verb-switch-pill').forEach((p) => p.classList.toggle('active', p === pill));
            renderActiveVerb(resolved[idx]);
          });
        });
      } else {
        verbSwitcher.hidden = true;
        verbSwitcher.innerHTML = '';
      }
    }

    renderActiveVerb(resolved[0]);
    verbModal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeVerbModal() {
    if (!verbModal) return;
    verbModal.hidden = true;
    document.body.classList.remove('modal-open');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  if (verbModal) {
    verbCloseTriggers.forEach((el) => el.addEventListener('click', closeVerbModal));

    if (verbLemmaSpeak) {
      verbLemmaSpeak.addEventListener('click', () => {
        const text = verbLemmaSpeak.getAttribute('data-speak');
        speakGreek(text, verbLemmaSpeak);
      });
    }

    verbPersonTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const idx = Number(tab.getAttribute('data-person-idx'));
        animateCubeTo(idx);
      });
    });

    if (verbPrevBtn) {
      verbPrevBtn.addEventListener('click', () => {
        if (activePerson > 0) animateCubeTo(activePerson - 1);
      });
    }

    if (verbNextBtn) {
      verbNextBtn.addEventListener('click', () => {
        if (activePerson < 5) animateCubeTo(activePerson + 1);
      });
    }

    // Click any verb form chip / imperative / participle to speak it
    verbModal.addEventListener('click', (e) => {
      if (suppressChipClick) return;
      const btn = e.target.closest('[data-form-speak]');
      if (!btn) return;
      const text = btn.getAttribute('data-form-speak');
      if (text) speakGreek(text);
    });

    // Interactive 3D Cube swipe/drag (touch + mouse)
    if (verbViewport && verbCube) {
      let dragging = false;
      let lockedAxis = null; // 'x' | 'y' | null
      let startX = 0;
      let startY = 0;
      let startTime = 0;
      let lastDx = 0;
      let dragHalf = 0;

      const onPointerDown = (e) => {
        if (cubeAnimating || !activeVerb) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true;
        lockedAxis = null;
        startX = e.clientX;
        startY = e.clientY;
        startTime = Date.now();
        lastDx = 0;
        suppressChipClick = false;
      };

      const onPointerMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!lockedAxis) {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          if (Math.abs(dy) > Math.abs(dx)) {
            dragging = false;
            return;
          }
          lockedAxis = 'x';
          suppressChipClick = true;
          verbViewport.classList.add('is-dragging');
          dragHalf = engageCubeGeometry(
            activePerson < 5 ? activePerson + 1 : null,
            activePerson > 0 ? activePerson - 1 : null
          );
          if (verbViewport.setPointerCapture) {
            try {
              verbViewport.setPointerCapture(e.pointerId);
            } catch (_) {}
          }
        }

        lastDx = dx;
        const width = dragHalf * 2 || 440;
        let ratio = dx / width;
        // Rubber-band resistance at edges (εγώ and αυτοί)
        if ((activePerson === 0 && ratio > 0) || (activePerson === 5 && ratio < 0)) {
          ratio *= 0.24;
        }
        ratio = Math.max(-1, Math.min(1, ratio));
        const angle = ratio * 90;

        verbCube.style.transition = 'none';
        verbCube.style.transform = `translateZ(-${dragHalf}px) rotateY(${angle}deg)`;
      };

      const onPointerEnd = () => {
        if (!dragging) return;
        dragging = false;
        verbViewport.classList.remove('is-dragging');

        if (lockedAxis !== 'x') return;

        const width = dragHalf * 2 || 440;
        const dt = Math.max(1, Date.now() - startTime);
        const velocity = Math.abs(lastDx) / dt;
        const passed = Math.abs(lastDx) > width * 0.22 || (velocity > 0.45 && Math.abs(lastDx) > 28);

        let targetIdx = activePerson;
        let targetAngle = 0;

        if (passed && lastDx < 0 && activePerson < 5) {
          targetIdx = activePerson + 1;
          targetAngle = -90;
        } else if (passed && lastDx > 0 && activePerson > 0) {
          targetIdx = activePerson - 1;
          targetAngle = 90;
        }

        cubeAnimating = true;
        updateVerbPersonChrome(targetIdx);
        verbCube.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
        verbCube.style.transform = `translateZ(-${dragHalf}px) rotateY(${targetAngle}deg)`;

        const finishDrag = () => {
          activePerson = targetIdx;
          verbFaceCurrent.innerHTML = renderVerbFaceHtml(activeVerb, activePerson);
          resetCubeToFlat();
          cubeAnimating = false;
          setTimeout(() => {
            suppressChipClick = false;
          }, 50);
        };

        const onEnd = (ev) => {
          if (ev.target !== verbCube) return;
          verbCube.removeEventListener('transitionend', onEnd);
          finishDrag();
        };
        verbCube.addEventListener('transitionend', onEnd);
        setTimeout(() => {
          if (cubeAnimating) {
            verbCube.removeEventListener('transitionend', onEnd);
            finishDrag();
          }
        }, 360);
      };

      verbViewport.addEventListener('pointerdown', onPointerDown);
      verbViewport.addEventListener('pointermove', onPointerMove);
      verbViewport.addEventListener('pointerup', onPointerEnd);
      verbViewport.addEventListener('pointercancel', onPointerEnd);
    }

    document.addEventListener('keydown', (e) => {
      if (verbModal.hidden) return;
      if (e.key === 'Escape') {
        closeVerbModal();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (activePerson < 5) animateCubeTo(activePerson + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (activePerson > 0) animateCubeTo(activePerson - 1);
      }
    });
  }
})();
