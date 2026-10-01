import { Page, expect } from '@playwright/test';

/**
 * E2E Helper Utilities for KisanSetu
 * Uses accessible roles, stable inputs, and handles language localization gracefully.
 */

export const CREDENTIALS = {
  farmer: { phone: 'farmer1', password: 'farmer1', name: 'Farmer' },
  officer: { phone: 'officer1', password: 'officer1', name: 'Officer' },
  admin: { phone: 'admin1', password: 'admin1', name: 'Admin' },
};

/**
 * Wait for any global loading spinner to finish.
 */
export async function waitForLoading(page: Page): Promise<void> {
  // Wait for the full-screen or button loading spinner to disappear if present
  const spinner = page.locator('.animate-spin');
  if (await spinner.count() > 0) {
    await spinner.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }
}

/**
 * Log into KisanSetu using credentials or quick demo buttons.
 */
export async function loginAs(
  page: Page,
  role: 'farmer' | 'officer' | 'admin'
): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Ensure English language is selected for consistent text assertions
  const langButton = page.locator('button:has-text("हिन्दी"), button:has-text("English")');
  if (await langButton.isVisible()) {
    const text = await langButton.innerText();
    if (text.includes('English')) {
      // Current language is Hindi, switch to English
      await langButton.click();
      await page.waitForTimeout(300);
    }
  }

  const cred = CREDENTIALS[role];

  // Fill credentials
  const phoneInput = page.locator('input[type="text"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await phoneInput.fill(cred.phone);
  await passwordInput.fill(cred.password);

  // Click submit button
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  // Wait for navigation to destination dashboard
  const targetPath = role === 'farmer' ? '/farmer' : role === 'officer' ? '/officer' : '/admin';
  await page.waitForURL(new RegExp(targetPath), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await waitForLoading(page);
}

/**
 * Logout from current user session.
 */
export async function logout(page: Page): Promise<void> {
  // Try locating logout button in top navigation, sidebar, or header
  const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("लॉग आउट"), button[aria-label="Logout"], button[title="Logout"]').first();
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  } else {
    // Clear localStorage and navigate to /login if button is in a mobile dropdown
    await page.evaluate(() => {
      localStorage.removeItem('kisansetu_token');
      localStorage.removeItem('kisansetu_user');
    });
    await page.goto('/login');
  }

  await page.waitForURL(/.*login/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Resets any active booking for the currently logged-in farmer to guarantee test idempotency.
 */
export async function clearActiveBookingIfAny(page: Page): Promise<void> {
  await page.evaluate(async () => {
    try {
      const token = localStorage.getItem('kisansetu_token');
      if (!token) return;
      const res = await fetch('/api/farmers/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.data?.activeToken?.id) {
        await fetch('/api/slots/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tokenId: data.data.activeToken.id }),
        });
      }
    } catch {
      // ignore
    }
  });
}

