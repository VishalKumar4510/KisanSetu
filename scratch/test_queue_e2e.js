const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body) headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method,
        headers,
      },
      (res) => {
        let respBody = '';
        res.on('data', (chunk) => (respBody += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(respBody);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, body: respBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('=== KisanSetu Live Queue & Booking Test Suite ===\n');

  // 1. Login farmer1
  console.log('1. Logging in farmer1...');
  const loginF1 = await request('POST', '/api/auth/login', { phone: 'farmer1', password: 'farmer1' });
  if (loginF1.status !== 200 || !loginF1.body.data?.token) {
    throw new Error('farmer1 login failed: ' + JSON.stringify(loginF1.body));
  }
  const tokenF1 = loginF1.body.data.token;
  console.log('   ✓ farmer1 logged in successfully. User ID:', loginF1.body.data.user.id, 'Display ID:', loginF1.body.data.user.farmerId);

  // 2. Check initial queue for farmer1 (should be null / Not in queue)
  console.log('2. Checking initial queue for farmer1 (expect null)...');
  const initialQueue = await request('GET', '/api/queue/position', null, tokenF1);
  console.log('   GET /api/queue/position status:', initialQueue.status, 'data:', initialQueue.body.data);
  if (initialQueue.body.data !== null) {
    throw new Error('farmer1 expected null queue initially, got: ' + JSON.stringify(initialQueue.body.data));
  }
  console.log('   ✓ farmer1 starts with NO active queue position (data: null).');

  // Also test with query param ?farmerId=KS-FARM-0001
  const initialQueueWithParam = await request('GET', '/api/queue/position?farmerId=KS-FARM-0001', null, tokenF1);
  if (initialQueueWithParam.body.data !== null) {
    throw new Error('farmer1 with query param expected null queue initially, got: ' + JSON.stringify(initialQueueWithParam.body.data));
  }
  console.log('   ✓ GET /api/queue/position?farmerId=KS-FARM-0001 correctly returns null initially.');

  // 3. Get available slots
  console.log('3. Finding available slot...');
  const slotsRes = await request('GET', '/api/slots/available', null, tokenF1);
  const slots = slotsRes.body.data;
  if (!slots || slots.length === 0) throw new Error('No available slots found!');
  const targetSlot = slots[0];
  console.log('   ✓ Found available slot:', targetSlot.id, 'at centre:', targetSlot.centreId, 'time:', targetSlot.timeStart);

  // 4. Book the slot
  console.log('4. Booking slot for farmer1...');
  const bookRes = await request('POST', '/api/slots/book', {
    centreId: targetSlot.centreId,
    slotId: targetSlot.id,
  }, tokenF1);
  console.log('   Booking status:', bookRes.status);
  if (bookRes.status !== 201 && bookRes.status !== 200) {
    throw new Error('Booking failed: ' + JSON.stringify(bookRes.body));
  }
  const bookedToken = bookRes.body.data?.token;
  console.log('   ✓ Booking succeeded! Token:', bookedToken?.tokenNumber, 'Position:', bookedToken?.queuePosition, 'ETA:', bookedToken?.estimatedTime);

  // 5. Test Live Queue for farmer1
  console.log('5. Verifying Live Queue position for farmer1...');
  const liveQueueRes = await request('GET', '/api/queue/position', null, tokenF1);
  console.log('   GET /api/queue/position (no param) status:', liveQueueRes.status);
  console.log('   Response shape:', JSON.stringify(liveQueueRes.body, null, 2));

  if (!liveQueueRes.body.success || !liveQueueRes.body.data) {
    throw new Error('Live queue returned null or unsuccessful after booking: ' + JSON.stringify(liveQueueRes.body));
  }
  const qData = liveQueueRes.body.data;
  if (!qData.position || !qData.totalInQueue || !qData.tokenNumber) {
    throw new Error('Queue data missing expected fields: ' + JSON.stringify(qData));
  }
  console.log(`   ✓ Live queue returns: Position #${qData.position} of ${qData.totalInQueue}, ETA: ${qData.estimatedTime}m, Token: ${qData.tokenNumber}, Centre: ${qData.centreName}`);

  // Test with ?farmerId=KS-FARM-0001 as well
  const liveQueueParamRes = await request('GET', '/api/queue/position?farmerId=KS-FARM-0001', null, tokenF1);
  if (!liveQueueParamRes.body.data || liveQueueParamRes.body.data.tokenNumber !== qData.tokenNumber) {
    throw new Error('Queue position with ?farmerId=KS-FARM-0001 failed: ' + JSON.stringify(liveQueueParamRes.body));
  }
  console.log('   ✓ GET /api/queue/position?farmerId=KS-FARM-0001 returns exact same active queue data!');

  // 6. Test duplicate booking protection
  console.log('6. Testing duplicate booking protection (HTTP 409)...');
  const dupBookRes = await request('POST', '/api/slots/book', {
    centreId: targetSlot.centreId,
    slotId: targetSlot.id,
  }, tokenF1);
  console.log('   Duplicate booking status:', dupBookRes.status);
  console.log('   Duplicate booking error message:', dupBookRes.body.error);
  if (dupBookRes.status !== 409 || dupBookRes.body.error !== 'You already have an active booking') {
    throw new Error('Duplicate booking did not return 409 "You already have an active booking". Received: ' + JSON.stringify(dupBookRes));
  }
  console.log('   ✓ Duplicate booking correctly rejected with 409 "You already have an active booking".');

  // 7. Test farmer2
  console.log('7. Testing farmer2 / farmer2...');
  const loginF2 = await request('POST', '/api/auth/login', { phone: 'farmer2', password: 'farmer2' });
  if (loginF2.status !== 200 || !loginF2.body.data?.token) {
    throw new Error('farmer2 login failed: ' + JSON.stringify(loginF2.body));
  }
  const tokenF2 = loginF2.body.data.token;
  const f2Queue = await request('GET', '/api/queue/position', null, tokenF2);
  console.log('   farmer2 GET /api/queue/position status:', f2Queue.status);
  console.log('   farmer2 queue data:', JSON.stringify(f2Queue.body.data));
  if (!f2Queue.body.data || !f2Queue.body.data.position) {
    throw new Error('farmer2 expected existing active queue data, got: ' + JSON.stringify(f2Queue.body));
  }
  console.log(`   ✓ farmer2 active queue intact: Position #${f2Queue.body.data.position} of ${f2Queue.body.data.totalInQueue}, Token: ${f2Queue.body.data.tokenNumber}`);

  // Test farmer2 with query param ?farmerId=KS-FARM-0002
  const f2ParamQueue = await request('GET', '/api/queue/position?farmerId=KS-FARM-0002', null, tokenF2);
  if (!f2ParamQueue.body.data || f2ParamQueue.body.data.tokenNumber !== f2Queue.body.data.tokenNumber) {
    throw new Error('farmer2 with query param failed: ' + JSON.stringify(f2ParamQueue.body));
  }
  console.log('   ✓ farmer2 query param ?farmerId=KS-FARM-0002 also returns active queue correctly.');

  // 8. Test Officer & Admin endpoints
  console.log('8. Testing Officer and Admin queue functionality...');
  const loginOff = await request('POST', '/api/auth/login', { phone: 'officer1', password: 'officer1' });
  const tokenOff = loginOff.body.data.token;
  const centreQueue = await request('GET', `/api/queue/centre/${targetSlot.centreId}`, null, tokenOff);
  console.log('   Officer GET /api/queue/centre/:id count:', centreQueue.body.data?.length);
  if (!centreQueue.body.data || centreQueue.body.data.length === 0) {
    throw new Error('Officer queue is empty or failed: ' + JSON.stringify(centreQueue.body));
  }
  console.log('   ✓ Officer centre queue contains tokens with farmer details intact.');

  const loginAdm = await request('POST', '/api/auth/login', { phone: 'admin1', password: 'admin1' });
  const tokenAdm = loginAdm.body.data.token;
  const admProc = await request('GET', '/api/procurement', null, tokenAdm);
  console.log('   Admin GET /api/procurement count:', admProc.body.data?.length);
  if (!admProc.body.data || admProc.body.data.length === 0) {
    throw new Error('Admin procurement failed: ' + JSON.stringify(admProc.body));
  }
  console.log('   ✓ Admin procurements retrieved successfully.');

  console.log('\n========================================');
  console.log('🎉 ALL 8 TEST SUITE STEPS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
