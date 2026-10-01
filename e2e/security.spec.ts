import { test, expect } from '@playwright/test';
import { loginAs, logout, waitForLoading } from './helpers';

test.describe('Security & Access Control E2E Workflows', () => {
  test('1. Unauthenticated users are strictly blocked and redirected from protected routes', async ({ page }) => {
    // Attempt accessing farmer route
    await page.goto('/farmer');
    await page.waitForURL(/.*login/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);

    // Attempt accessing officer route
    await page.goto('/officer');
    await page.waitForURL(/.*login/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);

    // Attempt accessing admin route
    await page.goto('/admin');
    await page.waitForURL(/.*login/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('2. Role restriction: Farmer is forbidden from accessing Officer and Admin dashboards', async ({ page }) => {
    await loginAs(page, 'farmer');
    await expect(page).toHaveURL(/.*\/farmer/);

    // Farmer attempts navigating to /admin
    await page.goto('/admin');
    // ProtectedRoute redirects unauthorized roles to /login
    await page.waitForURL(/.*login/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);

    // Farmer attempts navigating to /officer
    await page.goto('/officer');
    await page.waitForURL(/.*login/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('3. Role restriction: Officer is forbidden from accessing Admin control console', async ({ page }) => {
    await loginAs(page, 'officer');
    await expect(page).toHaveURL(/.*\/officer/);

    // Officer attempts navigating to /admin
    await page.goto('/admin');
    await page.waitForURL(/.*login/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('4. Logout completely purges session tokens and revokes access to protected routes', async ({ page }) => {
    await loginAs(page, 'farmer');
    await expect(page).toHaveURL(/.*\/farmer/);

    // Execute logout
    await logout(page);
    await expect(page).toHaveURL(/.*login/);

    // Verify localStorage auth tokens are cleared
    const storedToken = await page.evaluate(() => localStorage.getItem('kisansetu_token'));
    expect(storedToken).toBeNull();

    // Verify navigating back to /farmer is blocked
    await page.goto('/farmer');
    await page.waitForURL(/.*login/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('5. Malformed or forged tokens are rejected and purged', async ({ page }) => {
    await page.goto('/login');
    // Inject forged token
    await page.evaluate(() => {
      localStorage.setItem('kisansetu_token', 'forged.fake.jwt.token');
      localStorage.setItem('kisansetu_user', JSON.stringify({ role: 'ADMIN', name: 'Hacker' }));
    });

    // Attempt visiting /admin
    await page.goto('/admin');
    // Auth context or API interceptor rejects forged token and redirects
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });
});
