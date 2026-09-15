import { expect, test } from '@playwright/test';

test('旧Web時刻表は新ドメインへの移行案内を表示する', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Web時刻表は新しいドメインへ移行しました' })).toBeVisible();
  await expect(page.getByRole('link', { name: '新しいWeb時刻表を開く' })).toHaveAttribute('href', 'https://tut-app.rin-works.net/');
  await expect(page.getByRole('link', { name: 'アプリ紹介ページを開く' })).toHaveAttribute('href', 'https://tut-app.rin-works.net/app/');
  await expect(page.getByRole('link', { name: '利用規約' })).toHaveAttribute('href', './kiyaku.html');
  await expect(page.getByRole('link', { name: 'プライバシーポリシー' })).toHaveAttribute('href', './poricy.html');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://tut-app.rin-works.net/');
});

test('旧アプリ紹介ページは新ドメインへの移行案内を表示する', async ({ page }) => {
  await page.goto('/app/');

  await expect(page.getByRole('heading', { name: 'アプリ紹介ページは新しいドメインへ移行しました' })).toBeVisible();
  await expect(page.getByRole('link', { name: '新しいアプリ紹介ページを開く' })).toHaveAttribute('href', 'https://tut-app.rin-works.net/app/');
  await expect(page.getByRole('link', { name: '新しいWeb時刻表を開く' })).toHaveAttribute('href', 'https://tut-app.rin-works.net/');
  await expect(page.getByRole('link', { name: '利用規約' })).toHaveAttribute('href', '../kiyaku.html');
  await expect(page.getByRole('link', { name: 'プライバシーポリシー' })).toHaveAttribute('href', '../poricy.html');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://tut-app.rin-works.net/app/');
});

test('旧法務ページは移行後も旧URLで到達できる', async ({ page }) => {
  await page.goto('/kiyaku.html');
  await expect(page).toHaveTitle(/利用規約/);
  await expect(page.locator('a[href="mailto:rin.ichikawa.appcreate@gmail.com"]')).toHaveText('rin.ichikawa.appcreate@gmail.com');

  await page.goto('/poricy.html');
  await expect(page).toHaveTitle(/プライバシーポリシー/);
  await expect(page.locator('a[href="mailto:rin.ichikawa.appcreate@gmail.com"]')).toHaveText('rin.ichikawa.appcreate@gmail.com');
});
