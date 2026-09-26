const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\yesvi\\.gemini\\antigravity-ide\\brain\\e533b224-a978-4dfa-b784-b8fe1f2acd97\\phase12_screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'mobile_390x844', width: 390, height: 844 },
  { name: 'tablet_768x1024', width: 768, height: 1024 },
  { name: 'desktop_1440x900', width: 1440, height: 900 }
];

const PAGES_TO_TEST = [
  {
    name: 'farmer_dashboard',
    url: 'http://localhost:5173/farmer',
    loginCreds: { phone: 'farmer1', password: 'farmer1' },
    description: 'Farmer Dashboard (with 21st.dev Animated Card & quick actions)'
  },
  {
    name: 'farmer_progress',
    url: 'http://localhost:5173/farmer/procurement',
    loginCreds: { phone: 'farmer1', password: 'farmer1' },
    description: 'Farmer Procurement Progress (with 21st.dev Modern Timeline)'
  },
  {
    name: 'officer_dashboard',
    url: 'http://localhost:5173/officer',
    loginCreds: { phone: 'officer1', password: 'officer1' },
    description: 'Officer Dashboard & Workbench (with 21st.dev Dashboard Sidebar)'
  },
  {
    name: 'admin_dashboard',
    url: 'http://localhost:5173/admin',
    loginCreds: { phone: 'admin1', password: 'admin1' },
    description: 'Admin Command Centre (with 21st.dev Progress Metric Cards)'
  }
];

async function getAuthToken(creds) {
  const res = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds)
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login failed for ${creds.phone}: ${JSON.stringify(data)}`);
  return data.data;
}

(async () => {
  console.log('Starting Phase 12 Visual Verification Audit with live tokens...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const auditResults = [];

  for (const pageDef of PAGES_TO_TEST) {
    const authData = await getAuthToken(pageDef.loginCreds);

    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });

      // Navigate to blank origin to set localStorage
      await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
      await page.evaluate((auth) => {
        localStorage.setItem('kisansetu_token', auth.token);
        localStorage.setItem('kisansetu_user', JSON.stringify(auth.user));
      }, authData);

      // Navigate to target page
      await page.goto(pageDef.url, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 1800)); // Allow animations, chart transitions, and Recharts to settle

      // Run comprehensive layout evaluation
      const layoutAudit = await page.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
        const clientWidth = docEl.clientWidth;
        const hasHorizontalOverflow = scrollWidth > clientWidth + 2;

        // Check for elements overflowing horizontally
        const overflowingElements = [];
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          // Exclude decorative background blurs with blur / overflow-hidden parents
          if (rect.right > window.innerWidth + 8) {
            const style = window.getComputedStyle(el);
            if (style.position === 'absolute' && (el.className || '').includes('blur')) continue;
            overflowingElements.push({
              tag: el.tagName,
              id: el.id,
              className: (el.className || '').toString().slice(0, 60),
              right: Math.round(rect.right),
              windowWidth: window.innerWidth
            });
            if (overflowingElements.length >= 3) break;
          }
        }

        // Bottom Navigation evaluation
        const bottomNav = document.querySelector('nav[aria-label="Mobile Navigation"], .fixed.bottom-0');
        let bottomNavAudit = null;
        if (bottomNav) {
          const navRect = bottomNav.getBoundingClientRect();
          const mainContent = document.querySelector('main, .pb-20, .pb-24');
          const mainRect = mainContent ? mainContent.getBoundingClientRect() : null;
          bottomNavAudit = {
            found: true,
            visible: navRect.height > 0 && navRect.width > 0,
            height: Math.round(navRect.height),
            top: Math.round(navRect.top),
            mainHasBottomPadding: mainContent ? window.getComputedStyle(mainContent).paddingBottom : null
          };
        }

        // 21st.dev Component Specific Detections
        const animatedCard = document.querySelector('[class*="border-emerald-500"], [class*="ring-emerald-"]');
        const timeline = document.querySelector('.relative.pl-6, [class*="timeline"], [class*="Timeline"]');
        const metricCards = document.querySelectorAll('[class*="ProgressMetricCard"], [class*="progress-metric"]').length;
        const rechartsAreas = document.querySelectorAll('.recharts-area, .recharts-bar').length;

        // Check for empty/missing page content
        const pageTitle = document.title;
        const textLength = document.body.innerText.length;

        return {
          pageTitle,
          textLength,
          scrollWidth,
          clientWidth,
          hasHorizontalOverflow,
          overflowingCount: overflowingElements.length,
          overflowSample: overflowingElements,
          bottomNavAudit,
          hasAnimatedCard: !!animatedCard,
          hasTimeline: !!timeline,
          rechartsElementCount: rechartsAreas
        };
      });

      const shotFileName = `${pageDef.name}_${vp.name}.png`;
      const shotPath = path.join(SCREENSHOT_DIR, shotFileName);
      await page.screenshot({ path: shotPath, fullPage: false });

      console.log(`[VERIFIED] ${pageDef.name} @ ${vp.name}: overflow=${layoutAudit.hasHorizontalOverflow} textLen=${layoutAudit.textLength}`);

      auditResults.push({
        page: pageDef.name,
        description: pageDef.description,
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        screenshot: shotPath,
        fileName: shotFileName,
        ...layoutAudit
      });

      await page.close();
    }
  }

  // Save audit log
  const reportPath = path.join(SCREENSHOT_DIR, 'phase12_audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  console.log(`Audit complete. Results saved to ${reportPath}`);

  await browser.close();
})();
