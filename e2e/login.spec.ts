import { test, expect, Page } from '@playwright/test';
import { TOTP, Secret } from 'otpauth';

// Drives Entra's real hosted sign-in UI end to end, rather than mocking MSAL.
// Trade-off (accepted): this test breaks if Microsoft changes the login page's
// markup - fix it by updating the selectors below, not by reverting to mocks.

// Rendered page text only - never dumps input values, so it's safe to log
// (a password/code field's typed value never appears in innerText).
async function logState(page: Page, label: string) {
  const url = page.url();
  const text = await page.locator('body').innerText().catch(() => '(no body)');
  console.log(`[login e2e] ${label} | url=${url} | text=${text.slice(0, 300).replace(/\s+/g, ' ')}`);
}

function generateTotpCode(base32Secret: string): string {
  const totp = new TOTP({
    secret: Secret.fromBase32(base32Secret),
    digits: 6,
    period: 30,
    algorithm: 'SHA1',
  });
  return totp.generate();
}

test('a real login completes and shows the authenticated app shell', async ({ page }) => {
  test.setTimeout(60_000);

  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  const totpSecret = process.env.E2E_TEST_AUTH_SECRET;
  test.skip(!email || !password || !totpSecret, 'E2E_TEST_EMAIL/E2E_TEST_PASSWORD/E2E_TEST_AUTH_SECRET not configured');

  await page.goto('/');
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL(/ciamlogin\.com/, { timeout: 15_000 });
  await logState(page, 'after redirect to Entra');

  await page.getByRole('textbox', { name: /email/i }).fill(email!);
  await page.getByRole('button', { name: /next/i }).click();
  await logState(page, 'after submitting email');

  await page.getByLabel(/password/i).fill(password!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await logState(page, 'after submitting password');

  // Software OATH token (TOTP) challenge - generate a fresh code from the
  // secret rather than storing/using any single passcode.
  const codeInput = page.getByRole('textbox', { name: /code/i });
  if (await codeInput.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await codeInput.fill(generateTotpCode(totpSecret!));
    await page.getByRole('button', { name: /verify|sign in|next/i }).click();
    await logState(page, 'after submitting TOTP code');
  }

  // Microsoft may show a "Stay signed in?" interstitial after a successful
  // sign-in - dismiss it if present, but don't fail if it's skipped.
  const staySignedIn = page.getByRole('button', { name: /^no$/i });
  if (await staySignedIn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await staySignedIn.click();
    await logState(page, 'after dismissing stay-signed-in');
  }

  await page.waitForURL((url) => !url.hostname.includes('ciamlogin.com'), { timeout: 20_000 });

  await expect(page.getByRole('button', { name: /logout/i })).toBeVisible({ timeout: 10_000 });
  // No account-management app / claims API exists yet, so this is the correct,
  // honest state for a real authenticated user today - not a workaround.
  await expect(page.getByText(/authorization data could not be loaded/i)).toBeVisible();
});
