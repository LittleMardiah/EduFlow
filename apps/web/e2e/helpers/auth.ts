import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { TEST_PASSWORD, TEST_NAMES } from '../fixtures/test-data';
import type { UserRole } from '../../app/types/auth';

interface UserData {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export async function registerUser(
  page: Page,
  { email, password = TEST_PASSWORD, firstName = TEST_NAMES.firstName, lastName = TEST_NAMES.lastName, role }: UserData & { role: UserRole }
): Promise<void> {
  await page.goto('/auth/register');
  await page.locator('#first_name').fill(firstName);
  await page.locator('#last_name').fill(lastName);
  await page.locator('#reg-email').fill(email);
  await page.locator('#role').selectOption(role);
  await page.locator('#reg-password').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/auth\/login$/, { timeout: 15000 });
}

export async function loginUser(
  page: Page,
  { email, password = TEST_PASSWORD }: Pick<UserData, 'email' | 'password'>
): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/dashboard\//);
}

export async function logoutUser(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
}

export async function setupAuthenticatedUser(
  page: Page,
  role: UserRole
): Promise<string> {
  const email = `test-${role}-${Date.now()}@example.com`;
  await registerUser(page, { email, role });
  await loginUser(page, { email });
  return email;
}