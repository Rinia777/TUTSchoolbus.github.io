import { describe, expect, it } from 'vitest';
import appHtml from '../app/index.html?raw';
import privacyHtml from '../poricy.html?raw';
import termsHtml from '../kiyaku.html?raw';
import timetableHtml from '../index.html?raw';

const pages = [timetableHtml, appHtml, termsHtml, privacyHtml];

describe('light/dark appearance metadata', () => {
  it('declares the OS-aware color scheme and matching browser chrome colors', () => {
    for (const page of pages) {
      expect(page).toContain('name="color-scheme" content="light dark"');
      expect(page).toContain('name="theme-color" media="(prefers-color-scheme: light)" content="#EEF3F8"');
      expect(page).toContain('name="theme-color" media="(prefers-color-scheme: dark)" content="#101B2C"');
      expect(page).not.toContain('name="theme-color" content="#3A4D8D"');
    }
    expect(timetableHtml).toContain('data-theme-toggle');
    expect(appHtml).toContain('data-theme-toggle');
    expect(timetableHtml).toContain('data-theme-image="dark"');
    expect(appHtml).toContain('data-theme-image="dark"');
  });

  it('keeps legal pages on the same semantic display palette', () => {
    for (const page of [termsHtml, privacyHtml]) {
      expect(page).toContain('color-scheme: light dark');
      expect(page).toContain('--legal-background: #EEF3F8');
      expect(page).toContain('--legal-surface: #FFFFFF');
      expect(page).toContain('--legal-text: #333333');
      expect(page).toContain('--legal-background: #101B2C');
      expect(page).toContain('--legal-surface: #1B222F');
      expect(page).toContain('--legal-text: #ECEEF2');
      expect(page).toContain('@media (prefers-color-scheme: dark)');
    }
  });

  it('uses the shared iOS app icon for the header and favicons', () => {
    expect(timetableHtml).toContain('<picture class="site-brand-icon"');
    expect(timetableHtml).toContain('./app-icon.png');
    expect(timetableHtml).toContain('./app-icon-dark.png');
    for (const page of pages) {
      expect(page).toContain('rel="icon"');
      expect(page).toContain('app-icon.png');
      expect(page).toContain('app-icon-dark.png');
      expect(page).toContain('rel="apple-touch-icon"');
    }
  });
});
