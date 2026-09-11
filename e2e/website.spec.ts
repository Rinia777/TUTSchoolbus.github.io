import { expect, test, type Page } from '@playwright/test';

async function gotoTimetable(page: Page): Promise<void> {
  await page.addInitScript(() => {
    sessionStorage.setItem('tut-web-app-prompt-session-v1', '1');
  });
  await page.goto('/');
}

test('timetable page exposes the app-like controls and route navigation', async ({ page }) => {
  await gotoTimetable(page);
  await expect(page.getByRole('heading', { name: 'スクールバス時刻表' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'スマホアプリはこちらから！' })).toBeVisible();
  await expect(page.getByText('東京工科大学・八王子キャンパス', { exact: true })).toBeVisible();
  await expect(page.locator('.footer-notice')).toBeVisible();
  await expect(page.locator('.footer-notice')).toContainText('東京工科大学・八王子キャンパスのスクールバス予定時刻を確認できるWeb時刻表です。八王子駅、八王子みなみ野駅、学生会館と大学間の、本日・明日の時刻表に対応しています。');
  await expect(page.locator('.footer-notice')).toContainText('本サイトは東京工科大学の公式サービスではありません。東京工科大学への本サイトに関するお問い合わせはお控えください。');
  const noticePlacement = await page.locator('.footer-notice').evaluate((node) => ({ parent: node.parentElement?.className, next: node.nextElementSibling?.tagName }));
  expect(noticePlacement.parent).toBe('site-footer');
  expect(noticePlacement.next).toBe('NAV');
  const stripeMetrics = await page.locator('.stripe').evaluate((stripe) => ({ height: getComputedStyle(stripe).height, rows: [...stripe.children].map((child) => getComputedStyle(child).height) }));
  expect(stripeMetrics).toEqual({ height: '6px', rows: ['2px', '2px', '2px'] });
  await expect(page.locator('.site-brand-icon img')).toHaveAttribute('src', /app-icon\.png/);
  expect(await page.locator('.site-brand-icon img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.site-brand-icon source')).toHaveAttribute('srcset', /app-icon-dark\.png/);
  await expect(page.getByRole('link', { name: 'スマホアプリはこちらから！' })).toHaveCSS('text-decoration-line', 'underline');
  const refreshStyle = await page.locator('.card-refresh-button').first().evaluate((button) => {
    const style = getComputedStyle(button);
    return { borderRadius: style.borderRadius, borderWidth: style.borderWidth, backgroundColor: style.backgroundColor };
  });
  expect(refreshStyle).toEqual({ borderRadius: '0px', borderWidth: '0px', backgroundColor: 'rgba(0, 0, 0, 0)' });
  const footerBackgrounds = await page.locator('.site-footer').evaluate((footer) => ({ footer: getComputedStyle(footer).backgroundColor, notice: getComputedStyle(footer.querySelector('.footer-notice') as HTMLElement).backgroundColor }));
  expect(footerBackgrounds.footer).toBe(footerBackgrounds.notice);
  await expect(page.locator('.site-footer a[href="https://x.com/tut__app"]')).toHaveText('X（@tut__app）');
  await expect(page.locator('.site-footer a[href="mailto:rin.ichikawa.appcreate@gmail.com"]')).toHaveText('お問い合わせ');
  await expect(page.getByRole('button', { name: '時刻表を再読み込み' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /前のルート|次のルート/ })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: /登校/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: '八王子駅を表示' }).click();
  await expect(page.locator('#route-carousel')).toHaveAttribute('aria-label', /2 \/ 3/);
  await page.getByRole('tab', { name: /登校/ }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: /下校/ })).toHaveAttribute('aria-selected', 'true');
});

