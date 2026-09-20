import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { setupAuthenticatedUser } from './helpers/auth';

const BASE_URL = 'http://localhost:3000';

async function createPublishedQuiz(ctx: BrowserContext): Promise<string> {
  const api = ctx.request;
  const email = `quiz-ins-${Date.now()}@example.com`;

  const regRes = await api.post(`${BASE_URL}/api/v1/auth/register`, {
    data: { email, password: 'TestPass123!', first_name: 'Test', last_name: 'User', role: 'instructor' },
  });
  expect(regRes.status()).toBe(201);

  const loginRes = await api.post(`${BASE_URL}/api/v1/auth/login`, {
    data: { email, password: 'TestPass123!' },
  });
  expect(loginRes.status()).toBe(200);
  const token = ((await loginRes.json()) as { data: { token: string } }).data.token;
  const headers = { Authorization: `Bearer ${token}` };

  const quizRes = await api.post(`${BASE_URL}/api/v1/quizzes`, {
    headers,
    data: {
      title: `E2E Published Quiz ${Date.now()}`,
      description: 'Created by e2e setup',
      quiz_type: 'standard',
      passing_score: 70,
      duration_minutes: 10,
      max_attempts: -1,
    },
  });
  expect(quizRes.status()).toBe(201);
  const quizId = ((await quizRes.json()) as { data: { id: string } }).data.id;

  for (let i = 1; i <= 5; i++) {
    const qRes = await api.post(`${BASE_URL}/api/v1/quizzes/${quizId}/questions`, {
      headers,
      data: { question_text: `E2E Setup Question ${i}`, question_type: 'mcq', difficulty_level: 'medium', points: 1 },
    });
    expect(qRes.status()).toBe(201);
  }

  const pubRes = await api.patch(`${BASE_URL}/api/v1/quizzes/${quizId}/publish`, {
    headers,
    data: { change_reason: 'e2e setup' },
  });
  expect(pubRes.status()).toBe(200);

  const warmRes = await api.get(`${BASE_URL}/api/v1/quizzes/${quizId}`, { headers });
  expect(warmRes.status()).toBe(200);

  return quizId;
}

test.describe.serial('Quiz taking (student)', () => {
  let studentEmail: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    try {
      await createPublishedQuiz(ctx);
    } finally {
      await ctx.close();
    }
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
    await expect(takeLink).toBeVisible();
    const href = await takeLink.getAttribute('href');
    await takeLink.click();
    await expect(page).toHaveURL(/\/quizzes\/.+\/take$/);
    await expect(page.locator('text=Start Quiz')).toBeVisible({ timeout: 15000 });
    expect(href).toContain('/take');
  });

  test('Timer muncul di halaman take quiz', async ({ page }) => {
    await loginStudent(page);
    await page.goto('/quizzes');
    const takeLink = page.locator('a:has-text("Take")').first();
    await expect(takeLink).toBeVisible();
    await takeLink.click();
    await expect(page).toHaveURL(/\/quizzes\/.+\/take$/);
    await expect(page.locator('.font-mono')).toBeVisible({ timeout: 15000 });
  });
});