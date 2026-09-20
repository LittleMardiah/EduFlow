import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser } from './helpers/auth';
import { generateEmail } from './fixtures/test-data';

test.describe.serial('Quiz creation (instructor)', () => {
  let instructorEmail: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    instructorEmail = await setupAuthenticatedUser(page, 'instructor');
    await page.close();
  });

  test('Instructor bisa akses /quizzes/create', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('#email').fill(instructorEmail);
    await page.locator('#password').fill('TestPass123!');
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page).toHaveURL(/\/dashboard\/instructor$/);
    await page.goto('/quizzes/create');
    await expect(page.getByRole('heading', { name: 'Create New Quiz' })).toBeVisible();
  });

  const quizTitle = `E2E Draft Quiz ${Date.now()}`;

  test('Create quiz draft berhasil', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('#email').fill(instructorEmail);
    await page.locator('#password').fill('TestPass123!');
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page).toHaveURL(/\/dashboard\/instructor$/);

    await page.goto('/quizzes/create');
    await page.locator('input[placeholder="Quiz title"]').fill(quizTitle);
    await page.locator('textarea[placeholder="Description (optional)"]').fill('Dibuat oleh E2E test');
    await page.getByRole('button', { name: 'Create Quiz' }).click();

    await expect(page).toHaveURL(/\/quizzes$/);
    await expect(page.getByRole('heading', { name: 'Quiz Management' })).toBeVisible();
  });

  test('Quiz muncul di list /quizzes', async ({ page }) => {
    await page.goto('/auth/login');
    await page.locator('#email').fill(instructorEmail);
    await page.locator('#password').fill('TestPass123!');
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page).toHaveURL(/\/dashboard\/instructor$/);
    await page.goto('/quizzes');
    await expect(page.getByRole('heading', { name: 'Quiz Management' })).toBeVisible();
    const row = page.locator('tr', { hasText: quizTitle });
    await expect(row).toBeVisible();
    await expect(row.getByText('draft', { exact: true })).toBeVisible();
  });
});