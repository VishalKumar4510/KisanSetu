const { spawn } = require('child_process');
const http = require('http');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json/list', (r) => {
          let d = '';
          r.on('data', c => d += c);
          r.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
      });
      if (Array.isArray(res) && res.length > 0) {
        const page = res.find(t => t.type === 'page') || res[0];
        if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch {}
    await sleep(300);
  }
  throw new Error('Could not connect to Chrome debugging port');
}

async function run() {
  console.log('Auditing entire Officer UI for English-only consistency in headless Chrome...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\yesvi\\AppData\\Local\\Temp\\chrome_lang_profile'
  ]);

  try {
    const wsUrl = await getWsUrl();
    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const pending = new Map();
    const consoleLogs = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' || msg.method === 'Runtime.exceptionThrown') {
        consoleLogs.push(msg);
      }
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    };

    function send(method, params = {}) {
      const msgId = id++;
      return new Promise((resolve) => {
        pending.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Runtime.enable');
    await send('Page.enable');

    const authData = await new Promise((resolve, reject) => {
      const req = http.request('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(JSON.parse(d)));
      });
      req.on('error', reject);
      req.write(JSON.stringify({ phone: 'officer1', password: 'officer1' }));
      req.end();
    });

    const token = authData.data.token;
    const user = authData.data.user;

    await send('Page.navigate', { url: 'http://localhost:5175/login' });
    await sleep(1000);

    // Explicitly set kisansetu_lang to 'hi' in localStorage to simulate if another tab/user selected Hindi
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('kisansetu_token', '${token}');
        localStorage.setItem('kisansetu_user', JSON.stringify(${JSON.stringify(user)}));
        localStorage.setItem('kisansetu_lang', 'hi');
      `
    });

    const routes = [
      { name: 'Officer Dashboard', url: 'http://localhost:5175/officer' },
      { name: 'Live Queue Management', url: 'http://localhost:5175/officer/queue' },
      { name: 'Procurement Management', url: 'http://localhost:5175/officer/procurement' },
      { name: 'Farmer Directory', url: 'http://localhost:5175/officer/farmers' },
    ];

    for (const r of routes) {
      console.log(`\n--- Auditing Route: ${r.name} (${r.url}) ---`);
      consoleLogs.length = 0;
      await send('Page.navigate', { url: r.url });
      await sleep(2500);

      const auditResult = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const devanagariRegex = /[\\u0900-\\u097F]/g;
            const fullText = document.body.innerText;
            const matches = fullText.match(devanagariRegex) || [];
            
            // Check buttons
            const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
            const hindiButtons = buttons.filter(b => devanagariRegex.test(b));

            // Check headings
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.innerText.trim()).filter(Boolean);
            const hindiHeadings = headings.filter(h => devanagariRegex.test(h));

            return {
              h1: document.querySelector('h1')?.innerText?.trim(),
              totalHindiChars: matches.length,
              hindiSamples: matches.slice(0, 10),
              hindiButtons,
              hindiHeadings,
              buttonSamples: buttons.slice(0, 8),
              headingSamples: headings.slice(0, 6),
              bodyLength: fullText.length
            };
          })()
        `,
        returnByValue: true
      });

      const audit = auditResult.result.result.value;
      console.log('Page Header (H1):', audit.h1);
      console.log('Total Hindi/Devanagari characters found:', audit.totalHindiChars);
      console.log('Heading samples:', audit.headingSamples);
      console.log('Button samples:', audit.buttonSamples);

      if (audit.totalHindiChars > 0) {
        console.error('❌ Found Hindi characters on', r.name, ':', audit.hindiSamples);
        throw new Error(`Route ${r.name} contains ${audit.totalHindiChars} Hindi characters!`);
      } else {
        console.log(`✓ 100% ENGLISH ONLY verified on ${r.name}`);
      }

      const errors = consoleLogs.filter(l => l.method === 'Runtime.exceptionThrown');
      if (errors.length > 0) {
        throw new Error(`Runtime errors on ${r.name}: ${JSON.stringify(errors)}`);
      }
    }

    console.log('\n======================================================');
    console.log('🎉 AUDIT COMPLETE: ALL OFFICER ROUTES ARE 100% ENGLISH!');
    console.log('======================================================');

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
