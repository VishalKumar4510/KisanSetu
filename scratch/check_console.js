const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function check() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));

  console.log('Navigating to http://localhost:5173/login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2000));

  const html = await page.content();
  console.log('HTML length:', html.length);
  console.log('HTML snippet:', html.slice(0, 300));
  const rootContent = await page.evaluate(() => document.getElementById('root')?.innerHTML);
  console.log('Root innerHTML length:', rootContent?.length);
  console.log('Root innerHTML snippet:', rootContent?.slice(0, 200));

  await page.screenshot({ path: 'scratch/actual_login.png' });
  await browser.close();
}
check();