test('exposes the approved SEO metadata, structured data, and sitemap', async ({ page, request }) => {
  await gotoTimetable(page);
  await expect(page).toHaveTitle('東京工科大学 スクールバス時刻表（八王子キャンパス）｜非公式');
  await expect(page.locator('meta[name="google-site-verification"]')).toHaveAttribute('content', '9TgERWroL0sh0LoX9wftWViQGmUyvis402dEAkC3KHs');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', '東京工科大学・八王子キャンパスのスクールバス予定時刻を確認できる非公式Web時刻表です。八王子駅、八王子みなみ野駅、学生会館の3ルートに対応しています。');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://rinia777.github.io/TUTSchoolbus.github.io/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://rinia777.github.io/TUTSchoolbus.github.io/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://rinia777.github.io/TUTSchoolbus.github.io/app-icon.png');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');
  await expect(page.locator('meta[name="twitter:site"]')).toHaveAttribute('content', '@tut__app');
  expect(JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? '{}')).toMatchObject({ '@type': 'WebSite', url: 'https://rinia777.github.io/TUTSchoolbus.github.io/' });

  await page.goto('/app/');
  await expect(page).toHaveTitle('東京工科大学スクールバスアプリ｜非公式アプリ');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', '東京工科大学・八王子キャンパスのスクールバス予定時刻を手軽に確認できる非公式iOSアプリの紹介ページです。');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://rinia777.github.io/TUTSchoolbus.github.io/app/');
  await expect(page.locator('meta[name="twitter:site"]')).toHaveAttribute('content', '@tut__app');
  expect(JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? '{}')).toMatchObject({ '@type': 'SoftwareApplication', operatingSystem: 'iOS' });

  await page.goto('/kiyaku.html');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://rinia777.github.io/TUTSchoolbus.github.io/kiyaku.html');
  await page.goto('/poricy.html');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://rinia777.github.io/TUTSchoolbus.github.io/poricy.html');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  const sitemapText = await sitemap.text();
  for (const url of [
    'https://rinia777.github.io/TUTSchoolbus.github.io/',
    'https://rinia777.github.io/TUTSchoolbus.github.io/app/',
    'https://rinia777.github.io/TUTSchoolbus.github.io/kiyaku.html',
    'https://rinia777.github.io/TUTSchoolbus.github.io/poricy.html',
  ]) expect(sitemapText).toContain(`<loc>${url}</loc>`);
});

test('follows the browser color scheme across timetable, app, and legal pages', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await gotoTimetable(page);
  await expect(page.locator('.timetable-main')).toHaveCSS('background-color', 'rgb(16, 27, 44)');
  await expect(page.locator('.route-card').first()).toHaveCSS('background-color', 'rgb(27, 34, 47)');
  await expect(page.getByRole('link', { name: 'スマホアプリはこちらから！' })).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('tab', { name: /登校/ })).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('tab', { name: /登校/ })).toHaveCSS('border-bottom-color', 'rgb(176, 184, 198)');
  await expect(page.getByRole('tab', { name: /下校/ })).toHaveCSS('color', 'rgb(58, 77, 141)');

  await page.goto('/app/');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(16, 27, 44)');
  await expect(page.locator('.app-back')).toHaveText('Web時刻表はこちら');
  await expect(page.locator('.app-back')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.locator('.app-section-light').first()).toHaveCSS('background-color', 'rgb(27, 34, 47)');

  await page.goto('/kiyaku.html');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(27, 34, 47)');
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(236, 238, 242)');

  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('.timetable-main')).toHaveCSS('background-color', 'rgb(238, 243, 248)');
  await expect(page.locator('.route-card').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('tab', { name: /登校/ })).toHaveCSS('color', 'rgb(58, 77, 141)');
  await expect(page.getByRole('tab', { name: /登校/ })).toHaveCSS('border-bottom-color', 'rgb(58, 77, 141)');
  await expect(page.getByRole('tab', { name: /下校/ })).toHaveCSS('color', 'rgb(142, 142, 147)');
});

test('manual theme toggle overrides the system and is shared with legal pages', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await gotoTimetable(page);
  await page.evaluate(() => localStorage.removeItem('tut-web-appearance-mode'));
  await page.reload();
  const toggle = page.locator('[data-theme-toggle]');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.timetable-main')).toHaveCSS('background-color', 'rgb(16, 27, 44)');
  await expect(page.locator('.site-brand-icon source[data-theme-image="dark"]')).toHaveAttribute('media', 'all');
  await expect(page.locator('link[data-theme-image="dark"]')).toHaveAttribute('media', 'all');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/kiyaku.html');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(27, 34, 47)');
});

