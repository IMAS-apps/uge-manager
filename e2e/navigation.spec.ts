import { test, expect } from '@playwright/test';

/**
 * E2E tests for navigation guards and UI structure.
 * These tests validate the unauthenticated state of the app,
 * since testing authenticated flows requires real Supabase credentials.
 *
 * Future tests with authenticated state should use:
 *   - test.use({ storageState: 'e2e/.auth/admin.json' })
 *   - A test setup file that logs in via the Supabase API directly
 */

test.describe('Navigation — unauthenticated state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the auth page to be ready
    await page.waitForSelector('form', { timeout: 10_000 });
  });

  test('should redirect unauthenticated users to the login page', async ({ page }) => {
    // Any attempt to access the app without a session shows the login form
    await expect(page.getByRole('heading', { name: /IMAS/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar sessió/i })).toBeVisible();
  });

  test('should not show the navigation bar when unauthenticated', async ({ page }) => {
    // The nav with "Sol·licituds", "Contractes" etc. must not be visible
    await expect(page.getByText('Sol·licituds')).not.toBeVisible();
    await expect(page.getByText('Contractes')).not.toBeVisible();
  });

  test('should not show the logout button when unauthenticated', async ({ page }) => {
    // The logout (Tancar sessió) button is only in the authenticated nav
    await expect(page.getByTitle('Tancar sessió')).not.toBeVisible();
  });
});

test.describe('Navigation — form accessibility constraints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('form', { timeout: 10_000 });
  });

  test('email field should have type="email" for browser validation', async ({ page }) => {
    const emailInput = page.getByLabel(/Correu electrònic/i);
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('password field should have type="password" (not plaintext)', async ({ page }) => {
    const passwordInput = page.getByLabel(/Contrasenya/i);
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('password field in register mode should require minimum 8 characters', async ({ page }) => {
    await page.getByRole('button', { name: /No tens compte/i }).click();
    const passwordInput = page.getByLabel(/Contrasenya/i);
    await expect(passwordInput).toHaveAttribute('minlength', '8');
  });

  test('submit buttons should be of type="submit"', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /Iniciar sessió/i });
    await expect(submitBtn).toHaveAttribute('type', 'submit');
  });
});

test.describe('Navigation — page title and meta', () => {
  test('should have a page title', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
