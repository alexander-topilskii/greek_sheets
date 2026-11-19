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

  // Pronunciation via Web Speech API (el-GR)
  const speakButtons = document.querySelectorAll('.speak-btn');
  if ('speechSynthesis' in window) {
    speakButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.getAttribute('data-speak');
        if (!text) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'el-GR';
        utterance.rate = 0.92;

        btn.classList.add('speaking');
        utterance.onend = () => btn.classList.remove('speaking');
        utterance.onerror = () => btn.classList.remove('speaking');
        window.speechSynthesis.speak(utterance);
      });
    });
  } else {
    speakButtons.forEach((btn) => {
      btn.style.display = 'none';
    });
  }
})();
