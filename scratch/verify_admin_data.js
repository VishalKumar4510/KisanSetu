const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('kisansetu_token', 'mock-admin-token');
    localStorage.setItem('kisansetu_user', JSON.stringify({
      id: 'admin-01',
      name: 'District Collector / Administrator',
      role: 'ADMIN',
      phone: '9876543210'
    }));
  });

  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  const textContent = await page.evaluate(() => {
    const kpiSection = document.querySelector('section[aria-label="District Agricultural Operations KPIs"]');
    return kpiSection ? kpiSection.innerText : 'SECTION NOT FOUND';
  });

  console.log('--- KPI SECTION TEXT ---');
  console.log(textContent);
  await browser.close();
})();
