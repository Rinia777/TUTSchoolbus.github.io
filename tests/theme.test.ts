// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APPEARANCE_STORAGE_KEY, parseStoredAppearanceMode, resolveAppearanceMode, setupThemeControls } from '../src/theme';

describe('appearance mode', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('style');
    document.head.innerHTML = '';
    document.body.innerHTML = '<button type="button" data-theme-toggle aria-label="初期ラベル" aria-pressed="false"></button>';
    localStorage.clear();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts only light and dark stored values and otherwise follows the system', () => {
    expect(parseStoredAppearanceMode('light')).toBe('light');
    expect(parseStoredAppearanceMode('dark')).toBe('dark');
    expect(parseStoredAppearanceMode('sepia')).toBeNull();
    expect(resolveAppearanceMode(null, false)).toBe('light');
    expect(resolveAppearanceMode(null, true)).toBe('dark');
    expect(resolveAppearanceMode('light', true)).toBe('light');
    expect(resolveAppearanceMode('dark', false)).toBe('dark');
  });

  it('applies system mode, toggles immediately, and persists the explicit choice', () => {
    const cleanup = setupThemeControls();
    const control = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
    expect(control).not.toBeNull();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(control?.getAttribute('aria-pressed')).toBe('false');
    expect(control?.getAttribute('aria-label')).toBe('ナイトモードに切り替える');

    control?.click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe('dark');
    expect(control?.getAttribute('aria-pressed')).toBe('true');
    expect(control?.getAttribute('aria-label')).toBe('ライトモードに切り替える');
    expect(document.head.querySelector('meta[data-theme-color="active"]')?.getAttribute('content')).toBe('#101B2C');
    cleanup();
  });
});
