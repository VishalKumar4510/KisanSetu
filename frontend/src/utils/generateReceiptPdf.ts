import jsPDF from 'jspdf';

export interface ReceiptData {
  title?: string;
  subTitle?: string;
  receiptNumber?: string;
  receiptDate?: string;
  officerName?: string;
  simulationDisclaimer?: string;
  farmer?: {
    name?: string;
    farmerId?: string;
    village?: string;
    district?: string;
    state?: string;
    phone?: string;
    maskedBankAccount?: string;
    ifsc?: string;
    bankName?: string;
  };
  procurement?: {
    tokenNumber?: string;
    centreName?: string;
    centreLocation?: string;
    crop?: string;
    scaleId?: string;
    grossWeight?: number;
    tareWeight?: number;
    netQuantity?: number;
    qualityGrade?: string;
    moistureContent?: number;
    foreignMatter?: number;
    damagedGrains?: number;
    baseRate?: number;
    qualityAdjustment?: number;
    finalRate?: number;
    grossAmount?: number;
    deductions?: number;
    finalPayableAmount?: number;
  };
  payment?: {
    status?: string;
    paymentMethod?: string;
    transactionId?: string;
    utr?: string;
    dbtReferenceId?: string;
    paymentTimestamp?: string;
  };
}



/**
 * Generates the PDF Blob using jsPDF.
 */
