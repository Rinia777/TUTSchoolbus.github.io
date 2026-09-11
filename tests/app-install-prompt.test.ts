// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scheduleAppInstallPrompt, setupAppInstallPrompt } from '../src/app-install-prompt';

const sessionKey = 'tut-web-app-prompt-session-v1';
const suppressionKey = 'tut-web-app-prompt-suppressed-until-v1';

function installDialogMarkup(): void {
  document.body.innerHTML = `
    <dialog id="app-install-prompt">
      <button data-app-promo-close type="button">×</button>
      <a data-app-promo-store href="https://apps.apple.com/">App Store</a>
      <a data-app-promo-details href="./app/">詳しい内容</a>
    </dialog>`;
  const dialog = document.querySelector<HTMLDialogElement>('#app-install-prompt');
  if (!dialog) throw new Error('テスト用ダイアログを作成できません。');
  Object.defineProperty(dialog, 'showModal', { value: () => dialog.setAttribute('open', '') });
  Object.defineProperty(dialog, 'close', { value: () => dialog.removeAttribute('open') });
}

describe('app install prompt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    sessionStorage.clear();
    installDialogMarkup();
    setupAppInstallPrompt();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('opens after the delay and records the current session', () => {
    scheduleAppInstallPrompt(900);

    expect(document.querySelector<HTMLDialogElement>('#app-install-prompt')?.open).toBe(false);
    vi.advanceTimersByTime(899);
    expect(document.querySelector<HTMLDialogElement>('#app-install-prompt')?.open).toBe(false);
    vi.advanceTimersByTime(1);
    expect(document.querySelector<HTMLDialogElement>('#app-install-prompt')?.open).toBe(true);
    expect(sessionStorage.getItem(sessionKey)).toBe('1');
  });

  it('suppresses the prompt for seven days after closing', () => {
    scheduleAppInstallPrompt(0);
    vi.advanceTimersByTime(0);

    document.querySelector<HTMLButtonElement>('[data-app-promo-close]')?.click();

    const suppressedUntil = Number(localStorage.getItem(suppressionKey));
    expect(suppressedUntil).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
    expect(suppressedUntil).toBeLessThanOrEqual(Date.now() + 7 * 24 * 60 * 60 * 1000);
  });

  it('closes when the backdrop is clicked', () => {
    scheduleAppInstallPrompt(0);
    vi.advanceTimersByTime(0);
    const dialog = document.querySelector<HTMLDialogElement>('#app-install-prompt');
    dialog?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(dialog?.open).toBe(false);
  });

  it('uses the longer suppression period after opening the store link', () => {
    scheduleAppInstallPrompt(0);
    vi.advanceTimersByTime(0);
    document.querySelector<HTMLElement>('[data-app-promo-store]')?.click();

    const suppressedUntil = Number(localStorage.getItem(suppressionKey));
    expect(suppressedUntil).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
    expect(suppressedUntil).toBeLessThanOrEqual(Date.now() + 30 * 24 * 60 * 60 * 1000);
  });

  it('does not schedule while the suppression period is active', () => {
    localStorage.setItem(suppressionKey, String(Date.now() + 60_000));

    expect(scheduleAppInstallPrompt(0)).toBeUndefined();
    vi.advanceTimersByTime(0);
    expect(document.querySelector<HTMLDialogElement>('#app-install-prompt')?.open).toBe(false);
  });
});
