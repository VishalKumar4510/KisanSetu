const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const req = http.request({
      hostname: 'localhost',
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
        } catch (e) {
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
      hostname: 'localhost',
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
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function patch(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method: 'PATCH',
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
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('=== TESTING OFFICER OPERATIONS CONSOLE APIS ===');

  // 1. Login Officer
  const loginRes = await post('/api/auth/login', { phone: 'officer1', password: 'officer1' });
  if (loginRes.status !== 200 || !loginRes.body.data?.token) {
    console.error('Failed to log in officer:', loginRes);
    process.exit(1);
  }
  const token = loginRes.body.data.token;
  console.log('✔ Officer logged in successfully');

  // 2. Test GET /api/officer/stats
  const statsRes = await get('/api/officer/stats', token);
  console.log('✔ Stats response:', statsRes.status, {
    farmersServedToday: statsRes.body.data?.farmersServedToday,
    waitingFarmers: statsRes.body.data?.waitingFarmers,
    completedLots: statsRes.body.data?.completedLots,
    avgWaitTime: statsRes.body.data?.avgWaitTime,
    isQueuePaused: statsRes.body.data?.isQueuePaused,
  });
  if (statsRes.status !== 200) throw new Error('Stats failed');

  // 3. Test GET /api/officer/queue
  const queueRes = await get('/api/officer/queue', token);
  console.log('✔ Queue response:', queueRes.status, 'Total queue items:', queueRes.body.data?.items?.length);
  if (queueRes.status !== 200 || !Array.isArray(queueRes.body.data?.items)) throw new Error('Queue failed');

  // 4. Test Queue Pause & Resume
  const pauseRes = await post('/api/officer/queue/pause', { centreId: 'centre-1', reason: 'Shift Change' }, token);
  console.log('✔ Queue Pause response:', pauseRes.status, pauseRes.body.data);
  if (pauseRes.status !== 200 || !pauseRes.body.data?.isQueuePaused) throw new Error('Queue pause failed');

  // Verify call fails when paused
  const callWhilePaused = await post('/api/officer/call', { centreId: 'centre-1' }, token);
  console.log('✔ Call farmer while paused rejected as expected:', callWhilePaused.status, callWhilePaused.body?.error || callWhilePaused.body?.message);
  if (callWhilePaused.status !== 400) throw new Error('Expected 400 when calling while paused');

  // Resume Queue
  const resumeRes = await post('/api/officer/queue/resume', { centreId: 'centre-1' }, token);
  console.log('✔ Queue Resume response:', resumeRes.status, resumeRes.body.data);
  if (resumeRes.status !== 200 || resumeRes.body.data?.isQueuePaused !== false) throw new Error('Queue resume failed');

  // 5. Test Alerts API
  const alertsRes = await get('/api/officer/alerts', token);
  console.log('✔ Alerts response:', alertsRes.status, 'Alert count:', alertsRes.body.data?.alerts?.length, 'Unread:', alertsRes.body.data?.unreadCount);
  if (alertsRes.status !== 200) throw new Error('Alerts GET failed');
  const alertId = alertsRes.body.data.alerts[0]?.id;
  if (alertId) {
    const markReadRes = await patch(`/api/officer/alerts/${alertId}/read`, {}, token);
    console.log('✔ Mark alert read response:', markReadRes.status, markReadRes.body.data?.read);
    if (markReadRes.status !== 200 || !markReadRes.body.data?.read) throw new Error('Alert mark read failed');
  }

  // 6. Test Scale Equipment API
  const scalesRes = await get('/api/officer/scales', token);
  console.log('✔ Scales response:', scalesRes.status, 'Scale count:', scalesRes.body.data?.length);
  if (scalesRes.status !== 200 || !Array.isArray(scalesRes.body.data)) throw new Error('Scales GET failed');
  const scaleId = scalesRes.body.data[0]?.id;
  if (scaleId) {
    const scaleUpdateRes = await patch(`/api/officer/scales/${scaleId}`, { status: 'BUSY' }, token);
    console.log('✔ Scale status update response:', scaleUpdateRes.status, scaleUpdateRes.body.data?.status);
    if (scaleUpdateRes.status !== 200 || scaleUpdateRes.body.data?.status !== 'BUSY') throw new Error('Scale update failed');
  }

  // 7. Test Settlement API
  const settlementRes = await get('/api/officer/settlement', token);
  console.log('✔ Settlement response:', settlementRes.status, {
    farmersServed: settlementRes.body.data?.farmersServed,
    lotsCompleted: settlementRes.body.data?.lotsCompleted,
    totalQuantity: settlementRes.body.data?.totalQuantity,
    grossValue: settlementRes.body.data?.grossProcurementValue,
    netDisbursed: settlementRes.body.data?.netDisbursed,
    paymentsCompleted: settlementRes.body.data?.paymentsCompleted,
  });
  if (settlementRes.status !== 200) throw new Error('Settlement GET failed');

  // 8. Test Farmer History API
  const historyRes = await get('/api/officer/farmers/farmer-0001/history', token);
  console.log('✔ Farmer history response:', historyRes.status, {
    farmerId: historyRes.body.data?.farmerId,
    name: historyRes.body.data?.name,
    previousProcurementCount: historyRes.body.data?.previousProcurementCount,
    recordsLength: historyRes.body.data?.records?.length,
  });
  if (historyRes.status !== 200 || !historyRes.body.data?.name) throw new Error('Farmer history GET failed');

  console.log('\n🎉 ALL OFFICER CONSOLE BACKEND APIS PASSED WITH 100% SUCCESS!');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