export function generateReceiptPdfBlob(data: ReceiptData): { filename: string; blob: Blob } {
  const receiptNum = data.receiptNumber || `REC-${Date.now().toString().slice(-8)}`;
  const filename = `KisanSetu-Receipt-${receiptNum}.pdf`;

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

  // 1. HEADER BRANDING & TITLE
  doc.setFillColor(21, 128, 61); // Emerald 700
  doc.rect(leftMargin, y, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('KisanSetu', leftMargin + 6, y + 9);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital Procurement Receipt', leftMargin + 6, y + 15);

  doc.setFontSize(8);
  doc.setTextColor(209, 250, 229); // Emerald 100
  doc.text('Demo / Simulated Environment', leftMargin + 6, y + 20);

  // Receipt No & Date (Right aligned in header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(receiptNum, pageWidth - rightMargin - 6, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const dateStr = data.receiptDate ? new Date(data.receiptDate).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  doc.text(dateStr, pageWidth - rightMargin - 6, y + 16, { align: 'right' });

  y += 30;

  // Helper function to draw section header
  const drawSectionHeader = (title: string, currentY: number): number => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text(title.toUpperCase(), leftMargin, currentY);

    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.3);
    doc.line(leftMargin, currentY + 2, pageWidth - rightMargin, currentY + 2);
    return currentY + 6;
  };

  // Helper function for 2-column key-value grid
  const drawRow = (label1: string, val1: string, label2: string, val2: string, currentY: number): number => {
    const col1KeyX = leftMargin + 2;
    const col1ValX = leftMargin + 42;
    const col2KeyX = leftMargin + 92;
    const col2ValX = leftMargin + 138;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(label1, col1KeyX, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(val1, col1ValX, currentY);

    if (label2) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(label2, col2KeyX, currentY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(val2, col2ValX, currentY);
    }
    return currentY + 5.5;
  };

  // 2. CENTRE & PROCUREMENT META
  y = drawSectionHeader('Centre & Mandi Information', y);
  y = drawRow('Centre Name:', data.procurement?.centreName || 'Krishi Upaj Mandi', 'Token Number:', `#${data.procurement?.tokenNumber || 'TKN-001'}`, y);
  y = drawRow('Location:', data.procurement?.centreLocation || 'Grain Mandi Bay #01', 'Scale Equipment:', data.procurement?.scaleId || 'Weighbridge #01', y);
  y += 2;

  // 3. FARMER DETAILS
  y = drawSectionHeader('Farmer Identification', y);
  y = drawRow('Farmer Name:', data.farmer?.name || 'Sita Devi', 'Farmer ID:', data.farmer?.farmerId || 'KS-FARM-0002', y);
  y = drawRow('Village / District:', `${data.farmer?.village || 'Rampur'}, ${data.farmer?.district || 'Sehore'}`, 'Crop / Commodity:', data.procurement?.crop || 'WHEAT', y);
  y = drawRow('Phone Number:', data.farmer?.phone || '•••• •••• 98', 'Bank Account:', data.farmer?.maskedBankAccount || '•••• •••• •••• 4119', y);
  y = drawRow('Bank & IFSC:', `${data.farmer?.bankName || 'Punjab National Bank'} (${data.farmer?.ifsc || 'PUNB0145200'})`, '', '', y);
  y += 2;

  // 4. WEIGHMENT & QUALITY METRICS
  y = drawSectionHeader('Weighment & Quality Assessment', y);
  const gross = Number(data.procurement?.grossWeight || 0).toFixed(2);
  const tare = Number(data.procurement?.tareWeight || 0).toFixed(2);
  const net = Number(data.procurement?.netQuantity || 0).toFixed(2);
  y = drawRow('Gross Weight:', `${gross} Qt`, 'Quality Grade:', `Grade ${data.procurement?.qualityGrade || 'A'} (FAQ Standard)`, y);
  y = drawRow('Tare Weight:', `${tare} Qt`, 'Moisture Content:', `${data.procurement?.moistureContent || 11.4}%`, y);
  y = drawRow('Net Quantity:', `${net} Qt`, 'Foreign Matter:', `${data.procurement?.foreignMatter || 0.35}%`, y);
  y = drawRow('Damaged Grains:', `${data.procurement?.damagedGrains || 0.8}%`, 'Quality Decision:', 'ACCEPTED', y);
  y += 2;

  // 5. FINANCIAL & DISBURSAL BREAKDOWN
  y = drawSectionHeader('Financial & Direct Benefit Transfer Calculation', y);
  const baseRate = data.procurement?.baseRate || 2275;
  const adj = data.procurement?.qualityAdjustment || 0;
  const finalRate = data.procurement?.finalRate || (baseRate + adj);
  const grossVal = data.procurement?.grossAmount || Math.round(Number(net) * finalRate);
  const deductions = data.procurement?.deductions || Math.round(grossVal * 0.02);
  const netAmount = data.procurement?.finalPayableAmount || (grossVal - deductions);

  y = drawRow('Configured Base Rate:', `Rs. ${baseRate.toLocaleString('en-IN')}/Qt`, 'Gross Value:', `Rs. ${grossVal.toLocaleString('en-IN')}`, y);
  y = drawRow('Quality Premium:', `Rs. ${adj.toLocaleString('en-IN')}/Qt`, 'Mandi Cess (2%):', `-Rs. ${deductions.toLocaleString('en-IN')}`, y);
  y = drawRow('Final Effective Rate:', `Rs. ${finalRate.toLocaleString('en-IN')}/Qt`, '', '', y);

  // Highlight Box for Final Payable Amount
  y += 1;
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.setDrawColor(167, 243, 208); // Emerald 200
  doc.roundedRect(leftMargin, y, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(6, 95, 70); // Emerald 800
  doc.text('FINAL PAYABLE AMOUNT (DBT):', leftMargin + 4, y + 7.5);

  doc.setFontSize(13);
  doc.setTextColor(4, 120, 87); // Emerald 700
  doc.text(`Rs. ${netAmount.toLocaleString('en-IN')}`, pageWidth - rightMargin - 4, y + 8, { align: 'right' });

  y += 18;

  // 6. PAYMENT AUDIT & TRANSACTION REFERENCES
  y = drawSectionHeader('Simulated Payment Audit & Settlement', y);
  y = drawRow('Payment Status:', data.payment?.status || 'COMPLETED', 'Payment Method:', data.payment?.paymentMethod || 'DBT (Demo Payment Workflow)', y);
  y = drawRow('Transaction ID:', data.payment?.transactionId || 'KS-TXN-20260924-1026', 'UTR Reference:', data.payment?.utr || '982440385255', y);
  const payTime = data.payment?.paymentTimestamp ? new Date(data.payment.paymentTimestamp).toLocaleString('en-IN') : dateStr;
  y = drawRow('Payment Timestamp:', payTime, 'Officer Name:', data.officerName || 'Officer Verma', y);
  y += 2;

  // 7. SIMULATION DISCLAIMER BOX
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(leftMargin, y, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text('DEMO / SIMULATED ENVIRONMENT DISCLAIMER', leftMargin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // Slate 600
  const disclaimerText = data.simulationDisclaimer ||
    'Payment information shown here is part of a simulated demonstration workflow. No real bank transaction was initiated. KisanSetu is an educational & portfolio engineering console for agricultural procurement operations.';
  
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth - 8);
  doc.text(splitDisclaimer, leftMargin + 4, y + 10);

  y += 24;

  // FOOTER AUDIT STAMP
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`Generated securely by KisanSetu Console • Audit Hash: KS-${receiptNum.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}-OK`, leftMargin, y);
  doc.text(`Page 1 of 1`, pageWidth - rightMargin, y, { align: 'right' });

  const blob = doc.output('blob') as Blob;
  return { filename, blob };
}

/**
 * Downloads the receipt PDF using a browser-standard Blob URL and temporary anchor element.
 * Follows exact sequence:
 * URL.createObjectURL(blob) -> temporary <a download> -> link.click() -> URL.revokeObjectURL(url)
 */
export async function downloadReceiptPdf(data: ReceiptData): Promise<{ filename: string; blob: Blob }> {
  const { filename, blob } = generateReceiptPdfBlob(data);

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke the object URL after triggering download
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 500);
  }

  return { filename, blob };
}
