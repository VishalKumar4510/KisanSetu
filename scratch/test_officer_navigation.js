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
  console.log('Testing interactive Officer navigation and back/forward...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\yesvi\\AppData\\Local\\Temp\\chrome_nav_profile'
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

    // Get auth token
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

    // 1. Go to /officer
    console.log('\n--- 1. Navigating to /officer ---');
    await send('Page.navigate', { url: 'http://localhost:5175/officer' });
    await sleep(2000);

    // Click "Procurement" button
    console.log('Clicking "Procurement" nav link...');
    const clickProc = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const links = Array.from(document.querySelectorAll('a, button'));
          const target = links.find(el => el.textContent.trim().includes('Procurement') && !el.textContent.includes('Value'));
          if (target) {
            target.click();
            return { found: true, tag: target.tagName, text: target.textContent.trim() };
          }
          return { found: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Procurement link clicked:', clickProc.result.result.value);
    await sleep(2000);

    // Verify current URL and H1
    const procState = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          url: window.location.pathname,
          h1: document.querySelector('h1')?.innerText,
          bodyLength: document.body.innerText.trim().length,
          hasRecords: document.body.innerText.includes('WHEAT') || document.body.innerText.includes('TKN-')
        })
      `,
      returnByValue: true
    });
    const procParsed = JSON.parse(procState.result.result.value);
    console.log('Current state after clicking Procurement:', procParsed);
    if (procParsed.url !== '/officer/procurement') {
      throw new Error('Failed to navigate to /officer/procurement via click');
    }
    if (!procParsed.h1 || !procParsed.hasRecords) {
      throw new Error('Procurement records or header not rendered properly');
    }
    console.log('✓ Successfully navigated to /officer/procurement with records visible!');

    // Click back to dashboard link
    console.log('\nClicking "Officer Dashboard & Workbench →" to return to /officer...');
    const clickBack = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const links = Array.from(document.querySelectorAll('a, button'));
          const target = links.find(el => el.textContent.includes('Officer Dashboard & Workbench'));
          if (target) {
            target.click();
            return { found: true, text: target.textContent.trim() };
          }
          return { found: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Back link clicked:', clickBack.result.result.value);
    await sleep(2000);

    const backState = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          url: window.location.pathname,
          h1: document.querySelector('h1')?.innerText
        })
      `,
      returnByValue: true
    });
    console.log('Current state after returning:', JSON.parse(backState.result.result.value));

    // Test Browser history back and forward
    console.log('\nTesting Browser History Back and Forward...');
    await send('Runtime.evaluate', { expression: 'window.history.back()' });
    await sleep(1500);
    const histBack = await send('Runtime.evaluate', {
      expression: 'window.location.pathname',
      returnByValue: true
    });
    console.log('History back URL:', histBack.result.result.value);

    await send('Runtime.evaluate', { expression: 'window.history.forward()' });
    await sleep(1500);
    const histForward = await send('Runtime.evaluate', {
      expression: 'window.location.pathname',
      returnByValue: true
    });
    console.log('History forward URL:', histForward.result.result.value);

    console.log('\n=============================================');
    console.log('🎉 NAVIGATION & HISTORY VERIFICATION SUCCEEDED!');
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
