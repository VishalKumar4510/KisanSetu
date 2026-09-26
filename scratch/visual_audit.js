const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
];

async function detectVisualIssues(page, pageName, vp) {
  return await page.evaluate((context) => {
    const issues = [];
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;

    // 1. Horizontal overflow check
    if (scrollWidth > docWidth + 3) {
      const overflowingElements = [];
      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 3 && rect.width > 0) {
          overflowingElements.push({
            tag: el.tagName.toLowerCase(),
            className: el.className ? String(el.className).slice(0, 50) : '',
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            text: el.innerText ? el.innerText.slice(0, 25).trim() : '',
          });
        }
      });

      issues.push({
        type: 'HORIZONTAL_OVERFLOW',
        severity: 'HIGH',
        message: `Page scrollWidth (${scrollWidth}px) exceeds viewport width (${docWidth}px) by ${scrollWidth - docWidth}px`,
        elements: overflowingElements.slice(0, 4),
      });
    }

    // 2. Buttons too small on mobile (< 30px width or height)
    if (context.width <= 430) {
      const tinyButtons = [];
      document.querySelectorAll('button:not([hidden]), a[role="button"]:not([hidden])').forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        // check only visible elements in viewport
        if (rect.width > 0 && rect.height > 0 && (rect.height < 28 || rect.width < 28)) {
          const txt = btn.innerText?.trim() || btn.getAttribute('aria-label') || btn.getAttribute('title') || 'unlabeled button';
          tinyButtons.push({ text: txt.slice(0, 25), width: Math.round(rect.width), height: Math.round(rect.height) });
        }
      });
      if (tinyButtons.length > 0) {
        issues.push({
          type: 'SMALL_BUTTONS_MOBILE',
          severity: 'LOW',
          message: `${tinyButtons.length} interactive elements have touch targets under 28px`,
          sample: tinyButtons.slice(0, 3),
        });
      }
    }

    // 3. Clipped or overflowing modal dialogs
    const dialog = document.querySelector('[role="dialog"]');
    if (dialog) {
      const r = dialog.getBoundingClientRect();
      if (r.height > window.innerHeight) {
        issues.push({
          type: 'MODAL_OVERFLOW',
          severity: 'HIGH',
          message: `Modal height (${Math.round(r.height)}px) exceeds viewport height (${window.innerHeight}px)`,
        });
      }
    }

    // 4. Broken images or chart rendering failure
    const emptyCharts = document.querySelectorAll('.recharts-responsive-container');
    emptyCharts.forEach((c) => {
      const r = c.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        issues.push({
          type: 'CHART_COLLAPSED',
          severity: 'MEDIUM',
          message: 'A Recharts responsive container rendered with 0 width or height',
        });
      }
    });

    return issues;
  }, { pageName, width: vp.width, height: vp.height });
}

