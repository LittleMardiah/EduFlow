import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('Root / mengarahkan ke alur autentikasi (header punya tombol Login)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth\/login$|\/dashboard\//);
    if (page.url().endsWith('/auth/login')) {
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    }
  });

  test('Akses /quizzes tanpa login → diarahkan ke /auth/login', async ({ page }) => {
    await page.goto('/quizzes');
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test('Register link dari login → ke /auth/register', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/auth\/register$/);
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  });

  test('Login link di register → balik ke /auth/login', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/auth\/login$/);
  });
});