(() => {
  const searchInput = document.getElementById('search-input');
  const levelButtons = document.querySelectorAll('[data-level-filter]');
  const maskElBtn = document.getElementById('mask-el-btn');
  const maskRuBtn = document.getElementById('mask-ru-btn');
  const printBtn = document.getElementById('print-btn');
  const entries = Array.from(document.querySelectorAll('.entry-card'));
  const sections = Array.from(document.querySelectorAll('.vocab-section'));
  const emptyState = document.getElementById('empty-state');

  let activeLevel = 'all';
  let query = '';

  const normalize = (str) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  function applyFilters() {
    const q = normalize(query.trim());
    let totalVisible = 0;

    sections.forEach((section) => {
      const sectionEntries = Array.from(section.querySelectorAll('.entry-card'));
      let visibleInSection = 0;

      sectionEntries.forEach((card) => {
        const level = card.getAttribute('data-level') || '';
        const text = normalize(card.getAttribute('data-search') || '');
        const matchesLevel = activeLevel === 'all' || level === activeLevel;
        const matchesQuery = !q || text.includes(q);
        const show = matchesLevel && matchesQuery;

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
      if (e.target.closest('.speak-btn')) return;
      if (
        document.body.classList.contains('mask-el') ||
        document.body.classList.contains('mask-ru')
      ) {
        card.classList.toggle('revealed');
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
  const speakButtons = document.querySelectorAll('.entry-card .speak-btn');
  if ('speechSynthesis' in window) {
    speakButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-speak');
        speakGreek(text, btn);
      });
    });
  } else {
    speakButtons.forEach((btn) => {
      btn.style.display = 'none';
    });
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
})();