async function runAudit() {
  console.log('Launching Headless Chrome for Visual Verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  const findings = [];

  // Helper to set auth state directly into localStorage
  async function setAuth(role) {
    const creds = {
      FARMER: { phone: 'farmer1', password: 'farmer1' },
      OFFICER: { phone: 'officer1', password: 'officer1' },
      ADMIN: { phone: 'admin1', password: 'admin1' },
    }[role];

    // Get token via backend API
    const res = await fetch('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds),
    });
    const json = await res.json();
    const token = json.data.token;
    const user = json.data.user;

    await page.goto('http://localhost:5173/login', { waitUntil: 'load' });
    await page.evaluate((t, u) => {
      localStorage.setItem('kisansetu_token', t);
      localStorage.setItem('kisansetu_user', JSON.stringify(u));
    }, token, user);
  }

  // ==========================================
  // 1. AUDIT LOGIN SCREEN
  // ==========================================
  console.log('Auditing Login screen across all 8 viewports...');
  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 400));

    const issues = await detectVisualIssues(page, 'Login', vp);
    if (issues.length > 0) {
      findings.push({ page: 'Login', viewport: vp.name, issues });
    }

    if (['360x800', '768x1024', '1440x900'].includes(vp.name)) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `login_${vp.name}.png`) });
    }
  }

  // ==========================================
  // 2. AUDIT FARMER FLOW
  // ==========================================
  console.log('Auditing Farmer flow across all 8 viewports...');
  await setAuth('FARMER');

  const farmerPages = [
    { name: 'Dashboard', path: '/farmer' },
    { name: 'Centre Selection', path: '/farmer/centres' },
    { name: 'Slot Booking', path: '/farmer/slots' },
    { name: 'Digital Token', path: '/farmer/token' },
    { name: 'Live Queue', path: '/farmer/queue' },
    { name: 'Procurement Progress', path: '/farmer/procurement' },
    { name: 'Payment Status', path: '/farmer/payment' },
  ];

  for (const p of farmerPages) {
    console.log(`  Checking Farmer -> ${p.name}...`);
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:5173${p.path}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 400));

      const issues = await detectVisualIssues(page, p.name, vp);
      if (issues.length > 0) {
        findings.push({ page: `Farmer: ${p.name}`, viewport: vp.name, issues });
      }

      if (['360x800', '768x1024', '1440x900'].includes(vp.name)) {
        const cleanName = p.name.toLowerCase().replace(/\s+/g, '_');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `farmer_${cleanName}_${vp.name}.png`) });
      }
    }
  }

  // ==========================================
  // 3. AUDIT OFFICER FLOW
  // ==========================================
  console.log('Auditing Officer flow across all 8 viewports...');
  await setAuth('OFFICER');

  const officerPages = [
    { name: 'Officer Dashboard & Console', path: '/officer' },
    { name: 'Queue Management', path: '/officer/queue' },
    { name: 'Procurement Workbench', path: '/officer/procurement' },
  ];

  for (const p of officerPages) {
    console.log(`  Checking Officer -> ${p.name}...`);
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:5173${p.path}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 400));

      const issues = await detectVisualIssues(page, p.name, vp);
      if (issues.length > 0) {
        findings.push({ page: `Officer: ${p.name}`, viewport: vp.name, issues });
      }

      if (['360x800', '768x1024', '1440x900'].includes(vp.name)) {
        const cleanName = p.name.toLowerCase().replace(/[\s&]+/g, '_');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `officer_${cleanName}_${vp.name}.png`) });
      }
    }
  }

  // Check Officer Modals (Payment Review & Receipt)
  console.log('  Checking Officer modals...');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/officer', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  // Try opening review modal if available
  const hasReviewBtn = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Payment Review') || b.innerText.includes('Review Payment'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (hasReviewBtn) {
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'officer_review_modal_390x844.png') });
    const modalIssues = await detectVisualIssues(page, 'Officer Review Modal', { width: 390, height: 844, name: '390x844' });
    if (modalIssues.length > 0) findings.push({ page: 'Officer: Review Modal', viewport: '390x844', issues: modalIssues });
  }

  // ==========================================
  // 4. AUDIT ADMIN FLOW
  // ==========================================
  console.log('Auditing Admin flow across all 8 viewports...');
  await setAuth('ADMIN');

  const adminPages = [
    { name: 'Command Centre Dashboard', path: '/admin' },
    { name: 'Centre Monitoring', path: '/admin/centres' },
    { name: 'Payment Monitoring', path: '/admin/payments' },
    { name: 'State Analytics', path: '/admin/analytics' },
    { name: 'Executive Reports', path: '/admin/reports' },
  ];

  for (const p of adminPages) {
    console.log(`  Checking Admin -> ${p.name}...`);
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:5173${p.path}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 400));

      const issues = await detectVisualIssues(page, p.name, vp);
      if (issues.length > 0) {
        findings.push({ page: `Admin: ${p.name}`, viewport: vp.name, issues });
      }

      if (['390x844', '768x1024', '1440x900', '1920x1080'].includes(vp.name)) {
        const cleanName = p.name.toLowerCase().replace(/[\s&]+/g, '_');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `admin_${cleanName}_${vp.name}.png`) });
      }
    }
  }

  await browser.close();

  const reportPath = path.join(__dirname, 'visual_audit_findings.json');
  fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2));
  console.log(`\nAudit completed! Total findings logged: ${findings.length}`);
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
