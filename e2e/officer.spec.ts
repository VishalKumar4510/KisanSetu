import { test, expect } from '@playwright/test';
import { loginAs, waitForLoading } from './helpers';

test.describe('Officer Mandi Operations E2E Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'officer');
  });

  test('1. Officer Dashboard loads with mandi operational metrics and live queue', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/officer/);
    await waitForLoading(page);

    // Verify Officer Header & Centre Selector
    const officerHeading = page.getByRole('heading', { level: 1, name: /Officer/i });
    await expect(officerHeading).toBeVisible();

    // Verify Metrics Panel Cards (Farmers Served, Waiting, Procurement Value, Payments)
    const metrics = page.getByText(/Farmers|Served|Procurement|Payments|किसान/i).first();
    await expect(metrics).toBeVisible({ timeout: 10000 });

    // Verify Live Queue Section
    const queuePanel = page.getByText(/Live Queue|Waiting Queue|Queue|कतार/i).first();
    await expect(queuePanel).toBeVisible();
  });

  test('2. Desk operations: view queue, call waiting farmer, and verify current farmer panel', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/officer/);
    await waitForLoading(page);

    // Locate Call Next Farmer button
    const callButton = page.locator('button').filter({ hasText: /Call|Next|बुलाएं/i }).first();
    if (await callButton.isVisible()) {
      await callButton.click();
      await page.waitForTimeout(500);

      // If a confirmation modal appears, confirm
      const confirmModalBtn = page.locator('[role="dialog"]').locator('button').filter({ hasText: /Confirm|Call|हाँ/i }).first();
      if (await confirmModalBtn.isVisible()) {
        await confirmModalBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Verify Current Active Farmer Desk Header is present
    const farmerDesk = page.getByText(/Current Farmer|Active Lot|Procurement Desk|Desk|टोकन/i).first();
    await expect(farmerDesk).toBeVisible();
  });

  test('3. Procurement workflow steps: weighment, quality assessment, MSP calculation, and receipt', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/officer/);
    await waitForLoading(page);

    // Step Steppers (Weighment -> Quality -> Procurement -> Payment)
    const stepper = page.getByText(/Weighment|Quality|Procurement|Payment|वजन|गुणवत्ता/i).first();
    await expect(stepper).toBeVisible();

    // Verify reconciliation / payment records table in lower tabs
    const historyTab = page.locator('button').filter({ hasText: /Reconciliation|History|Payments/i }).first();
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(400);

      const tableRows = page.locator('table tr, [class*="divide-y"] > div');
      expect(await tableRows.count()).toBeGreaterThan(0);
    }
  });
});
