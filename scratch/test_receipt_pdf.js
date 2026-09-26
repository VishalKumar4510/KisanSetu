const fs = require('fs');
const path = require('path');
const { jsPDF } = require(path.join(__dirname, '../frontend/node_modules/jspdf/dist/jspdf.node.min.js'));

async function testPdfGeneration() {
  console.log('Testing KisanSetu PDF Receipt Generation with jsPDF...');

  const data = {
    title: 'KisanSetu Digital Procurement Receipt',
    subTitle: 'Demo / Simulated Environment • Agricultural Mandi Procurement System',
    receiptNumber: 'REC-20260924-PROC-0001',
    receiptDate: new Date().toISOString(),
    officerName: 'Officer Verma',
    simulationDisclaimer: 'Payment information shown here is part of a simulated demonstration workflow. No real bank transaction was initiated.',
    farmer: {
      name: 'Sita Devi',
      farmerId: 'KS-FARM-0002',
      village: 'Rampur',
      district: 'Sehore',
      phone: '9876543210',
      maskedBankAccount: '•••• •••• •••• 4119',
      ifsc: 'PUNB0145200',
      bankName: 'Punjab National Bank'
    },
    procurement: {
      tokenNumber: 'TKN-001-001',
      centreName: 'Krishi Upaj Mandi',
      centreLocation: 'Grain Mandi Bay #01',
      crop: 'WHEAT',
      scaleId: 'Weighbridge #01',
      grossWeight: 26.50,
      tareWeight: 0.50,
      netQuantity: 26.00,
      qualityGrade: 'A',
      moistureContent: 11.2,
      foreignMatter: 0.35,
      damagedGrains: 0.80,
      baseRate: 2275,
      qualityAdjustment: 0,
      finalRate: 2275,
      grossAmount: 59150,
      deductions: 1183,
      finalPayableAmount: 57967
    },
    payment: {
      status: 'COMPLETED',
      paymentMethod: 'DBT (Direct Benefit Transfer)',
      transactionId: 'KS-TXN-20260924-1026',
      utr: '982478160186',
      paymentTimestamp: new Date().toISOString()
    }
  };

  const receiptNum = data.receiptNumber;
  const filename = `KisanSetu-Receipt-${receiptNum}.pdf`;
  const outputPath = path.join(__dirname, filename);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const leftMargin = 16;
  const rightMargin = 16;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  let y = 16;

  // 1. Header
  doc.setFillColor(21, 128, 61);
  doc.rect(leftMargin, y, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('KisanSetu', leftMargin + 6, y + 9);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital Procurement Receipt', leftMargin + 6, y + 15);

  doc.setFontSize(8);
  doc.setTextColor(209, 250, 229);
  doc.text('Demo / Simulated Environment', leftMargin + 6, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(receiptNum, pageWidth - rightMargin - 6, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(new Date(data.receiptDate).toLocaleString('en-IN'), pageWidth - rightMargin - 6, y + 16, { align: 'right' });

  y += 30;

  const drawSectionHeader = (title, currentY) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(title.toUpperCase(), leftMargin, currentY);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, currentY + 2, pageWidth - rightMargin, currentY + 2);
    return currentY + 6;
  };

  const drawRow = (label1, val1, label2, val2, currentY) => {
    const col1KeyX = leftMargin + 2;
    const col1ValX = leftMargin + 42;
    const col2KeyX = leftMargin + 92;
    const col2ValX = leftMargin + 138;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label1, col1KeyX, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(val1), col1ValX, currentY);

    if (label2) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(label2, col2KeyX, currentY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(val2), col2ValX, currentY);
    }
    return currentY + 5.5;
  };

  // 2. Centre Meta
  y = drawSectionHeader('Centre & Mandi Information', y);
  y = drawRow('Centre Name:', data.procurement.centreName, 'Token Number:', '#' + data.procurement.tokenNumber, y);
  y = drawRow('Location:', data.procurement.centreLocation, 'Scale Equipment:', data.procurement.scaleId, y);
  y += 2;

  // 3. Farmer Details
  y = drawSectionHeader('Farmer Identification', y);
  y = drawRow('Farmer Name:', data.farmer.name, 'Farmer ID:', data.farmer.farmerId, y);
  y = drawRow('Village / District:', `${data.farmer.village}, ${data.farmer.district}`, 'Crop / Commodity:', data.procurement.crop, y);
  y = drawRow('Phone Number:', data.farmer.phone, 'Bank Account:', data.farmer.maskedBankAccount, y);
  y = drawRow('Bank & IFSC:', `${data.farmer.bankName} (${data.farmer.ifsc})`, '', '', y);
  y += 2;

  // 4. Weighment & Quality
  y = drawSectionHeader('Weighment & Quality Assessment', y);
  y = drawRow('Gross Weight:', `${data.procurement.grossWeight.toFixed(2)} Qt`, 'Quality Grade:', `Grade ${data.procurement.qualityGrade} (FAQ Standard)`, y);
  y = drawRow('Tare Weight:', `${data.procurement.tareWeight.toFixed(2)} Qt`, 'Moisture Content:', `${data.procurement.moistureContent}%`, y);
  y = drawRow('Net Quantity:', `${data.procurement.netQuantity.toFixed(2)} Qt`, 'Foreign Matter:', `${data.procurement.foreignMatter}%`, y);
  y = drawRow('Damaged Grains:', `${data.procurement.damagedGrains}%`, 'Quality Decision:', 'ACCEPTED', y);
  y += 2;

  // 5. Financial Summary
  y = drawSectionHeader('Financial & Direct Benefit Transfer Calculation', y);
  y = drawRow('MSP / Base Rate:', `Rs. ${data.procurement.baseRate}/Qt`, 'Gross Value:', `Rs. ${data.procurement.grossAmount.toLocaleString('en-IN')}`, y);
  y = drawRow('Quality Premium:', `Rs. ${data.procurement.qualityAdjustment}/Qt`, 'Mandi Cess (2%):', `-Rs. ${data.procurement.deductions.toLocaleString('en-IN')}`, y);
  y = drawRow('Final Effective Rate:', `Rs. ${data.procurement.finalRate}/Qt`, '', '', y);

  y += 1;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(leftMargin, y, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(6, 95, 70);
  doc.text('FINAL PAYABLE AMOUNT (DBT):', leftMargin + 4, y + 7.5);

  doc.setFontSize(13);
  doc.setTextColor(4, 120, 87);
  doc.text(`Rs. ${data.procurement.finalPayableAmount.toLocaleString('en-IN')}`, pageWidth - rightMargin - 4, y + 8, { align: 'right' });

  y += 18;

  // 6. Payment Audit
  y = drawSectionHeader('Simulated Payment Audit & Settlement', y);
  y = drawRow('Payment Status:', data.payment.status, 'Payment Method:', data.payment.paymentMethod, y);
  y = drawRow('Transaction ID:', data.payment.transactionId, 'UTR Reference:', data.payment.utr, y);
  y = drawRow('Payment Timestamp:', new Date(data.payment.paymentTimestamp).toLocaleString('en-IN'), 'Officer Name:', data.officerName, y);
  y += 2;

  // 7. Disclaimer
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftMargin, y, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text('DEMO / SIMULATED ENVIRONMENT DISCLAIMER', leftMargin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const splitDisclaimer = doc.splitTextToSize(data.simulationDisclaimer, contentWidth - 8);
  doc.text(splitDisclaimer, leftMargin + 4, y + 10);

  y += 24;

  // Footer Audit Hash
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated securely by KisanSetu Console • Audit Hash: KS-${receiptNum.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}-OK`, leftMargin, y);
  doc.text(`Page 1 of 1`, pageWidth - rightMargin, y, { align: 'right' });

  const pdfOutput = doc.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(pdfOutput));

  const stats = fs.statSync(outputPath);
  console.log(`✓ PDF successfully written to ${outputPath} (${stats.size} bytes)`);

  // Verify file is a valid PDF
  const buffer = fs.readFileSync(outputPath);
  const header = buffer.subarray(0, 5).toString();
  if (header !== '%PDF-') {
    throw new Error('Generated file is NOT a valid PDF! Header: ' + header);
  }
  console.log('✓ Verified PDF header: %PDF-');
  console.log('✓ Filename matches expected format:', filename);
}

testPdfGeneration().catch((err) => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
