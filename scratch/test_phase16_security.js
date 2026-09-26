const assert = require('assert');

const API_BASE = 'http://localhost:3001/api';

async function req(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

async function runSecurityTests() {
  console.log('====================================================');
  console.log('🔒 KisanSetu Phase 16: Security & Validation Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name, condition, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // ----------------------------------------------------------------
  // AUTHENTICATION TESTS (1 - 5)
  // ----------------------------------------------------------------
  console.log('--- 1. Authentication Tests ---');

  // Test 1: Valid Login
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: 'farmer1', password: 'farmer1' }),
  });
  const farmerToken = loginRes.data?.data?.token;
  const farmerUser = loginRes.data?.data?.user;
  report(
    'Test 1: Valid login returns 200 with JWT and sanitized user',
    loginRes.status === 200 && !!farmerToken && farmerUser?.phone === 'farmer1' && !('password' in (farmerUser || {}))
  );

  // Test 2: Invalid Password
  const badPassRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: 'farmer1', password: 'wrongpassword' }),
  });
  report(
    'Test 2: Invalid password returns 401 with generic error message',
    badPassRes.status === 401 && badPassRes.data?.error === 'Invalid credentials'
  );

  // Test 3: Invalid User
  const badUserRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: 'nonexistent_phone_123', password: 'farmer1' }),
  });
  report(
    'Test 3: Invalid user returns 401 without leaking user existence',
    badUserRes.status === 401 && badUserRes.data?.error === 'Invalid credentials'
  );

  // Test 4: phone === password bypass is removed
  // seed farmer-0011 has phone '9810000981' and password hash for 'Kisan@123'
  const bypassRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: '9810000981', password: '9810000981' }),
  });
  report(
    'Test 4: phone === password bypass no longer authenticates user',
    bypassRes.status === 401 && bypassRes.data?.error === 'Invalid credentials'
  );

  // Test 5: Valid bcrypt passwords work for Admin and Officer
  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: 'admin1', password: 'admin1' }),
  });
  const officerLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: 'officer1', password: 'officer1' }),
  });
  const adminToken = adminLogin.data?.data?.token;
  const officerToken = officerLogin.data?.data?.token;
  report(
    'Test 5: Valid bcrypt passwords work for Admin and Officer roles',
    adminLogin.status === 200 && !!adminToken && officerLogin.status === 200 && !!officerToken
  );

  // ----------------------------------------------------------------
  // AUTHORIZATION & IDOR TESTS (6 - 10)
  // ----------------------------------------------------------------
  console.log('\n--- 2. Authorization & IDOR Tests ---');

  // Test 6: Farmer can access own resource
  const ownFarmerRes = await req('/farmers/me', {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  const ownPayments = await req('/payments/current', {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  report(
    'Test 6: Farmer can access own profile and own payments',
    ownFarmerRes.status === 200 && ownFarmerRes.data?.data?.id === farmerUser?.id && ownPayments.status === 200
  );

  // Test 7: Farmer cannot access another farmer's resource (IDOR / BOLA)
  const idorFarmerProfile = await req('/farmers/farmer-0002', {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  const idorPayments = await req('/payments/current?farmerId=farmer-0002', {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  const idorProc = await req('/procurement/current?farmerId=farmer-0002', {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  report(
    'Test 7: Farmer requesting another farmer resource is strictly denied (403 Forbidden)',
    idorFarmerProfile.status === 403 && idorPayments.status === 403 && idorProc.status === 403,
    `Profile: ${idorFarmerProfile.status}, Payments: ${idorPayments.status}, Proc: ${idorProc.status}`
  );

  // Test 8: Officer role can access authorized officer endpoints
  const officerStats = await req('/officer/stats', {
    headers: { Authorization: `Bearer ${officerToken}` },
  });
  const officerQueue = await req('/officer/queue', {
    headers: { Authorization: `Bearer ${officerToken}` },
  });
  report(
    'Test 8: Officer role can access authorized officer endpoints (stats, queue)',
    officerStats.status === 200 && officerQueue.status === 200
  );

  // Test 9: Farmer cannot access officer endpoints
  const farmerOnOfficerStats = await req('/officer/stats', {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  const farmerOnOfficerCall = await req('/officer/call', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}` },
    body: JSON.stringify({ centreId: 'centre-01' }),
  });
  report(
    'Test 9: Farmer cannot access officer endpoints (403 Forbidden)',
    farmerOnOfficerStats.status === 403 && farmerOnOfficerCall.status === 403
  );

  // Test 10: Farmer cannot access admin endpoints
  const farmerOnAdminFarmers = await req('/farmers', {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  report(
    'Test 10: Farmer cannot access admin endpoints (403 Forbidden)',
    farmerOnAdminFarmers.status === 403
  );

  // ----------------------------------------------------------------
  // ZOD INPUT VALIDATION TESTS (11 - 14)
  // ----------------------------------------------------------------
  console.log('\n--- 3. Zod Input Validation Tests ---');

  // Test 11: Invalid slot booking payload (empty slotId)
  const invalidSlot = await req('/slots/book', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}` },
    body: JSON.stringify({ slotId: '' }),
  });
  report(
    'Test 11: Invalid slot payload returns 400 Validation Error',
    invalidSlot.status === 400 && invalidSlot.data?.error?.includes('Validation error')
  );

  // Test 12: Invalid weighment payload (grossWeight is negative)
  const invalidWeighment = await req('/officer/weighment', {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({ procurementId: 'proc-001', grossWeight: -10, tareWeight: 5 }),
  });
  report(
    'Test 12: Invalid weighment payload (negative grossWeight) returns 400',
    invalidWeighment.status === 400 && invalidWeighment.data?.error?.includes('Validation error')
  );

  // Test 13: Invalid quality payload (invalid enum qualityResult)
  const invalidQuality = await req('/officer/quality', {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({ procurementId: 'proc-001', qualityResult: 'SUPER_DUPER_INVALID' }),
  });
  report(
    'Test 13: Invalid quality payload (invalid enum) returns 400',
    invalidQuality.status === 400 && invalidQuality.data?.error?.includes('Validation error')
  );

  // Test 14: Invalid payment payload (missing paymentId)
  const invalidPayment = await req('/officer/payment/process', {
    method: 'POST',
    headers: { Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({ paymentId: '' }),
  });
  report(
    'Test 14: Invalid payment payload (empty paymentId) returns 400',
    invalidPayment.status === 400 && invalidPayment.data?.error?.includes('Validation error')
  );

  // ----------------------------------------------------------------
  // RESOURCE PROTECTION & EDGE CASES (15 - 16)
  // ----------------------------------------------------------------
  console.log('\n--- 4. Resource Protection & Edge Cases ---');

  // Test 15: Unknown resource ID returns 404
  const unknownProc = await req('/procurement/nonexistent-id-99999', {
    headers: { Authorization: `Bearer ${farmerToken}` },
  });
  const unknownFarmer = await req('/farmers/nonexistent-farmer-99999', {
    headers: { Authorization: `Bearer ${officerToken}` },
  });
  report(
    'Test 15: Unknown resource ID returns 404 Not Found',
    unknownProc.status === 404 && unknownFarmer.status === 404
  );

  // Test 16: Unauthorized resource cancellation / IDOR
  const cancelOtherToken = await req('/slots/cancel', {
    method: 'POST',
    headers: { Authorization: `Bearer ${farmerToken}` },
    body: JSON.stringify({ tokenId: 'token-0002' }), // belongs to farmer-0002
  });
  report(
    'Test 16: Unauthorized token cancellation returns 403 Forbidden',
    cancelOtherToken.status === 403
  );

  // ----------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed out of 16 tests`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
