import { test, expect } from '@playwright/test';

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
// which the AC above (and login.spec.ts) assume works.
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
