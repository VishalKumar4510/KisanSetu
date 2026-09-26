const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'phase11_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verify() {
  console.log('Verifying Phase 11 Component Integrations...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1440,900'],
  });

  const page = await browser.newPage();

  // Helper for auth
  async function auth(role) {
    const creds = {
      FARMER: { phone: 'farmer1', password: 'farmer1' },
      OFFICER: { phone: 'officer1', password: 'officer1' },
      ADMIN: { phone: 'admin1', password: 'admin1' },
    }[role];
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    const { data } = await res.json();
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate((t, u) => {
      localStorage.setItem('kisansetu_token', t);
      localStorage.setItem('kisansetu_user', JSON.stringify(u));
    }, data.token, data.user);
  }

  // 1. Farmer Dashboard (Desktop & Mobile)
  await auth('FARMER');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/farmer', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'farmer_dashboard_desktop.png') });

  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/farmer', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'farmer_dashboard_mobile.png') });

  // 2. Farmer Procurement Timeline
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/farmer/procurement', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'farmer_procurement_timeline.png') });

  // 3. Officer Sidebar
  await auth('OFFICER');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/officer', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'officer_sidebar.png') });

  // 4. Admin Sidebar & Progress Metric Cards
  await auth('ADMIN');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin_metric_cards_and_sidebar.png') });

  // Check overflow across all
  const docWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(`Admin page width: ${docWidth}px, scrollWidth: ${scrollWidth}px (Overflow: ${scrollWidth > docWidth})`);

  await browser.close();
  console.log('Phase 11 Verification Complete! Screenshots saved to:', SCREENSHOT_DIR);
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
