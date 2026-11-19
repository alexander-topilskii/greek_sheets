import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { topics } from './topics';
import { renderIndexPage, renderTopicPage } from './templates';
import { VERBS_BY_LEMMA, resolveVerbLemmas } from './verbs';

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SRC_ASSETS = path.join(ROOT, 'src', 'assets');
const DIST_ASSETS = path.join(DIST, 'assets');

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function renderManifest(): string {
  const manifest = {
    name: 'Greek Sheets — Ελληνικά A1–A2',
    short_name: 'Greek Sheets',
    description: 'Тематические листы со словами и фразами для изучения новогреческого языка уровня A1–A2.',
    start_url: './',
    scope: './',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#faf9f6',
    theme_color: '#1d4e89',
    lang: 'ru',
    icons: [
      {
        src: './assets/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: './assets/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: './assets/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
  return JSON.stringify(manifest, null, 2) + '\n';
}

function renderServiceWorker(precacheUrls: string[], version: string): string {
  return `const CACHE_NAME = 'greek-sheets-${version}';
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('greek-sheets-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./'))
      )
  );
});
`;
}

function buildSearchIndex(): string {
  const index = topics.flatMap((topic) =>
    topic.sections.flatMap((section) => {
      const isVerbSection =
        section.id === 'verbs' ||
        (topic.slug === 'irregular-verbs' && section.kind === 'words');
      return section.items.map((item) => ({
        id: `${topic.slug}::${section.id}::${item.el}`,
        el: item.el,
        ru: item.ru,
        note: item.note ?? '',
        level: item.level,
        speak: item.el.replace(/,\s*-[^\s,]+/g, '').trim(),
        verbs: isVerbSection ? resolveVerbLemmas(item.el) : [],
        topicSlug: topic.slug,
        topicTitle: topic.titleRu,
        sectionId: section.id,
        sectionTitle: section.titleRu,
      }));
    })
  );
  return JSON.stringify(index);
}

function build(): void {
  fs.rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);
  ensureDir(DIST_ASSETS);

  const assetFiles = fs.readdirSync(SRC_ASSETS).sort();
  for (const file of assetFiles) {
    fs.copyFileSync(path.join(SRC_ASSETS, file), path.join(DIST_ASSETS, file));
  }

  // Generate global search & favorites index + verb conjugations dataset
  const searchIndexJson = buildSearchIndex();
  fs.writeFileSync(path.join(DIST_ASSETS, 'search-index.json'), searchIndexJson, 'utf8');

  const verbsJson = JSON.stringify(VERBS_BY_LEMMA);
  fs.writeFileSync(path.join(DIST_ASSETS, 'verbs.json'), verbsJson, 'utf8');

  // Prevent GitHub Pages Jekyll processing
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

  // Web App Manifest
  const manifestJson = renderManifest();
  fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), manifestJson, 'utf8');

  // Build navigation index page
  const indexHtml = renderIndexPage(topics);
  fs.writeFileSync(path.join(DIST, 'index.html'), indexHtml, 'utf8');

  // Build each topic sheet page
  const hash = crypto.createHash('sha256');
  hash.update(indexHtml);
  hash.update(manifestJson);
  hash.update(searchIndexJson);
  hash.update(verbsJson);

  for (const file of assetFiles) {
    hash.update(fs.readFileSync(path.join(DIST_ASSETS, file)));
  }

  for (const topic of topics) {
    const topicDir = path.join(DIST, topic.slug);
    ensureDir(topicDir);
    const topicHtml = renderTopicPage(topic, topics);
    fs.writeFileSync(path.join(topicDir, 'index.html'), topicHtml, 'utf8');
    hash.update(topicHtml);
  }

  // Build Service Worker for offline access & PWA installability
  const version = hash.digest('hex').slice(0, 10);
  const precacheUrls = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/search-index.json',
    './assets/verbs.json',
    ...assetFiles.map((file) => `./assets/${file}`),
    ...topics.map((topic) => `./${topic.slug}/`),
  ];
  fs.writeFileSync(
    path.join(DIST, 'sw.js'),
    renderServiceWorker(precacheUrls, version),
    'utf8'
  );

  console.log(
    `Built ${topics.length} topic sheets + ${Object.keys(VERBS_BY_LEMMA).length} verb cards + index + PWA (v${version}) into ${DIST}`
  );
}

build();
