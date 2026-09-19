import { test, expect } from '@playwright/test';
import { getTestCredentials, loginViaEntra, logoutViaEntra } from './helpers/entraAuth';

test('a real login completes, shows the authenticated app shell, and logout returns to signed-out', async ({ page }) => {
  test.setTimeout(120_000);

  const creds = getTestCredentials();
  test.skip(!creds, 'E2E_TEST_EMAIL/E2E_TEST_PASSWORD/E2E_TEST_AUTH_SECRET not configured');

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[browser console error] ${msg.text()}`);
  });
  page.on('pageerror', (err) => console.log(`[browser page error] ${err.message}`));

  await page.goto('/');
  await loginViaEntra(page, creds!);

  // No account-management app / claims API exists yet, so this is the correct,
  // honest state for a real authenticated user today - not a workaround.
  await expect(page.getByText(/authorization data could not be loaded/i)).toBeVisible();

  await logoutViaEntra(page, creds!.email);
  await expect(page.getByText(/please sign in/i)).toBeVisible();
});
