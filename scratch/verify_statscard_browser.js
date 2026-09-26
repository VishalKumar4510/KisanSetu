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
  console.log('Testing Officer Dashboard StatsCard integration via Chrome DevTools Protocol...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\yesvi\\AppData\\Local\\Temp\\chrome_statscard_profile'
  ]);

  try {
    const wsUrl = await getWsUrl();
    console.log('Connected to Chrome CDP at:', wsUrl);

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

    console.log('Logging in via API as officer1...');
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

    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('kisansetu_token', '${token}');
        localStorage.setItem('kisansetu_user', JSON.stringify(${JSON.stringify(user)}));
      `
    });

    console.log('Navigating to http://localhost:5175/officer ...');
    await send('Page.navigate', { url: 'http://localhost:5175/officer' });
    await sleep(3000);

    // Extract StatsCard details from the DOM
    const result = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const statsSection = document.querySelector('section[aria-label="Procurement Statistics"]');
          if (!statsSection) return { found: false, error: 'Section not found' };

          // Cards inside stats section
          const cards = Array.from(statsSection.querySelectorAll('.rounded-xl.border'));
          const cardData = cards.map(c => {
            const title = c.querySelector('h3')?.innerText?.trim() || '';
            const valueSpan = c.querySelector('.text-2xl')?.innerText?.trim() || '';
            const unit = c.querySelector('.text-xs.text-slate-400')?.innerText?.trim() || '';
            const sub = c.querySelector('.text-slate-500')?.innerText?.trim() || '';
            const hasSvg = !!c.querySelector('svg');
            return { title, value: valueSpan, unit, sub, hasSvg };
          });

          return {
            found: true,
            cardCount: cardData.length,
            cards: cardData,
            rawText: statsSection.innerText
          };
        })()
      `,
      returnByValue: true
    });

    const data = result.result.result.value;
    console.log('Stats section found:', data.found);
    console.log('Stats cards rendered:', data.cardCount);
    console.log('Card details:');
    data.cards.forEach((c, i) => {
      console.log(`  [Card ${i+1}] Title: "${c.title}" | Value: "${c.value}" (unit: "${c.unit}") | Sub: "${c.sub}" | Icon present: ${c.hasSvg}`);
    });

    const errors = consoleLogs.filter(l => l.method === 'Runtime.exceptionThrown');
    if (errors.length > 0) {
      console.error('❌ Console errors encountered:', JSON.stringify(errors, null, 2));
      throw new Error('Console exceptions found on page');
    } else {
      console.log('✓ Zero console runtime exceptions!');
    }

    if (data.cardCount < 5) {
      throw new Error(`Expected at least 5 StatsCards, but found ${data.cardCount}`);
    }

    console.log('\n=============================================');
    console.log('🎉 STATSCARD INTEGRATION VERIFIED IN BROWSER!');
    console.log('=============================================');

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(err => {
  console.error('Browser test failed:', err);
  process.exit(1);
});
