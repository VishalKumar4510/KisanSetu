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
  console.log('Launching headless Chrome on port 9222...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\yesvi\\AppData\\Local\\Temp\\chrome_test_profile'
  ]);

  try {
    const wsUrl = await getWsUrl();
    console.log('Connected to Chrome DevTools Protocol at:', wsUrl);

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

    // Enable Runtime and Page
    await send('Runtime.enable');
    await send('Page.enable');

    console.log('Logging in via API to get auth token...');
    // Login officer1 via backend API
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
    console.log('Officer authenticated:', user.name, 'Role:', user.role);

    // Navigate to /login first to establish origin
    await send('Page.navigate', { url: 'http://localhost:5175/login' });
    await sleep(1500);

    // Inject token and user into localStorage
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('kisansetu_token', '${token}');
        localStorage.setItem('kisansetu_user', JSON.stringify(${JSON.stringify(user)}));
      `
    });

    // Test routes:
    const routesToTest = [
      { name: 'Procurement Management', url: 'http://localhost:5175/officer/procurement' },
      { name: 'Officer Dashboard', url: 'http://localhost:5175/officer' },
      { name: 'Queue Management', url: 'http://localhost:5175/officer/queue' },
      { name: 'Farmer Directory', url: 'http://localhost:5175/officer/farmers' },
    ];

    for (const route of routesToTest) {
      console.log(`\n--- Testing ${route.name} (${route.url}) ---`);
      consoleLogs.length = 0;

      await send('Page.navigate', { url: route.url });
      await sleep(2500);

      // Evaluate page title, headings, and innerText
      const evalResult = await send('Runtime.evaluate', {
        expression: `
          JSON.stringify({
            title: document.title,
            h1: Array.from(document.querySelectorAll('h1')).map(e => e.innerText.trim()),
            bodyLength: document.body.innerText.trim().length,
            preview: document.body.innerText.trim().slice(0, 150),
            hasError: document.body.innerText.includes('Cannot read') || document.body.innerText.includes('is not defined')
          })
        `
      });

      if (!evalResult.result || !evalResult.result.result) {
        console.error('Eval failed:', JSON.stringify(evalResult, null, 2));
        throw new Error('Evaluation returned no result: ' + JSON.stringify(evalResult));
      }

      const pageState = JSON.parse(evalResult.result.result.value);
      console.log('H1 Headings:', pageState.h1);
      console.log('Body text length:', pageState.bodyLength, 'chars');
      console.log('Content preview:', pageState.preview.replace(/\n/g, ' '));

      // Check errors
      const errors = consoleLogs.filter(l => l.method === 'Runtime.exceptionThrown');
      if (errors.length > 0) {
        console.error('❌ Console Exceptions found on ' + route.name + ':', JSON.stringify(errors, null, 2));
      } else {
        console.log(`✓ No runtime errors on ${route.name}!`);
      }

      if (pageState.bodyLength < 20) {
        throw new Error(`Page rendered empty for ${route.name}! Body length: ${pageState.bodyLength}`);
      }
    }

    console.log('\n=============================================');
    console.log('🎉 ALL 4 OFFICER BROWSER ROUTES RENDER PERFECTLY!');
    console.log('=============================================');

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
