import { test, expect } from '@playwright/test';
import { registerUser, loginUser, logoutUser } from './helpers/auth';
import { generateEmail } from './fixtures/test-data';

test.describe('Auth flows', () => {
  test('Register berhasil', async ({ page }) => {
    const email = generateEmail('authreg');
    await registerUser(page, { email, role: 'student' });
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test('Login berhasil → redirect ke dashboard', async ({ page }) => {
    const email = generateEmail('authlogin');
    await registerUser(page, { email, role: 'student' });
    await loginUser(page, { email });
    await expect(page).toHaveURL(/\/dashboard\/student$/);
    await expect(page.getByText('Loading dashboard...')).toBeHidden({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible();
  });

  test('Login gagal (wrong password)', async ({ page }) => {
    const email = generateEmail('authfail');
    await registerUser(page, { email, role: 'student' });
    await page.goto('/auth/login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('WrongPass999!');
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
  });

  test('Logout → kembali ke /auth/login', async ({ page }) => {
    const email = generateEmail('authlogout');
    await registerUser(page, { email, role: 'student' });
    await loginUser(page, { email });
    await logoutUser(page);
    await expect(page).toHaveURL(/\/auth\/login$/);
  });
});

test('Register validasi: nama pendek ditolak', async ({ page }) => {
  const email = generateEmail('authval');
  await page.goto('/auth/register');
  await page.locator('#first_name').fill('A');
  await page.locator('#last_name').fill('B');
  await page.locator('#reg-email').fill(email);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByText('First name is required')).toBeVisible();
});