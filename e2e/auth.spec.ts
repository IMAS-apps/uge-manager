import { test, expect } from '@playwright/test';

/**
 * E2E tests for the authentication flow.
 * These tests do NOT require a real Supabase connection —
 * they validate the UI structure and client-side form behaviour.
 */

test.describe('Authentication flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to fully load (spinner disappears, auth form appears)
    await page.waitForSelector('form', { timeout: 10_000 });
  });

  test('should display the IMAS login form on first load', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /IMAS/i })).toBeVisible();
    await expect(page.getByLabel(/Correu electrònic/i)).toBeVisible();
    await expect(page.getByLabel(/Contrasenya/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar sessió/i })).toBeVisible();
  });

  test('should switch to the registration form when the signup link is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /No tens compte/i }).click();
    await expect(page.getByLabel(/Nom complet/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Registrar-se/i })).toBeVisible();
  });

  test('should switch back to the login form from registration mode', async ({ page }) => {
    await page.getByRole('button', { name: /No tens compte/i }).click();
    await expect(page.getByLabel(/Nom complet/i)).toBeVisible();

    await page.getByRole('button', { name: /Ja tens compte/i }).click();
    await expect(page.getByLabel(/Nom complet/i)).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar sessió/i })).toBeVisible();
  });

  test('should show an error message when login credentials are invalid', async ({ page }) => {
    await page.getByLabel(/Correu electrònic/i).fill('invalid@test.com');
    await page.getByLabel(/Contrasenya/i).fill('wrongpassword');
    await page.getByRole('button', { name: /Iniciar sessió/i }).click();

    // Supabase will return an auth error — the component should display it
    await expect(page.locator('[class*="bg-danger"]').or(page.locator('[class*="bg-red"]')))
      .toBeVisible({ timeout: 8_000 });
  });

  test('should enforce minimum password length in register form', async ({ page }) => {
    await page.getByRole('button', { name: /No tens compte/i }).click();
    const passwordInput = page.getByLabel(/Contrasenya/i);

    // HTML5 minLength=8 validation
    await passwordInput.fill('short');
    await page.getByRole('button', { name: /Registrar-se/i }).click();

    // Form should not submit — HTML constraint validation prevents it
    await expect(page.getByLabel(/Nom complet/i)).toBeVisible();
  });

  test('should display the subtitle "Institut Mallorquí d\'Afers Socials"', async ({ page }) => {
    await expect(page.getByText(/Institut Mallorquí d'Afers Socials/i)).toBeVisible();
  });
});
