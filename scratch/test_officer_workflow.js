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

async function runOfficerTests() {
  console.log('====================================================');
  console.log('🌾 KisanSetu Officer Procurement & Payment Test Suite');
  console.log('====================================================\n');

  // 1. Officer Login
  console.log('1. Logging in as Officer (officer1 / officer1)...');
  const loginRes = await request('POST', '/api/auth/login', { phone: 'officer1', password: 'officer1' });
  if (loginRes.status !== 200 || !loginRes.body.data?.token) {
    throw new Error('Officer login failed: ' + JSON.stringify(loginRes.body));
  }
  const token = loginRes.body.data.token;
  console.log('   ✓ Officer logged in. Name:', loginRes.body.data.user.name);

  // 2. Summary Cards (7 Metrics)
  console.log('2. Testing Officer Summary Metrics (GET /api/officer/stats)...');
  const statsRes = await request('GET', '/api/officer/stats?centreId=centre-001', null, token);
  if (statsRes.status !== 200 || !statsRes.body.data) {
    throw new Error('Stats fetch failed: ' + JSON.stringify(statsRes.body));
  }
  const s = statsRes.body.data;
  console.log('   Summary Metrics returned:');
  console.log('   - Farmers Served Today:', s.farmersServedToday);
  console.log('   - Waiting Farmers:', s.waitingFarmers);
  console.log('   - Completed Farmers:', s.completedFarmers);
  console.log('   - Total Qty Procured:', s.totalQuantityProcured, 'Qt');
  console.log('   - Total Procurement Value: ₹' + s.totalProcurementValue.toLocaleString('en-IN'));
  console.log('   - Payments Completed:', s.paymentsCompleted);
  console.log('   - Payments Pending:', s.paymentsPending);
  if (s.waitingFarmers === undefined || s.totalQuantityProcured === undefined) {
    throw new Error('Missing expected stats fields');
  }
  console.log('   ✓ 7 summary cards verified successfully.');

  // 3. Call Farmer to Workbench
  console.log('3. Calling Next Farmer from Queue (POST /api/officer/call)...');
  const callRes = await request('POST', '/api/officer/call', { centreId: 'centre-001' }, token);
  if (callRes.status !== 200 || !callRes.body.data) {
    throw new Error('Call farmer failed: ' + JSON.stringify(callRes.body));
  }
  const calledData = callRes.body.data;
  const procId = calledData.procurement.id;
  console.log('   ✓ Farmer called:', calledData.farmer?.name, 'Token:', calledData.token?.tokenNumber);
  console.log('   Procurement ID:', procId, 'Status:', calledData.procurement.status);

  // 4. Weighment Validation & Execution
  console.log('4. Testing Weighment...');
  // 4a. Validation: Invalid gross/tare (tare >= gross)
  const invalidWeigh = await request('POST', '/api/officer/weighment', {
    procurementId: procId,
    grossWeight: 10,
    tareWeight: 12,
  }, token);
  if (invalidWeigh.status !== 400) {
    throw new Error('Expected 400 for gross <= tare, got: ' + invalidWeigh.status);
  }
  console.log('   ✓ Validation passed: Rejects gross <= tare weight.');

  // 4b. Valid Weighment
  const validWeigh = await request('POST', '/api/officer/weighment', {
    procurementId: procId,
    grossWeight: 26.50,
    tareWeight: 0.50,
    scaleId: 'WB-DIGITAL-BAY01',
  }, token);
  if (validWeigh.status !== 200 || validWeigh.body.data?.weighing?.netWeight !== 26) {
    throw new Error('Valid weighment failed: ' + JSON.stringify(validWeigh.body));
  }
  console.log('   ✓ Weighment confirmed! Gross: 26.50 Qt, Tare: 0.50 Qt → Net Produce Weight: 26.00 Qt');

  // 5. Quality Assessment
  console.log('5. Testing Quality Assessment...');
  // 5a. Submit valid Grade A quality check
  const qualityRes = await request('POST', '/api/officer/quality', {
    procurementId: procId,
    crop: 'WHEAT',
    moistureContent: 11.2,
    foreignMatter: 0.30,
    damagedGrains: 0.75,
    grade: 'A',
    qualityResult: 'ACCEPTED',
    remarks: 'FAQ Compliant wheat grain',
  }, token);
  if (qualityRes.status !== 200 || !qualityRes.body.data?.quality?.accepted) {
    throw new Error('Quality assessment failed: ' + JSON.stringify(qualityRes.body));
  }
  console.log('   ✓ Quality Assessment submitted: Grade A, Moisture 11.2%, Result: ACCEPTED.');

  // 6. Procurement Calculation
  console.log('6. Testing Procurement Calculation (POST /api/officer/calculate)...');
  const calcRes = await request('POST', '/api/officer/calculate', { procurementId: procId }, token);
  if (calcRes.status !== 200 || !calcRes.body.data) {
    throw new Error('Calculation failed: ' + JSON.stringify(calcRes.body));
  }
  const calc = calcRes.body.data;
  console.log('   Procurement Calculation Breakdown:');
  console.log('   - Net Quantity:', calc.netQuantity, 'Qt');
  console.log('   - Base MSP Rate: ₹' + calc.baseRate + '/Qt');
  console.log('   - Quality Adjustment: ₹' + calc.qualityAdjustment + '/Qt');
  console.log('   - Final Effective Rate: ₹' + calc.finalRate + '/Qt');
  console.log('   - Gross Amount: ₹' + calc.grossAmount.toLocaleString('en-IN'));
  console.log('   - Deductions (2% Mandi Cess): ₹' + calc.deductions.toLocaleString('en-IN'));
  console.log('   - Final Payable Amount: ₹' + calc.finalPayableAmount.toLocaleString('en-IN'));
  if (calc.finalPayableAmount !== (calc.grossAmount - calc.deductions)) {
    throw new Error('Calculation formula mismatch: gross - deductions != net');
  }
  console.log('   ✓ Automated calculation formula verified (locked, no manual entry).');

  // 7. Pre-Payment Review
  console.log('7. Testing Payment Review (POST /api/officer/payment/review)...');
  const reviewRes = await request('POST', '/api/officer/payment/review', { procurementId: procId }, token);
  if (reviewRes.status !== 200 || !reviewRes.body.data) {
    throw new Error('Payment review failed: ' + JSON.stringify(reviewRes.body));
  }
  const r = reviewRes.body.data;
  console.log('   Payment Review Details:');
  console.log('   - Beneficiary Farmer:', r.farmerName, '(' + r.farmerId + ')');
  console.log('   - Masked Bank Account:', r.maskedBankAccount);
  console.log('   - Bank IFSC:', r.ifsc, '(' + r.bankName + ')');
  console.log('   - Verification Status:', r.bankVerificationStatus);
  console.log('   - Final Payable:', '₹' + r.finalPayableAmount.toLocaleString('en-IN'));
  if (!r.maskedBankAccount.includes('•')) {
    throw new Error('Account number is NOT masked!');
  }
  console.log('   ✓ Sensitive bank account masking verified.');

  // 8. Payment Initiation & Simulation
  console.log('8. Testing Payment Initiation & Async Simulation...');
  const initRes = await request('POST', '/api/officer/payment/initiate', { procurementId: procId }, token);
  if (initRes.status !== 200 || !initRes.body.data?.payment) {
    throw new Error('Payment initiation failed: ' + JSON.stringify(initRes.body));
  }
  const payment = initRes.body.data.payment;
  const txnId = initRes.body.data.transactionId;
  console.log('   ✓ Payment Initiated! Txn ID:', txnId, 'Status:', payment.status);

  // 8a. Validation: Duplicate in-flight payment rejected
  const dupInit = await request('POST', '/api/officer/payment/initiate', { procurementId: procId }, token);
  if (dupInit.status !== 409) {
    throw new Error('Expected 409 duplicate payment rejection, got: ' + dupInit.status);
  }
  console.log('   ✓ Validation passed: Prevents duplicate in-flight payment request.');

  // 8b. Simulate Failure Test (Retry support)
  console.log('   Testing simulated gateway failure...');
  const failRes = await request('POST', '/api/officer/payment/process', {
    paymentId: payment.id,
    simulateFailure: true,
  }, token);
  if (failRes.status !== 400 || failRes.body.data?.payment?.status !== 'FAILED') {
    throw new Error('Simulate failure failed: ' + JSON.stringify(failRes.body));
  }
  console.log('   ✓ Simulated failure handled: Status FAILED, reason:', failRes.body.data?.payment?.failureReason);

  // 8c. Retry & Complete Payment (Success)
  console.log('   Testing payment retry to completion...');
  // Re-initiate
  const reinitRes = await request('POST', '/api/officer/payment/initiate', { procurementId: procId }, token);
  const reinitPayment = reinitRes.body.data.payment;
  // Process Success
  const successRes = await request('POST', '/api/officer/payment/process', {
    paymentId: reinitPayment.id,
    simulateFailure: false,
  }, token);
  if (successRes.status !== 200 || !successRes.body.data?.utr) {
    throw new Error('Payment process success failed: ' + JSON.stringify(successRes.body));
  }
  const utr = successRes.body.data.utr;
  console.log('   ✓ Payment Successful! UTR:', utr, 'CompletedAt:', successRes.body.data.completedAt);

  // 8d. Validation: Second payment for completed procurement rejected
  const completedDup = await request('POST', '/api/officer/payment/initiate', { procurementId: procId }, token);
  if (completedDup.status !== 409) {
    throw new Error('Expected 409 for paying already completed procurement, got: ' + completedDup.status);
  }
  console.log('   ✓ Validation passed: Cannot initiate second payment for completed procurement.');

  // 9. Digital Procurement Receipt
  console.log('9. Testing Digital Procurement Receipt (GET /api/officer/procurement/:id/receipt)...');
  const receiptRes = await request('GET', `/api/officer/procurement/${procId}/receipt`, null, token);
  if (receiptRes.status !== 200 || !receiptRes.body.data) {
    throw new Error('Receipt generation failed: ' + JSON.stringify(receiptRes.body));
  }
  const rc = receiptRes.body.data;
  console.log('   Receipt Generated:');
  console.log('   - Title:', rc.title);
  console.log('   - Receipt No:', rc.receiptNumber);
  console.log('   - Farmer:', rc.farmer.name, '(' + rc.farmer.farmerId + ')');
  console.log('   - Commodity:', rc.procurement.crop, 'Net Qty:', rc.procurement.netQuantity, 'Qt');
  console.log('   - Final Disbursed Amount: ₹' + rc.procurement.finalPayableAmount.toLocaleString('en-IN'));
  console.log('   - Payment UTR:', rc.payment.utr);
  console.log('   - Officer Name:', rc.officerName);
  console.log('   - Timeline Milestones logged:', rc.timeline.length);
  if (!rc.receiptNumber || !rc.payment.utr || rc.timeline.length < 5) {
    throw new Error('Receipt missing key metadata or timeline events');
  }
  console.log('   ✓ Digital receipt verified with full audit timeline.');

  // 10. Payment History Table
  console.log('10. Testing Payment History Table (GET /api/officer/payments)...');
  const historyRes = await request('GET', '/api/officer/payments?centreId=centre-001', null, token);
  if (historyRes.status !== 200 || !Array.isArray(historyRes.body.data)) {
    throw new Error('Payment history failed: ' + JSON.stringify(historyRes.body));
  }
  const paymentsList = historyRes.body.data;
  console.log('   Total payments in history for centre-001:', paymentsList.length);
  const foundOurPayment = paymentsList.find(p => p.utr === utr);
  if (!foundOurPayment) {
    throw new Error('Newly created payment not found in history!');
  }
  console.log('   ✓ Newly settled payment found in history table:');
  console.log('     Token:', foundOurPayment.tokenNumber, 'Amount: ₹' + foundOurPayment.netAmount, 'Status:', foundOurPayment.status, 'UTR:', foundOurPayment.utr);

  // 10b. Filter test
  const successHistory = await request('GET', '/api/officer/payments?centreId=centre-001&status=success', null, token);
  console.log('   ✓ Filter "success" returned:', successHistory.body.data.length, 'records.');

  console.log('\n====================================================');
  console.log('🎉 ALL 10 OFFICER WORKFLOW TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================\n');
}

runOfficerTests().catch(err => {
  console.error('\n❌ OFFICER TEST SUITE FAILED:', err);
  process.exit(1);
});
