const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runAudit() {
  console.log('====================================================');
  console.log('       KISANSETU END-TO-END FLOW AUDIT SUITE        ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // ==========================================
  // FLOW 1: FARMER FLOW
  // ==========================================
  console.log('--- 1. FARMER FLOW AUDIT ---');

  // 1.1 Login
  const fLogin = await post('/api/auth/login', { phone: 'farmer1', password: 'farmer1' });
  assert(fLogin.status === 200 && fLogin.body.data?.token, `Farmer login successful (${fLogin.body.data?.user?.name || 'Farmer'})`);
  const farmerToken = fLogin.body.data?.token || '';

  // 1.2 Centres
  const centresRes = await get('/api/centres', farmerToken);
  assert(centresRes.status === 200 && Array.isArray(centresRes.body.data), `Centres list returned ${centresRes.body.data?.length} Mandi centres`);
  const centreId = centresRes.body.data?.[0]?.id || 'centre-001';

  // 1.3 Slot Booking
  const slotsRes = await get(`/api/slots/available?centreId=${centreId}`, farmerToken);
  assert(slotsRes.status === 200 && Array.isArray(slotsRes.body.data), `Slots query for ${centreId} returned ${slotsRes.body.data?.length} slots`);

  // 1.4 Digital Token & Farmer Profile
  const meRes = await get('/api/farmers/me', farmerToken);
  assert(meRes.status === 200 && meRes.body.data, 'Farmer profile & active digital token pass retrieved');

  // 1.5 Live Queue
  const queueRes = await get('/api/queue/position', farmerToken);
  assert(queueRes.status === 200, 'Live Queue position and telemetry retrieved');

  // 1.6 Procurement Progress
  const procRes = await get('/api/procurement/current', farmerToken);
  assert(procRes.status === 200, 'Procurement workflow state retrieved');

  // 1.7 Payment Status
  const payRes = await get('/api/payments/current', farmerToken);
  assert(payRes.status === 200, 'DBT payment breakdown retrieved');

  console.log('');

  // ==========================================
  // FLOW 2: OFFICER OPERATIONS FLOW
  // ==========================================
  console.log('--- 2. OFFICER WORKBENCH FLOW AUDIT ---');

  // 2.1 Login
  const oLogin = await post('/api/auth/login', { phone: 'officer1', password: 'officer1' });
  assert(oLogin.status === 200 && oLogin.body.data?.token, `Officer login successful (${oLogin.body.data?.user?.name || 'Officer'})`);
  const officerToken = oLogin.body.data?.token || '';

  // 2.2 Stats & Live Queue
  const oStats = await get('/api/officer/stats', officerToken);
  assert(oStats.status === 200 && oStats.body.data, `Operational KPIs retrieved (${oStats.body.data?.farmersServedToday} served today)`);

  const oQueue = await get('/api/officer/queue', officerToken);
  assert(oQueue.status === 200 && Array.isArray(oQueue.body.data?.items), `Officer queue loaded (${oQueue.body.data?.items?.length} records)`);

  // 2.3 Scales equipment
  const oScales = await get('/api/officer/scales', officerToken);
  assert(oScales.status === 200 && Array.isArray(oScales.body.data), `Scale equipment active (${oScales.body.data?.length} scales)`);

  // 2.4 Settlement & Procurement
  const oSettlement = await get('/api/officer/settlement', officerToken);
  assert(oSettlement.status === 200 && oSettlement.body.data, 'Settlement financial totals retrieved');

  // 2.5 Farmer History
  const oHistory = await get('/api/officer/farmers/farmer-0001/history', officerToken);
  assert(oHistory.status === 200 && oHistory.body.data?.name, `Farmer history verified (${oHistory.body.data?.name})`);

  console.log('');

  // ==========================================
  // FLOW 3: ADMIN COMMAND CENTRE FLOW
  // ==========================================
  console.log('--- 3. ADMIN COMMAND CENTRE FLOW AUDIT ---');

  // 3.1 Login
  const aLogin = await post('/api/auth/login', { phone: 'admin1', password: 'admin1' });
  assert(aLogin.status === 200 && aLogin.body.data?.token, `Admin login successful (${aLogin.body.data?.user?.name || 'Admin'})`);
  const adminToken = aLogin.body.data?.token || '';

  // 3.2 Command Centre KPIs
  const aKpis = await get('/api/analytics/kpis', adminToken);
  assert(aKpis.status === 200 && aKpis.body.data, 'District executive KPIs loaded');

  // 3.3 Centre Monitoring
  const aCentres = await get('/api/centres', adminToken);
  assert(aCentres.status === 200 && Array.isArray(aCentres.body.data), `APMC Mandi monitoring data active (${aCentres.body.data?.length} centres)`);

  // 3.4 Payment Monitoring
  const aPayments = await get('/api/payments', adminToken);
  assert(aPayments.status === 200 && Array.isArray(aPayments.body.data), `Payment monitoring loaded (${aPayments.body.data?.length} records)`);

  // 3.5 Analytics Telemetry Charts
  const aCharts = await get('/api/analytics/charts/volume?period=7d', adminToken);
  assert(aCharts.status === 200 && Array.isArray(aCharts.body.data), 'Analytics telemetry charts ready');

  // 3.6 Centre Comparison
  const aComp = await get('/api/analytics/centre-comparison', adminToken);
  assert(aComp.status === 200 && Array.isArray(aComp.body.data), 'APMC Mandi performance comparison ready');

  console.log('\n====================================================');
  console.log(`TOTAL AUDIT CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL 18 FLOW AUDIT CHECKS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
