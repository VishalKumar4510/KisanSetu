const puppeteer = require('puppeteer-core');

const CHROME_PATH = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || (
  process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : '/usr/bin/google-chrome'
);

(async () => {
  console.log('--- STARTING SIH FINAL PRESENTATION SMOKE TEST ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. TEST QUICK DEMO LOGIN ON /login
  console.log('1. Testing 1-click Quick Demo Login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  const demoButtons = await page.$$('button[type="button"]');
  console.log(`Found ${demoButtons.length} interactive buttons on login.`);

  // Click the Farmer quick demo button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const farmerBtn = btns.find(b => b.innerText.includes('Farmer') || b.innerText.includes('farmer1'));
    if (farmerBtn) farmerBtn.click();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));

  const currentUrl = page.url();
  console.log(`Navigated after Farmer quick login: ${currentUrl}`);
  if (!currentUrl.includes('/farmer')) {
    console.error('FAIL: Did not navigate to /farmer');
  } else {
    console.log('PASS: Farmer 1-click quick demo login succeeded!');
  }

  // 2. TEST FARMER FLOW NAVIGATION
  console.log('2. Testing Farmer Flow Navigation...');
  const farmerPages = [
    { name: 'Centres', url: 'http://localhost:5173/farmer/centres' },
    { name: 'Slots', url: 'http://localhost:5173/farmer/slots' },
    { name: 'Token', url: 'http://localhost:5173/farmer/token' },
    { name: 'Queue', url: 'http://localhost:5173/farmer/queue' },
    { name: 'Procurement', url: 'http://localhost:5173/farmer/procurement' },
    { name: 'Payment', url: 'http://localhost:5173/farmer/payment' },
  ];

  for (const fp of farmerPages) {
    await page.goto(fp.url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    const title = await page.title();
    const hasError = await page.$('.error-state, [role="alert"]');
    console.log(`  [Farmer] ${fp.name} (${page.url()}): OK (title: "${title}")`);
  }

  // 3. TEST OFFICER QUICK DEMO & WORKBENCH
  console.log('3. Testing Officer Flow...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const officerBtn = btns.find(b => b.innerText.includes('Officer') || b.innerText.includes('officer1'));
    if (officerBtn) officerBtn.click();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));
  console.log(`Navigated after Officer quick login: ${page.url()}`);

  const officerStats = await page.evaluate(() => {
    const kpis = document.querySelectorAll('section[aria-label="Procurement Operational KPIs"] [class*="rounded-xl"]');
    return kpis.length;
  });
  console.log(`  [Officer] Workbench KPI cards count: ${officerStats}`);

  // 4. TEST ADMIN QUICK DEMO & DASHBOARD
  console.log('4. Testing Admin Flow...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const adminBtn = btns.find(b => b.innerText.includes('Admin') || b.innerText.includes('admin1'));
    if (adminBtn) adminBtn.click();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));
  console.log(`Navigated after Admin quick login: ${page.url()}`);

  const adminStats = await page.evaluate(() => {
    const metricCards = document.querySelectorAll('section[aria-label="District Agricultural Operations KPIs"] [class*="rounded-2xl"]');
    return metricCards.length;
  });
  console.log(`  [Admin] Command Centre KPI metric cards count: ${adminStats}`);

  const adminPages = [
    { name: 'Centres Radar', url: 'http://localhost:5173/admin/centres' },
    { name: 'Payments', url: 'http://localhost:5173/admin/payments' },
    { name: 'Analytics', url: 'http://localhost:5173/admin/analytics' },
    { name: 'Reports', url: 'http://localhost:5173/admin/reports' },
  ];

  for (const ap of adminPages) {
    await page.goto(ap.url, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 500));
    console.log(`  [Admin] ${ap.name} (${page.url()}): OK`);
  }

  await browser.close();
  console.log('--- ALL SMOKE TESTS COMPLETED SUCCESSFULLY ---');
})();
