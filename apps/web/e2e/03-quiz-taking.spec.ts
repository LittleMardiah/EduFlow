import { test, expect, type Page } from '@playwright/test';
import { setupAuthenticatedUser } from './helpers/auth';

test.describe.serial('Quiz taking (student)', () => {
  let studentEmail: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    studentEmail = await setupAuthenticatedUser(page, 'student');
    await page.close();
  });

  async function loginStudent(page: Page) {
    await page.goto('/auth/login');
    await page.locator('#email').fill(studentEmail);
    await page.locator('#password').fill('TestPass123!');
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page).toHaveURL(/\/dashboard\/student$/);
  }

  test('Student bisa akses /quizzes', async ({ page }) => {
    await loginStudent(page);
    await page.goto('/quizzes');
    await expect(page.getByRole('heading', { name: 'Quiz Management' })).toBeVisible();
  });

  test('Student bisa start quiz → halaman /quizzes/[id]/take load', async ({ page }) => {
    await loginStudent(page);
    await page.goto('/quizzes');
    const takeLink = page.locator('a:has-text("Take")').first();
    if ((await takeLink.count()) === 0) {
      test.skip(true, 'Tidak ada published quiz untuk siswa di environment ini');
    }
    const href = await takeLink.getAttribute('href');
    await takeLink.click();
    await expect(page).toHaveURL(/\/quizzes\/.+\/take$/);
    await expect(page.locator('text=Start Quiz')).toBeVisible();
    expect(href).toContain('/take');
  });

  test('Timer muncul di halaman take quiz', async ({ page }) => {
    await loginStudent(page);
    await page.goto('/quizzes');
    const takeLink = page.locator('a:has-text("Take")').first();
    if ((await takeLink.count()) === 0) {
      test.skip(true, 'Tidak ada published quiz untuk siswa di environment ini');
    }
    await takeLink.click();
    await expect(page).toHaveURL(/\/quizzes\/.+\/take$/);
    await expect(page.locator('.font-mono')).toBeVisible();
  });
});