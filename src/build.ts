import * as fs from 'fs';
import * as path from 'path';
import { topics } from './topics';
import { renderIndexPage, renderTopicPage } from './templates';

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SRC_ASSETS = path.join(ROOT, 'src', 'assets');
const DIST_ASSETS = path.join(DIST, 'assets');

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function build(): void {
  fs.rmSync(DIST, { recursive: true, force: true });
  ensureDir(DIST);
  ensureDir(DIST_ASSETS);

  // Copy static assets
  for (const file of fs.readdirSync(SRC_ASSETS)) {
    fs.copyFileSync(path.join(SRC_ASSETS, file), path.join(DIST_ASSETS, file));
  }

  // Prevent GitHub Pages Jekyll processing
  fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

  // Build navigation index page
  fs.writeFileSync(path.join(DIST, 'index.html'), renderIndexPage(topics), 'utf8');

  // Build each topic sheet page
  for (const topic of topics) {
    const topicDir = path.join(DIST, topic.slug);
    ensureDir(topicDir);
    fs.writeFileSync(
      path.join(topicDir, 'index.html'),
      renderTopicPage(topic, topics),
      'utf8'
    );
  }

  console.log(`Built ${topics.length} topic sheets + index into ${DIST}`);
}

build();
