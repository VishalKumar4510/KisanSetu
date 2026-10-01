import { test, expect } from '@playwright/test';
import { loginAs, waitForLoading } from './helpers';

test.describe('Admin Control & Analytics E2E Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('1. Admin Dashboard loads with state-level procurement metrics and quick monitoring', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/admin/);
    await waitForLoading(page);

    // Verify Admin Header / Role Identity
    const adminIdentity = page.getByText(/Command Centre|State Agricultural/i).first();
    await expect(adminIdentity).toBeVisible();

    // Verify Dashboard Cards / Metrics
    const metricsCards = page.locator('.card, [class*="rounded-2xl"], [class*="rounded-3xl"], [class*="bg-white"]');
    expect(await metricsCards.count()).toBeGreaterThan(0);
  });

  test('2. Analytics view displays real-time trends, volume metrics, and distribution', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
    await waitForLoading(page);

    await expect(page).toHaveURL(/.*\/admin\/analytics/);

    // Verify Analytics Page Title
    const analyticsHeader = page.getByRole('heading', { level: 1, name: /analytics/i });
    await expect(analyticsHeader).toBeVisible();

    // Verify presence of charts or statistical summaries
    const chartContainers = page.locator('.recharts-responsive-container, svg, canvas, [class*="chart"]');
    expect(await chartContainers.count()).toBeGreaterThan(0);
  });

  test('3. Centre Monitoring view lists procurement mandis with operational status', async ({ page }) => {
    await page.goto('/admin/centres');
    await page.waitForLoadState('networkidle');
    await waitForLoading(page);

    await expect(page).toHaveURL(/.*\/admin\/centres/);

    // Verify Centres Header
    const centresHeader = page.getByRole('heading', { level: 1, name: /centre|mandi/i });
    await expect(centresHeader).toBeVisible();

    // Verify Centre Cards / Grid items
    const centreItems = page.getByText(/mandi|capacity|status/i).first();
    await expect(centreItems).toBeVisible();
  });
});
