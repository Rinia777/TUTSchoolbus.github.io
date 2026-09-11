export const APPEARANCE_STORAGE_KEY = 'tut-web-appearance-mode';
export type AppearanceMode = 'light' | 'dark';

const validModes: AppearanceMode[] = ['light', 'dark'];
const darkThemeColor = '#101B2C';
const lightThemeColor = '#EEF3F8';

export function parseStoredAppearanceMode(value: string | null): AppearanceMode | null {
  return validModes.includes(value as AppearanceMode) ? value as AppearanceMode : null;
}

export function resolveAppearanceMode(storedMode: AppearanceMode | null, systemDark: boolean): AppearanceMode {
  return storedMode ?? (systemDark ? 'dark' : 'light');
}

function readStoredAppearanceMode(): AppearanceMode | null {
  try {
    return parseStoredAppearanceMode(window.localStorage.getItem(APPEARANCE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStoredAppearanceMode(mode: AppearanceMode): void {
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, mode);
  } catch {
    // Private browsing and blocked storage still allow the toggle for this page.
  }
}

function updateThemeColor(mode: AppearanceMode): void {
  let meta = document.head.querySelector<HTMLMetaElement>('meta[data-theme-color="active"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.dataset.themeColor = 'active';
    document.head.append(meta);
  }
  meta.content = mode === 'dark' ? darkThemeColor : lightThemeColor;
}

function updateThemeAssets(mode: AppearanceMode): void {
  const media = mode === 'dark' ? 'all' : 'not all';
  document.querySelectorAll<HTMLLinkElement | HTMLSourceElement>('[data-theme-image="dark"]').forEach((asset) => {
    asset.media = media;
  });
}

function applyAppearanceMode(mode: AppearanceMode, controls: NodeListOf<HTMLButtonElement>): void {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  updateThemeColor(mode);
  updateThemeAssets(mode);
  const dark = mode === 'dark';
  controls.forEach((control) => {
    control.setAttribute('aria-pressed', String(dark));
    const nextModeLabel = dark ? 'ライトモードに切り替える' : 'ナイトモードに切り替える';
    control.setAttribute('aria-label', nextModeLabel);
    control.title = nextModeLabel;
  });
}

export function setupThemeControls(): () => void {
  const controls = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let sessionMode: AppearanceMode | null = null;

  const applyCurrentMode = (): void => {
    applyAppearanceMode(resolveAppearanceMode(sessionMode ?? readStoredAppearanceMode(), mediaQuery.matches), controls);
  };

  const handleToggle = (): void => {
    const current = resolveAppearanceMode(sessionMode ?? readStoredAppearanceMode(), mediaQuery.matches);
    sessionMode = current === 'dark' ? 'light' : 'dark';
    writeStoredAppearanceMode(sessionMode);
    applyCurrentMode();
  };

  controls.forEach((control) => control.addEventListener('click', handleToggle));
  const handleSystemChange = (): void => {
    if (!sessionMode && !readStoredAppearanceMode()) applyCurrentMode();
  };
  mediaQuery.addEventListener('change', handleSystemChange);
  applyCurrentMode();

  return () => {
    controls.forEach((control) => control.removeEventListener('click', handleToggle));
    mediaQuery.removeEventListener('change', handleSystemChange);
  };
}
