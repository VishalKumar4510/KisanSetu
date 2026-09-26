const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'audit_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800, isMobile: true },
  { name: '390x844', width: 390, height: 844, isMobile: true },
  { name: '430x932', width: 430, height: 932, isMobile: true },
  { name: '768x1024', width: 768, height: 1024, isTablet: true },
  { name: '1024x768', width: 1024, height: 768, isTablet: true },
  { name: '1280x720', width: 1280, height: 720, isDesktop: true },
  { name: '1440x900', width: 1440, height: 900, isDesktop: true },
  { name: '1920x1080', width: 1920, height: 1080, isDesktop: true },
];

async function inspectPage(page, flowName, pageName, vp) {
  return await page.evaluate((context) => {
    const issues = [];
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const docHeight = document.documentElement.clientHeight;
    const scrollHeight = document.documentElement.scrollHeight;

    // 1. Horizontal Overflow Check
    if (scrollWidth > docWidth + 3) {
      const culprits = [];
      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 3 && rect.width > 0) {
          culprits.push({
            tag: el.tagName.toLowerCase(),
            class: (el.className || '').toString().slice(0, 40),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          });
        }
      });
      issues.push({
        type: 'HORIZONTAL_OVERFLOW',
        severity: 'HIGH',
        problem: `Horizontal overflow detected: page scrollWidth (${scrollWidth}px) exceeds viewport width (${docWidth}px) by ${scrollWidth - docWidth}px`,
        culprits: culprits.slice(0, 3),
      });
    }

    // 2. Table Overflow Check
    document.querySelectorAll('table').forEach((tbl) => {
      const rect = tbl.getBoundingClientRect();
      const parent = tbl.parentElement;
      const parentStyle = parent ? window.getComputedStyle(parent) : null;
      const isScrollable = parentStyle && (parentStyle.overflowX === 'auto' || parentStyle.overflowX === 'scroll');
      if (rect.width > docWidth && !isScrollable) {
        issues.push({
          type: 'TABLE_OVERFLOW',
          severity: 'HIGH',
          problem: `Table width (${Math.round(rect.width)}px) exceeds viewport width without an overflow container`,
        });
      }
    });

    // 3. Modal / Dialog Overflow
    document.querySelectorAll('[role="dialog"]').forEach((dlg) => {
      const rect = dlg.getBoundingClientRect();
      if (rect.height > window.innerHeight) {
        issues.push({
          type: 'MODAL_OVERFLOW',
          severity: 'HIGH',
          problem: `Modal dialog height (${Math.round(rect.height)}px) exceeds viewport height (${window.innerHeight}px)`,
        });
      }
      if (rect.width > window.innerWidth) {
        issues.push({
          type: 'MODAL_OVERFLOW',
          severity: 'HIGH',
          problem: `Modal dialog width (${Math.round(rect.width)}px) exceeds viewport width (${window.innerWidth}px)`,
        });
      }
    });

    // 4. Fixed / Sticky Navigation Overlap
    const bottomNav = document.querySelector('.fixed.bottom-0');
    const mainContent = document.querySelector('main');
    if (bottomNav && mainContent) {
      const navRect = bottomNav.getBoundingClientRect();
      const mainComputed = window.getComputedStyle(mainContent);
      const pb = parseFloat(mainComputed.paddingBottom) || 0;
      if (navRect.height > 0 && pb < navRect.height - 10) {
        issues.push({
          type: 'NAVIGATION_OVERLAP',
          severity: 'MEDIUM',
          problem: `Bottom fixed navigation (${Math.round(navRect.height)}px) may overlap content; main padding-bottom is only ${pb}px`,
        });
      }
    }

    // 5. Chart Clipping
    document.querySelectorAll('.recharts-responsive-container').forEach((chart) => {
      const rect = chart.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        issues.push({
          type: 'CHART_CLIPPING',
          severity: 'HIGH',
          problem: 'Recharts responsive container collapsed to 0 width or height',
        });
      }
    });

    // 6. Token / QR Sizing Check
    const qrEl = document.querySelector('[data-testid="token-qr"], svg[aria-label*="QR"], .token-qr, [class*="qr"] svg, canvas');
    if (qrEl) {
      const rect = qrEl.getBoundingClientRect();
      if (rect.width > docWidth) {
        issues.push({
          type: 'QR_OVERSIZED',
          severity: 'HIGH',
          problem: `QR code width (${Math.round(rect.width)}px) exceeds viewport width`,
        });
      }
    }

    // 7. Small Touch Targets on Mobile (< 28px width/height)
    if (context.isMobile) {
      const tiny = [];
      document.querySelectorAll('button:not([hidden]), a[role="button"]:not([hidden])').forEach((btn) => {
        const r = btn.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.height < 28 || r.width < 28)) {
          const txt = (btn.innerText || btn.getAttribute('aria-label') || 'Icon Button').trim().replace(/\s+/g, ' ').slice(0, 25);
          tiny.push({ label: txt, width: Math.round(r.width), height: Math.round(r.height) });
        }
      });
      if (tiny.length > 0) {
        issues.push({
          type: 'TOUCH_TARGET_COMPACT',
          severity: 'LOW',
          problem: `${tiny.length} interactive elements have tap bounds under 28px (compact console density)`,
          elements: tiny.slice(0, 3),
        });
      }
    }

    // 8. Clipped Text or Text Overflow
    document.querySelectorAll('h1, h2, h3, .font-bold, .font-semibold').forEach((heading) => {
      if (heading.scrollWidth > heading.clientWidth + 5 && window.getComputedStyle(heading).overflow === 'hidden' && !heading.className.includes('truncate')) {
        issues.push({
          type: 'CLIPPED_TEXT',
          severity: 'MEDIUM',
          problem: `Heading text "${heading.innerText.slice(0, 20)}..." has clipped content (${heading.scrollWidth}px vs ${heading.clientWidth}px)`,
        });
      }
    });

    return {
      docWidth,
      scrollWidth,
      docHeight,
      scrollHeight,
      issueCount: issues.length,
      issues,
    };
  }, { isMobile: vp.isMobile, vpName: vp.name });
}

