import { describe, expect, it } from 'vitest';
import appHtml from '../app/index.html?raw';
import badge from '../assets/app-store-badge-ja-black.svg?raw';
import timetableHtml from '../index.html?raw';

describe('App Store badge', () => {
  it('serves the official badge from the same site on both pages', () => {
    expect(timetableHtml).toContain('./assets/app-store-badge-ja-black.svg');
    expect(appHtml).toContain('../assets/app-store-badge-ja-black.svg');
    expect(`${timetableHtml}\n${appHtml}`).not.toContain('tools.applemediaservices.com');
  });

  it('keeps the downloaded source SVG self-contained', () => {
    expect(badge).toContain('<svg id="JP"');
    expect(badge).not.toMatch(/<script|<foreignObject|xlink:href|\shref=/i);
  });
});

describe('Google Play badge', () => {
  it('shows the official badge as a non-interactive development notice on both pages', () => {
    expect(timetableHtml).toContain('./assets/google-play-badge-ja.png');
    expect(timetableHtml).toContain('Androidアプリも開発中！');
    expect(appHtml).toContain('../assets/google-play-badge-ja.png');
    expect(appHtml).toContain('Androidアプリも開発中！');
    expect(`${timetableHtml}\n${appHtml}`).not.toContain('href="https://play.google.com');
  });
});