test('shows the app install prompt to first-time visitors and remembers dismissal', async ({ page }) => {
  await page.goto('/');
  const prompt = page.locator('#app-install-prompt');
  await expect(prompt).toBeVisible();
  await expect(prompt.getByRole('heading', { name: /東京工科大学.*スクールバスアプリ/ })).toBeVisible();
  await expect(prompt.locator('[data-app-promo-store]')).toHaveAttribute('href', /apps\.apple\.com/);
  const promptBadge = prompt.locator('[data-app-promo-store] img');
  await expect(promptBadge).toHaveAttribute('src', /app-store-badge-ja-black-[^/]+\.svg/);
  expect(await promptBadge.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const promptAndroid = prompt.locator('.app-install-android-coming-soon');
  await expect(promptAndroid).toContainText('Androidアプリも開発中！');
  await expect(promptAndroid.locator('img')).toHaveAttribute('src', /google-play-badge-ja-[^/]+\.png/);
  await expect(promptAndroid.locator('.app-install-android-badge')).toHaveCSS('width', '150px');
  expect(await promptAndroid.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(promptAndroid.locator('.app-install-android-overlay')).toHaveCSS('background-color', 'rgba(112, 117, 122, 0.56)');
  await expect(prompt.locator('[data-app-promo-details]')).toHaveAttribute('href', './app/');
  await expect(prompt.locator('a[href*="play.google.com"]')).toHaveCount(0);

  await prompt.getByRole('button', { name: '閉じる' }).click();
  await expect(prompt).not.toBeVisible();
  await page.reload();
  await expect(prompt).not.toBeVisible();
});

test('timetable cards move with click-and-drag', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await gotoTimetable(page);
  const carousel = page.locator('#route-carousel');
  await expect(carousel).toHaveAttribute('aria-label', /1 \/ 3/);
  const box = await carousel.boundingBox();
  if (!box) throw new Error('カルーセルの位置を取得できません。');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width - 32, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 32, y, { steps: 8 });
  await page.mouse.up();
  await expect(carousel).toHaveAttribute('aria-label', /2 \/ 3/);
});

test('timetable dialogs open for the selected route and narrow layouts do not overflow', async ({ page }) => {
  await gotoTimetable(page);
  await page.getByRole('button', { name: '八王子駅を表示' }).click();
  const selectedCard = page.locator('.route-card').filter({ hasText: '八王子駅発' }).first();
  await selectedCard.getByRole('button', { name: '本日の時刻表' }).click();
  const dialog = page.getByRole('dialog', { name: '本日の時刻表' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: '本日の時刻表' })).toBeVisible();
  await expect(dialog.locator('.dialog-heading h2')).toHaveCSS('text-align', 'center');
  await expect(dialog.locator('.dialog-endpoint-labels')).toContainText('八王子駅');
  await expect(dialog.locator('.dialog-endpoint-labels')).toContainText('大学');
  await expect(dialog.getByRole('heading', { name: '八王子駅発' })).toHaveCount(0);
  await dialog.getByRole('button', { name: '閉じる' }).click();
  await expect(dialog).toHaveCount(0);

  await selectedCard.getByRole('button', { name: '明日の時刻表' }).click();
  const tomorrowDialog = page.getByRole('dialog', { name: '明日の時刻表' });
  await expect(tomorrowDialog.getByRole('heading', { name: '明日の時刻表' })).toBeVisible();
  await expect(tomorrowDialog.locator('.dialog-endpoint-labels')).toContainText('八王子駅');
  await expect(tomorrowDialog.locator('.dialog-endpoint-labels')).toContainText('大学');
  await expect(tomorrowDialog).toContainText('最終バス');
  await tomorrowDialog.getByRole('button', { name: '閉じる' }).click();
  await expect(tomorrowDialog).toHaveCount(0);

  for (const width of [320, 375, 750, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await gotoTimetable(page);
    const dimensions = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
  }

  await page.setViewportSize({ width: 750, height: 900 });
  await gotoTimetable(page);
  const desktopCardWidth = await page.locator('.route-card').first().evaluate((card) => card.getBoundingClientRect().width);
  expect(desktopCardWidth).toBeLessThanOrEqual(500);

  await page.setViewportSize({ width: 320, height: 900 });
  await gotoTimetable(page);
  const tableButtons = page.locator('.route-card').first().locator('.card-actions .table-button');
  await expect(tableButtons).toHaveCount(2);
  const buttonBoxes = await tableButtons.evaluateAll((buttons) => buttons.map((button) => {
    const rect = button.getBoundingClientRect();
    return { top: rect.top, width: rect.width };
  }));
  expect(buttonBoxes[1]?.top).toBe(buttonBoxes[0]?.top);
});

