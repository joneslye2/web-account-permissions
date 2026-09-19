import { expect, Page } from '@playwright/test';
import { TOTP, Secret } from 'otpauth';

// Reusable driver for Entra's real hosted sign-in UI, so future test suites
// (service visibility, submission create/delete, etc.) can log in without
// re-implementing this flow. Trade-off (accepted): breaks if Microsoft
// changes the login page's markup - fix the selectors here, not by reverting
// callers to mocks.

export interface TestCredentials {
  email: string;
  password: string;
  totpSecret: string;
}

// Reads the default shared test account from env. Callers needing a
// different account (e.g. a specific category/service-role combination in
// later increments) can build their own TestCredentials instead of using this.
export function getTestCredentials(): TestCredentials | null {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  const totpSecret = process.env.E2E_TEST_AUTH_SECRET;
  if (!email || !password || !totpSecret) return null;
  return { email, password, totpSecret };
}

// Rendered page text only - never dumps input values, so it's safe to log
// (a password/code field's typed value never appears in innerText).
async function logState(page: Page, label: string) {
  const url = page.url();
  const text = await page.locator('body').innerText().catch(() => '(no body)');
  console.log(`[entraAuth] ${label} | url=${url} | text=${text.slice(0, 300).replace(/\s+/g, ' ')}`);
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

// locator.isVisible() checks the DOM *right now* and does not wait for the
// element to appear, unlike expect(...).toBeVisible(). Using it to detect an
// optional interstitial mid-navigation returns false immediately if the page
// hasn't finished rendering yet, silently skipping a step that was actually
// there a moment later. waitFor() actually polls.
async function appears(locator: ReturnType<Page['getByRole']>, timeout: number): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

// Call after navigating to the app's home page. Leaves the page on the
// authenticated app shell (asserts the Logout button is visible).
export async function loginViaEntra(page: Page, creds: TestCredentials): Promise<void> {
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL(/ciamlogin\.com/, { timeout: 15_000 });
  await logState(page, 'after redirect to Entra');

  await page.getByRole('textbox', { name: /email/i }).fill(creds.email);
  await page.getByRole('button', { name: /next/i }).click();
  await logState(page, 'after submitting email');

  await page.getByLabel(/password/i).fill(creds.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await logState(page, 'after submitting password');

  // Software OATH token (TOTP) challenge - generate a fresh code from the
  // secret rather than storing/using any single passcode. Not always shown.
  const codeInput = page.getByRole('textbox', { name: /code/i });
  if (await appears(codeInput, 15_000)) {
    await codeInput.fill(generateTotpCode(creds.totpSecret));
    await page.getByRole('button', { name: /verify|sign in|next/i }).click();
    await logState(page, 'after submitting TOTP code');
  }

  // Microsoft may show a "Stay signed in?" interstitial after a successful
  // sign-in - dismiss it if present, but don't fail if it's skipped.
  const staySignedIn = page.getByRole('button', { name: /^no$/i });
  if (await appears(staySignedIn, 15_000)) {
    await staySignedIn.click();
    await logState(page, 'after dismissing stay-signed-in');
  }

  await page.waitForURL((url) => !url.hostname.includes('ciamlogin.com'), { timeout: 20_000 });
  await expect(page.getByRole('button', { name: /logout/i })).toBeVisible({ timeout: 10_000 });
}

// Call from the authenticated app shell. Leaves the page on the signed-out
// view (asserts the Login button is visible).
export async function logoutViaEntra(page: Page): Promise<void> {
  await page.getByRole('button', { name: /logout/i }).click();
  await logState(page, 'after clicking logout');

  // MSAL redirects to Entra's end_session_endpoint (postLogoutRedirectUri is
  // this app's own origin, registered alongside the login redirect URI),
  // which may show its own interim confirmation before returning here.
  await page.waitForURL((url) => !url.hostname.includes('ciamlogin.com'), { timeout: 30_000 });
  await logState(page, 'after logout completes');

  await expect(page.getByRole('button', { name: /login/i })).toBeVisible({ timeout: 10_000 });
}
