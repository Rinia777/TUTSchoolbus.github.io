import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

// Clean and recreate dist
if (existsSync(dist)) rmSync(dist, { recursive: true });
mkdirSync(join(dist, 'app'), { recursive: true });

// HTML pages
cpSync(join(root, 'index.html'), join(dist, 'index.html'));
cpSync(join(root, 'app', 'index.html'), join(dist, 'app', 'index.html'));
for (const file of ['kiyaku.html', 'poricy.html']) {
  cpSync(join(root, file), join(dist, file));
}

// Service config
cpSync(join(root, 'service-config.json'), join(dist, 'service-config.json'));

// Bus timetable data
cpSync(join(root, 'bustimelist'), join(dist, 'bustimelist'), { recursive: true });

// Public assets (sitemap, icons)
for (const file of ['sitemap.xml', 'app-icon.png', 'app-icon-dark.png']) {
  cpSync(join(root, 'public', file), join(dist, file));
}

// Verify required files
const required = [
  'index.html',
  'app/index.html',
  'kiyaku.html',
  'poricy.html',
  'sitemap.xml',
  'service-config.json',
  'bustimelist/config.json',
];
for (const file of required) {
  if (!existsSync(join(dist, file))) {
    throw new Error(`ビルドに必要なファイルがありません: ${file}`);
  }
}

console.log(`静的ファイルを ${dist} に収録しました。`);