test('timetable search fetches and displays a selected date', async ({ page }) => {
  await gotoTimetable(page);
  const searchButton = page.getByRole('button', { name: '時刻表検索' }).first();
  await expect(searchButton).toBeVisible();
  await searchButton.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: '時刻表検索' })).toBeVisible();
  await dialog.locator('input[type="date"]').fill('2026-09-07');
  await dialog.getByRole('button', { name: '検索' }).click();
  await expect(dialog.locator('.search-result-date')).toHaveText('2026年9月7日');
  await expect(dialog.locator('.search-operation-status')).toHaveText('臨時運行');
  expect(await dialog.locator('.search-trip-list .trip-row').count()).toBeGreaterThan(0);
  await expect(dialog.locator('.search-trip-list .is-past')).toHaveCount(0);

  await dialog.getByRole('button', { name: '閉じる' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(searchButton).toBeFocused();
});

test('app page shows development screenshots and a non-interactive Android download notice', async ({ page }) => {
  await page.goto('/app/');
  await expect(page.getByRole('heading', { name: /東京工科大学.*スクールバスアプリ/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: '対応状況' })).toHaveCount(0);
  await expect(page.locator('.app-notice')).toHaveCount(0);
  await expect(page.locator('.recommend-card')).toHaveCount(4);
  await expect(page.locator('.recommend-card h3')).toHaveText([
    '通学前に、次のバスをすぐ確認したい方',
    '利用する駅や方向を切り替えて使いたい方',
    '今日・明日の予定を先に確認しておきたい方',
    '臨時ダイヤや運休を見落としたくない方',
  ]);
  await expect(page.locator('.recommend-list')).not.toContainText(/リアルタイム運行|位置情報|遅延保証|Push 通知/);
  await expect(page.locator('.app-footer-notice')).toContainText('本アプリは卒業生が運営している非公式アプリです。本アプリおよび本サイトに関しての問い合わせを東京工科大学に行わないでください。');
  await expect(page.locator('.app-footer-notice')).toContainText('表示時刻は予定であり、');
  await expect(page.locator('.app-footer-notice')).toContainText('実際の運行と異なる場合があります。');
  await expect(page.locator('.app-footer-notice a')).toHaveText('大学公式の交通案内を確認する');
  await expect(page.locator('.download-section .section-heading')).toHaveCSS('justify-content', 'flex-start');
  await expect(page.locator('.app-screen-caption')).toHaveText([
    '開発中の写真です。',
    '開発中の写真です。',
    '開発中の写真です。',
  ]);
  await expect(page.locator('a[href*="apps.apple.com"]')).toHaveCount(1);
  await expect(page.locator('a[href*="apps.apple.com"] img')).toHaveCSS('width', '167px');
  await expect(page.locator('a[href*="apps.apple.com"] img')).toHaveCSS('height', '55px');
  await expect(page.locator('a[href*="apps.apple.com"] img')).toHaveAttribute('src', /app-store-badge-ja-black-[^/]+\.svg/);
  expect(await page.locator('a[href*="apps.apple.com"] img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('a[href*="x.com/tut__app"]')).toHaveCount(1);
  await expect(page.locator('.app-footer a[href="mailto:rin.ichikawa.appcreate@gmail.com"]')).toHaveText('お問い合わせ');
  const androidNotice = page.locator('.android-store-coming-soon');
  await expect(androidNotice).toContainText('Androidアプリも開発中！');
  await expect(androidNotice.locator('img')).toHaveAttribute('src', /google-play-badge-ja-[^/]+\.png/);
  await expect(androidNotice.locator('.android-store-badge')).toHaveCSS('width', '150px');
  expect(await androidNotice.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(androidNotice.locator('.android-store-overlay')).toHaveCSS('background-color', 'rgba(112, 117, 122, 0.56)');
  await expect(page.locator('a[href*="play.google.com"]')).toHaveCount(0);
  await expect(page.locator('a[href*="t.co/0LTkBLx0jX"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Web時刻表' }).first()).toHaveAttribute('href', '../');
});
