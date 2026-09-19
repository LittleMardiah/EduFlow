import { test, expect, type Page } from '@playwright/test';
import { setupAuthenticatedUser } from './helpers/auth';

test.describe.serial('RBAC (student)', () => {
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

  test('Student redirect dari /dashboard/instructor', async ({ page }) => {
    await loginStudent(page);
    await page.goto('/dashboard/instructor');
    await expect(page).not.toHaveURL(/\/dashboard\/instructor$/);
    await expect
      .poll(async () => page.url())
      .not.toContain('/dashboard/instructor');
  });

  test('Student redirect dari /dashboard/admin', async ({ page }) => {
    await loginStudent(page);
    await page.goto('/dashboard/admin');
    await expect
      .poll(async () => page.url())
      .not.toContain('/dashboard/admin');
  });

  test("Student ga bisa akses /quizzes/create", async ({ page }) => {
    await loginStudent(page);
    await page.goto('/quizzes/create');
    await expect
      .poll(async () => page.url())
      .not.toContain('/quizzes/create');
  });
});