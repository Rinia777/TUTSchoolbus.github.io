import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf-8');

const timetableHtml = read('index.html');
const appHtml = read('app/index.html');
const privacyHtml = read('poricy.html');
const termsHtml = read('kiyaku.html');
const sitemap = read('public/sitemap.xml');

describe('旧サイトの移行案内', () => {
  it('Web時刻表とアプリ紹介を新ドメインへ案内する', () => {
    const pages = [
      {
        html: timetableHtml,
        heading: 'Web時刻表は新しいドメインへ移行しました',
        canonical: 'https://tut-app.rin-works.net/',
        links: ['https://tut-app.rin-works.net/', 'https://tut-app.rin-works.net/app/'],
      },
      {
        html: appHtml,
        heading: 'アプリ紹介ページは新しいドメインへ移行しました',
        canonical: 'https://tut-app.rin-works.net/app/',
        links: ['https://tut-app.rin-works.net/app/', 'https://tut-app.rin-works.net/'],
      },
    ];

    for (const page of pages) {
      assert.ok(page.html.includes(`<h1>${page.heading}</h1>`));
      assert.ok(page.html.includes('<meta name="robots" content="noindex,follow" />'));
      assert.ok(page.html.includes(`<link rel="canonical" href="${page.canonical}" />`));
      assert.ok(!/<script\b/i.test(page.html));
      for (const link of page.links) assert.ok(page.html.includes(`href="${link}"`));
    }

    assert.ok(timetableHtml.includes('東京工科大学への本サイトに関するお問い合わせはお控えください。'));
    assert.ok(appHtml.includes('本アプリおよび本サイトに関しての問い合わせを東京工科大学に行わないでください。'));

    assert.ok(!sitemap.includes('https://rinia777.github.io/TUTSchoolbus.github.io/</loc>'));
    assert.ok(!sitemap.includes('https://rinia777.github.io/TUTSchoolbus.github.io/app/</loc>'));
    assert.ok(!sitemap.includes('https://rinia777.github.io/TUTSchoolbus.github.io/kiyaku.html'));
    assert.ok(!sitemap.includes('https://rinia777.github.io/TUTSchoolbus.github.io/poricy.html'));
  });
});

describe('旧法務ページ', () => {
  it('旧URLは法務本文を持たず現行Cloudflareページへ案内する', () => {
    const redirects = [
      [termsHtml, 'https://tut-app.rin-works.net/terms.html'],
      [privacyHtml, 'https://tut-app.rin-works.net/privacy_policy.html'],
    ];

    for (const [html, target] of redirects) {
      assert.ok(html.includes('<meta name="robots" content="noindex,follow" />'));
      assert.ok(html.includes(`<meta http-equiv="refresh" content="0; url=${target}" />`));
      assert.ok(html.includes(`<link rel="canonical" href="${target}" />`));
      assert.ok(html.includes(`href="${target}"`));
      assert.ok(!/<script\b/i.test(html));
      assert.ok(!html.includes('revision：'));
    }
  });
});
