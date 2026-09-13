import { describe, expect, it } from 'vitest';
import appHtml from '../app/index.html?raw';
import badge from '../assets/app-store-badge-ja-black.svg?raw';
import privacyHtml from '../poricy.html?raw';
import sitemap from '../public/sitemap.xml?raw';
import termsHtml from '../kiyaku.html?raw';
import timetableHtml from '../index.html?raw';

describe('公開HTMLのメタデータと外観契約', () => {
  it('keeps titles, share metadata, structured data, and sitemap URLs', () => {
    const pages = [
      {
        html: timetableHtml,
        title: '東京工科大学 スクールバス時刻表（八王子キャンパス）｜非公式',
        canonical: 'https://rinia777.github.io/TUTSchoolbus.github.io/',
        structuredType: 'WebSite',
      },
      {
        html: appHtml,
        title: '東京工科大学スクールバスアプリ｜非公式アプリ',
        canonical: 'https://rinia777.github.io/TUTSchoolbus.github.io/app/',
        structuredType: 'SoftwareApplication',
      },
    ] as const;

    for (const page of pages) {
      expect(page.html).toContain(`<title>${page.title}</title>`);
      expect(page.html).toContain(`<link rel="canonical" href="${page.canonical}"`);

      for (const property of ['og:type', 'og:title', 'og:description', 'og:url', 'og:image']) {
        expect(page.html).toMatch(new RegExp(`<meta property="${property}" content="[^"]+"`));
      }
      for (const name of ['twitter:card', 'twitter:site', 'twitter:title', 'twitter:description', 'twitter:image']) {
        expect(page.html).toMatch(new RegExp(`<meta name="${name}" content="[^"]+"`));
      }

      const jsonLd = page.html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
      expect(jsonLd).not.toBeNull();
      expect(JSON.parse(jsonLd?.[1] ?? '{}')).toMatchObject({
        '@type': page.structuredType,
        url: page.canonical,
      });
    }

    for (const url of [
      'https://rinia777.github.io/TUTSchoolbus.github.io/',
      'https://rinia777.github.io/TUTSchoolbus.github.io/app/',
      'https://rinia777.github.io/TUTSchoolbus.github.io/kiyaku.html',
      'https://rinia777.github.io/TUTSchoolbus.github.io/poricy.html',
    ]) {
      expect(sitemap).toContain(`<loc>${url}</loc>`);
    }
  });

  it('keeps canonical pages, SEO metadata, and shared browser appearance metadata', () => {
    const canonicalPages = [
      [timetableHtml, 'https://rinia777.github.io/TUTSchoolbus.github.io/'],
      [appHtml, 'https://rinia777.github.io/TUTSchoolbus.github.io/app/'],
      [termsHtml, 'https://rinia777.github.io/TUTSchoolbus.github.io/kiyaku.html'],
      [privacyHtml, 'https://rinia777.github.io/TUTSchoolbus.github.io/poricy.html'],
    ] as const;

    for (const [page, canonical] of canonicalPages) {
      expect(page).toContain(`<link rel="canonical" href="${canonical}"`);
      expect(page).toContain('name="color-scheme" content="light dark"');
      expect(page).toContain('name="theme-color" media="(prefers-color-scheme: light)" content="#EEF3F8"');
      expect(page).toContain('name="theme-color" media="(prefers-color-scheme: dark)" content="#101B2C"');
      expect(page).toContain('rel="icon"');
      expect(page).toContain('app-icon.png');
    }

    expect(timetableHtml).toContain('name="description" content="東京工科大学・八王子キャンパスのスクールバス予定時刻を確認できる非公式Web時刻表です。');
    expect(appHtml).toContain('name="description" content="東京工科大学・八王子キャンパスのスクールバス予定時刻を手軽に確認できる非公式iOSアプリの紹介ページです。');
    expect(timetableHtml).toContain('data-theme-toggle');
    expect(appHtml).toContain('data-theme-toggle');
    expect(timetableHtml).toContain('data-theme-image="dark"');
    expect(appHtml).toContain('data-theme-image="dark"');

    for (const page of [termsHtml, privacyHtml]) {
      expect(page).toContain('color-scheme: light dark');
      expect(page).toContain('--legal-background: #EEF3F8');
      expect(page).toContain('--legal-background: #101B2C');
    }

  });
});

describe('ストア掲載物と公開文言', () => {
  it('keeps the local store badges and non-interactive Android notice on both pages', () => {
    expect(timetableHtml).toContain('./assets/app-store-badge-ja-black.svg');
    expect(appHtml).toContain('../assets/app-store-badge-ja-black.svg');
    expect(timetableHtml).toContain('./assets/google-play-badge-ja.png');
    expect(appHtml).toContain('../assets/google-play-badge-ja.png');
    expect(`${timetableHtml}\n${appHtml}`).toContain('Androidアプリも開発中！');
    expect(`${timetableHtml}\n${appHtml}`).not.toContain('tools.applemediaservices.com');
    expect(`${timetableHtml}\n${appHtml}`).not.toContain('href="https://play.google.com');
    expect(appHtml).toContain('東京工科大学スクールバスアプリ');
    expect(appHtml).toContain('本アプリは卒業生が運営している非公式アプリです。');
  });

  it('keeps the downloaded source SVG self-contained', () => {
    expect(badge).toContain('<svg id="JP"');
    expect(badge).not.toMatch(/<script|<foreignObject|xlink:href|\shref=/i);
  });
});
