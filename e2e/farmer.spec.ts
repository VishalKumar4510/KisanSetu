import { test, expect } from '@playwright/test';
import { loginAs, waitForLoading, clearActiveBookingIfAny } from './helpers';

test.describe('Farmer E2E Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'farmer');
  });

  test('1. Farmer Dashboard loads with profile, status, and navigation quick actions', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/farmer/);
    await waitForLoading(page);

    // Verify main dashboard elements
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();

    // Verify quick action buttons or navigation
    const quickActions = page.locator('button, a').filter({ hasText: /Slot|Token|Queue|स्लॉट|टोकन|कतार|Pass|Dashboard/i });
    await expect(quickActions.first()).toBeVisible();

    // Verify stats or activity cards are visible
    const cards = page.locator('.card, [class*="rounded-2xl"], [class*="rounded-3xl"], [class*="bg-white"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('2. Slot Booking workflow: select slot, confirm reservation, and receive token', async ({ page }) => {
    // Clear any previous active booking to guarantee test repeatability
    await clearActiveBookingIfAny(page);

    // Navigate to centre selection to choose an APMC mandi
    await page.goto('/farmer/centres');
    await page.waitForLoadState('networkidle');
    await waitForLoading(page);

    // Click "Select Centre & Book Slot" on the first available centre
    const selectCentreBtn = page.locator('button').filter({ hasText: /Select Centre|केंद्र चुनें/i }).first();
    await selectCentreBtn.waitFor({ state: 'visible', timeout: 10000 });
    await selectCentreBtn.click();

    await page.waitForURL(/.*\/farmer\/slots/, { timeout: 10000 });
    await waitForLoading(page);

    // Verify slots page header
    const pageTitle = page.locator('h1, h2, h3').first();
    await expect(pageTitle).toBeVisible();

    // Find first bookable slot button inside main container
    const bookButton = page.locator('main').locator('button').filter({ hasText: /^Book$|^बुक$|Select AI Slot/i }).first();
    await bookButton.waitFor({ state: 'visible', timeout: 10000 });
    await bookButton.click();

    // Verify confirmation modal opens
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // Click confirm button in modal
    const confirmBtn = modal.getByRole('button', { name: /confirm|पुष्टि/i });
    await confirmBtn.click();

    // Verify success modal appears with issued token number
    const successHeader = page.getByText(/slot reserved successfully|आरक्षित/i).first();
    await expect(successHeader).toBeVisible({ timeout: 10000 });

    // Click to view digital token pass
    const viewPassBtn = page.getByRole('button', { name: /view digital qr pass|टोकन पास/i });
    await viewPassBtn.click();

    await page.waitForURL(/.*\/farmer\/token/, { timeout: 10000 });
  });

  test('3. Digital Token Pass view displays token code, status badge, and QR data', async ({ page }) => {
    await page.goto('/farmer/token');
    await page.waitForLoadState('networkidle');
    await waitForLoading(page);

    await expect(page).toHaveURL(/.*\/farmer\/token/);

    // Verify token details
    const tokenHeader = page.locator('h1, h2').first();
    await expect(tokenHeader).toBeVisible();

    // Verify token card contains QR code representation, token code, or status
    const tokenContent = page.getByText(/token|pass|qr|टोकन/i).first();
    await expect(tokenContent).toBeVisible();
  });

  test('4. Live Queue view tracks real-time mandi queue position and token status', async ({ page }) => {
    await page.goto('/farmer/queue');
    await page.waitForLoadState('networkidle');
    await waitForLoading(page);

    await expect(page).toHaveURL(/.*\/farmer\/queue/);

    // Verify live queue elements
    const queueHeader = page.locator('h1, h2').first();
    await expect(queueHeader).toBeVisible();

    // Verify queue status display
    const queueInfo = page.getByText(/queue|serving|position|कतार|स्थान/i).first();
    await expect(queueInfo).toBeVisible();
  });
});