async function getAuthTokens() {
  const tokens = {};
  for (const role of ['FARMER', 'OFFICER', 'ADMIN']) {
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
    const json = await res.json();
    tokens[role] = { token: json.data.token, user: json.data.user };
  }
  return tokens;
}

async function main() {
  console.log('=== KisanSetu Comprehensive Multi-Viewport Visual Audit ===\n');
  const tokens = await getAuthTokens();
  console.log('API Authentication tokens acquired for FARMER, OFFICER, ADMIN.\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();

  let currentRole = '__none__';
  async function switchRole(targetRole) {
    if (currentRole === targetRole) return;
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    if (targetRole) {
      const { token, user } = tokens[targetRole];
      await page.evaluate((t, u) => {
        localStorage.setItem('kisansetu_token', t);
        localStorage.setItem('kisansetu_user', JSON.stringify(u));
      }, token, user);
    } else {
      await page.evaluate(() => {
        try { localStorage.clear(); } catch(e) {}
      });
    }
    currentRole = targetRole;
  }

  const allResults = [];
  const cleanPages = new Set();
  const pagesWithIssues = new Set();

  // Define All Flows and Pages
  const auditPlan = [
    // --- 1. AUTH ---
    {
      flow: 'AUTH',
      role: null,
      pageName: 'Login Screen',
      url: 'http://localhost:5173/login',
      customActions: async () => {},
    },

    // --- 2. FARMER FLOW ---
    {
      flow: 'FARMER',
      role: 'FARMER',
      pageName: 'Farmer Dashboard',
      url: 'http://localhost:5173/farmer',
      customActions: async () => {},
    },
    {
      flow: 'FARMER',
      role: 'FARMER',
      pageName: 'Centre Selection',
      url: 'http://localhost:5173/farmer/centres',
      customActions: async () => {},
    },
    {
      flow: 'FARMER',
      role: 'FARMER',
      pageName: 'Slot Booking',
      url: 'http://localhost:5173/farmer/slots',
      customActions: async () => {},
    },
    {
      flow: 'FARMER',
      role: 'FARMER',
      pageName: 'Digital Token',
      url: 'http://localhost:5173/farmer/token',
      customActions: async () => {},
    },
    {
      flow: 'FARMER',
      role: 'FARMER',
      pageName: 'Live Queue',
      url: 'http://localhost:5173/farmer/queue',
      customActions: async () => {},
    },
    {
      flow: 'FARMER',
      role: 'FARMER',
      pageName: 'Procurement Progress',
      url: 'http://localhost:5173/farmer/procurement',
      customActions: async () => {},
    },
    {
      flow: 'FARMER',
      role: 'FARMER',
      pageName: 'Payment Status',
      url: 'http://localhost:5173/farmer/payment',
      customActions: async () => {},
    },

    // --- 3. OFFICER FLOW ---
    {
      flow: 'OFFICER',
      role: 'OFFICER',
      pageName: 'Officer Dashboard & Console',
      url: 'http://localhost:5173/officer',
      customActions: async () => {},
    },
    {
      flow: 'OFFICER',
      role: 'OFFICER',
      pageName: 'Queue Management',
      url: 'http://localhost:5173/officer/queue',
      customActions: async () => {},
    },
    {
      flow: 'OFFICER',
      role: 'OFFICER',
      pageName: 'Procurement Workbench',
      url: 'http://localhost:5173/officer/procurement',
      customActions: async () => {},
    },
    {
      flow: 'OFFICER',
      role: 'OFFICER',
      pageName: 'Payment Review Workbench Step',
      url: 'http://localhost:5173/officer',
      customActions: async (p) => {
        // Click on Step 5 Pay Review in Workbench stepper if visible
        await p.evaluate(() => {
          const step5Btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Pay Review') || b.innerText.includes('5. Pay Review'));
          if (step5Btn) step5Btn.click();
        });
        await new Promise(r => setTimeout(r, 300));
      },
    },
    {
      flow: 'OFFICER',
      role: 'OFFICER',
      pageName: 'Receipt & Settlement View',
      url: 'http://localhost:5173/officer',
      customActions: async (p) => {
        // Navigate to Step 7 Receipt
        await p.evaluate(() => {
          const step7Btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Receipt') || b.innerText.includes('7. Receipt'));
          if (step7Btn) step7Btn.click();
        });
        await new Promise(r => setTimeout(r, 300));
      },
    },

    // --- 4. ADMIN FLOW ---
    {
      flow: 'ADMIN',
      role: 'ADMIN',
      pageName: 'Admin Command Centre Dashboard',
      url: 'http://localhost:5173/admin',
      customActions: async () => {},
    },
    {
      flow: 'ADMIN',
      role: 'ADMIN',
      pageName: 'Centre Monitoring',
      url: 'http://localhost:5173/admin/centres',
      customActions: async () => {},
    },
    {
      flow: 'ADMIN',
      role: 'ADMIN',
      pageName: 'Payment Monitoring',
      url: 'http://localhost:5173/admin/payments',
      customActions: async () => {},
    },
    {
      flow: 'ADMIN',
      role: 'ADMIN',
      pageName: 'State Analytics',
      url: 'http://localhost:5173/admin/analytics',
      customActions: async () => {},
    },
    {
      flow: 'ADMIN',
      role: 'ADMIN',
      pageName: 'Executive Reports',
      url: 'http://localhost:5173/admin/reports',
      customActions: async () => {},
    },
  ];

  let totalViewportChecks = 0;
  let totalIssuesRecorded = 0;

  for (const item of auditPlan) {
    console.log(`Auditing [${item.flow}] ${item.pageName}...`);

    let pageHasIssueInAnyVp = false;
    await switchRole(item.role);

    for (const vp of VIEWPORTS) {
      totalViewportChecks++;
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(item.url, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 350));

      if (item.customActions) {
        try {
          await item.customActions(page);
        } catch (e) {
          // ignore custom action errors
        }
      }

      const evalData = await inspectPage(page, item.flow, item.pageName, vp);

      // Take screenshot for representative viewports (390x844 mobile, 768x1024 tablet, 1440x900 desktop, 1920x1080 full HD)
      const shouldScreenshot = ['390x844', '768x1024', '1440x900', '1920x1080'].includes(vp.name);
      let screenshotFile = null;

      if (shouldScreenshot) {
        const safeName = `${item.flow.toLowerCase()}_${item.pageName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${vp.name}.png`;
        screenshotFile = path.join(SCREENSHOT_DIR, safeName);
        await page.screenshot({ path: screenshotFile });
      }

      if (evalData.issues.length > 0) {
        pageHasIssueInAnyVp = true;
        totalIssuesRecorded += evalData.issues.length;
        allResults.push({
          flow: item.flow,
          page: item.pageName,
          viewport: vp.name,
          issues: evalData.issues,
          screenshot: screenshotFile,
        });
      }
    }

    if (!pageHasIssueInAnyVp) {
      cleanPages.add(`[${item.flow}] ${item.pageName}`);
    } else {
      pagesWithIssues.add(`[${item.flow}] ${item.pageName}`);
    }
  }

  await browser.close();

  const summary = {
    totalCheckedViews: auditPlan.length,
    totalViewportChecks,
    totalIssuesFound: allResults.reduce((acc, r) => acc + r.issues.length, 0),
    cleanPagesCount: cleanPages.size,
    cleanPages: Array.from(cleanPages),
    pagesWithIssuesCount: pagesWithIssues.size,
    pagesWithIssues: Array.from(pagesWithIssues),
    detailedFindings: allResults,
  };

  const outputPath = path.join(__dirname, 'final_visual_audit_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

  console.log('\n================ AUDIT COMPLETE ================');
  console.log(`Total Pages / Views Checked: ${summary.totalCheckedViews}`);
  console.log(`Total Viewport Checks: ${summary.totalViewportChecks}`);
  console.log(`Pages with Zero Issues: ${summary.cleanPagesCount} / ${summary.totalCheckedViews}`);
  console.log(`Issues Recorded: ${summary.totalIssuesFound}`);
  console.log(`Report JSON written to: ${outputPath}`);
}

main().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
