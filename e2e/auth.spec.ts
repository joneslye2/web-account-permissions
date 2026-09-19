import { test, expect } from '@playwright/test';
import { getTestCredentials, loginViaEntra, logoutViaEntra } from './helpers/entraAuth';

// Increment 1 acceptance criterion (increment-plan.md): "An unauthenticated
// user sees only login and the unsupported/denied status area where
// relevant." See README.md for the full criteria -> test mapping.
test('AC: an unauthenticated user sees only login and a status message', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  await expect(page.getByText(/please sign in/i)).toBeVisible();
});

// Not an acceptance criterion itself - verifies the login button's redirect
// actually reaches the real Entra tenant with a registered redirect URI,
// which the AC above (and the real-login test below) assume works.
test('login redirect reaches the real Entra tenant with the expected client', async ({ page }) => {
  await page.goto('/');

  await Promise.all([
    page.waitForURL(/ciamlogin\.com/, { timeout: 15000 }),
    page.getByRole('button', { name: /login/i }).click(),
  ]);

  const url = new URL(page.url());
  expect(url.hostname).toBe('joneslye.ciamlogin.com');
  expect(url.searchParams.get('client_id')).toBe('671e9818-dea5-4b0d-ac43-7eaf5470894d');

  // A redirect_uri mismatch surfaces as an AADSTS50011 error on this page rather
  // than a failed navigation, so a successful navigate alone doesn't prove the
  // redirect URI was actually registered for this environment - check the body too.
  await expect(page.locator('body')).not.toContainText('AADSTS50011');
});

// One continuous real-browser session covering login through logout, rather
// than two independent tests, because each real Entra login (with MFA) is
// slow and this way the logout check reuses the session the login check
// already produced. test.step() below keeps "what is this verifying" clear
// despite the shared session - see README.md for the full criteria mapping.
// Skips (doesn't fail) when E2E_TEST_EMAIL/PASSWORD/AUTH_SECRET aren't
// configured, unlike the tests above which need no credentials at all.
test('a real login completes and logout returns to signed-out', async ({ page }) => {
  test.setTimeout(120_000);

  const creds = getTestCredentials();
  test.skip(!creds, 'E2E_TEST_EMAIL/E2E_TEST_PASSWORD/E2E_TEST_AUTH_SECRET not configured');

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[browser console error] ${msg.text()}`);
  });
  page.on('pageerror', (err) => console.log(`[browser page error] ${err.message}`));

  await page.goto('/');

  // Not an acceptance criterion itself - gets us to an authenticated session
  // via a real completed Entra login (redirect, password, MFA if prompted).
  await test.step('real login completes', async () => {
    await loginViaEntra(page, creds!);
  });

  // Increment 1 acceptance criterion: "An authenticated user sees logout
  // and the app shell."
  await test.step('AC: authenticated user sees logout and the app shell', async () => {
    // No account-management app / claims API exists yet, so this is the
    // correct, honest state for a real authenticated user today - not a
    // workaround. (The Logout button's visibility is already asserted
    // inside loginViaEntra.)
    await expect(page.getByText(/authorization data could not be loaded/i)).toBeVisible();
  });

  // Not an acceptance criterion itself - verifies the logout round trip
  // (Entra's end_session_endpoint, the account-picker confirmation, and the
  // return to postLogoutRedirectUri) actually completes end-to-end.
  await test.step('logout returns to the signed-out view', async () => {
    await logoutViaEntra(page, creds!.email);
    await expect(page.getByText(/please sign in/i)).toBeVisible();
  });
});
