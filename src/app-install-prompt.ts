const sessionKey = 'tut-web-app-prompt-session-v1';
const suppressionKey = 'tut-web-app-prompt-suppressed-until-v1';
const dismissDurationMs = 7 * 24 * 60 * 60 * 1000;
const storeDurationMs = 30 * 24 * 60 * 60 * 1000;

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage may be unavailable in private browsing or a restricted frame.
  }
}

function suppressFor(durationMs: number): void {
  writeStorage(localStorage, suppressionKey, String(Date.now() + durationMs));
}

function closeDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

export function setupAppInstallPrompt(): void {
  const dialog = document.querySelector<HTMLDialogElement>('#app-install-prompt');
  if (!dialog) return;

  dialog.querySelector<HTMLButtonElement>('[data-app-promo-close]')?.addEventListener('click', () => {
    suppressFor(dismissDurationMs);
    closeDialog(dialog);
  });
  dialog.querySelector<HTMLElement>('[data-app-promo-store]')?.addEventListener('click', () => suppressFor(storeDurationMs));
  dialog.querySelector<HTMLElement>('[data-app-promo-details]')?.addEventListener('click', () => suppressFor(dismissDurationMs));
  dialog.addEventListener('cancel', () => suppressFor(dismissDurationMs));
  dialog.addEventListener('close', () => suppressFor(dismissDurationMs));
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    suppressFor(dismissDurationMs);
    closeDialog(dialog);
  });
}

export function scheduleAppInstallPrompt(delayMs = 900): number | undefined {
  const dialog = document.querySelector<HTMLDialogElement>('#app-install-prompt');
  if (!dialog || dialog.open || readStorage(sessionStorage, sessionKey) === '1') return undefined;

  const suppressedUntil = Number(readStorage(localStorage, suppressionKey) ?? '0');
  if (Number.isFinite(suppressedUntil) && suppressedUntil > Date.now()) return undefined;

  const openPrompt = (): void => {
    if (dialog.open) return;
    if (document.querySelector('dialog[open]:not(#app-install-prompt)')) {
      window.setTimeout(openPrompt, 500);
      return;
    }
    writeStorage(sessionStorage, sessionKey, '1');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    dialog.querySelector<HTMLElement>('[data-app-promo-close]')?.focus();
  };
  return window.setTimeout(openPrompt, delayMs);
}
