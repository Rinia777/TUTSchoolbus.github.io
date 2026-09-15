import { describe, expect, it } from 'vitest';
import appHtml from '../app/index.html?raw';
import badge from '../assets/app-store-badge-ja-black.svg?raw';
import privacyHtml from '../poricy.html?raw';
import sitemap from '../public/sitemap.xml?raw';
import termsHtml from '../kiyaku.html?raw';
import timetableHtml from '../index.html?raw';

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
    ] as const;

    for (const page of pages) {
      expect(page.html).toContain(`<h1>${page.heading}</h1>`);
      expect(page.html).toContain('<meta name="robots" content="noindex,follow" />');
      expect(page.html).toContain(`<link rel="canonical" href="${page.canonical}" />`);
      expect(page.html).not.toMatch(/<script\b/i);
      for (const link of page.links) expect(page.html).toContain(`href="${link}"`);
      expect(page.html).toContain('kiyaku.html');
      expect(page.html).toContain('poricy.html');
    }

    expect(timetableHtml).toContain('東京工科大学への本サイトに関するお問い合わせはお控えください。');
    expect(appHtml).toContain('本アプリおよび本サイトに関しての問い合わせを東京工科大学に行わないでください。');

    expect(sitemap).not.toContain('https://rinia777.github.io/TUTSchoolbus.github.io/</loc>');
    expect(sitemap).not.toContain('https://rinia777.github.io/TUTSchoolbus.github.io/app/</loc>');
    expect(sitemap).toContain('https://rinia777.github.io/TUTSchoolbus.github.io/kiyaku.html');
    expect(sitemap).toContain('https://rinia777.github.io/TUTSchoolbus.github.io/poricy.html');
  });
});

describe('旧法務ページと公開素材', () => {
  it('旧規約・プライバシーポリシーのURLと問い合わせ先を維持する', () => {
    expect(termsHtml).toContain('mailto:rin.ichikawa.appcreate@gmail.com');
    expect(privacyHtml).toContain('mailto:rin.ichikawa.appcreate@gmail.com');
    expect(termsHtml).not.toContain('support@rin-works.net');
    expect(privacyHtml).not.toContain('support@rin-works.net');
  });

  it('公式App StoreバッジのSVGを自己完結したまま保持する', () => {
    expect(badge).toContain('<svg id="JP"');
    expect(badge).not.toMatch(/<script|<foreignObject|xlink:href|\shref=/i);
  });
});
