import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser } from './helpers/auth';

test.describe('Dashboards', () => {
  test('Student dashboard load dengan stat cards', async ({ page }) => {
    await setupAuthenticatedUser(page, 'student');
    await expect(page).toHaveURL(/\/dashboard\/student$/);
    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible();
    await expect(page.getByText('Quizzes Completed')).toBeVisible();
    await expect(page.getByText('Average Score')).toBeVisible();
  });

  test('Instructor dashboard load', async ({ page }) => {
    await setupAuthenticatedUser(page, 'instructor');
    await expect(page).toHaveURL(/\/dashboard\/instructor$/);
    await expect(page.getByRole('heading', { name: 'Instructor Dashboard' })).toBeVisible();
    await expect(page.getByText('Total Quizzes')).toBeVisible();
    await expect(page.getByText('Total Students')).toBeVisible();
  });

  test('Admin dashboard load', async ({ page }) => {
    await setupAuthenticatedUser(page, 'admin');
    await expect(page).toHaveURL(/\/dashboard\/admin$/);
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await expect(page.getByText('Total Users')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'System Health' })).toBeVisible();
  });
});