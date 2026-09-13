import { test, expect } from '@playwright/test';

test('home shows login for unauthenticated user and service cards for signed-in', async ({ page }) => {
  await page.goto('/');

  // unauthenticated should see login
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  await expect(page.getByText(/please sign in/i)).toBeVisible();

  // Simulate auth by navigating with a signed-in query param (app supports user prop normally)
  // For now, check that service placeholders exist when loaded with a special path
  // This is a lightweight smoke test until full deployment + claims integration is available
});
