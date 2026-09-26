import { ProduceType, MSP_RATES } from '../../../shared/types';

export interface WeighmentResult {
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
}

export interface QualityGradeResult {
  grade: 'A' | 'B' | 'C' | 'REJECT';
  qualityResult: 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW';
  isAccepted: boolean;
  qualityAdjustment: number;
  rejectionReason?: string;
}

export interface MspPaymentResult {
  netQuantity: number;
  baseRate: number;
  qualityAdjustment: number;
  finalRate: number;
  grossAmount: number;
  deductions: number;
  netAmount: number;
}

/**
 * Pure calculation for weighbridge gross/tare weighment.
 * Formula: netWeight = grossWeight - tareWeight
 */
export function calculateNetWeight(grossWeight: number, tareWeight: number): WeighmentResult {
  const gross = Number(grossWeight);
  const tare = Number(tareWeight);

  if (isNaN(gross) || gross <= 0) {
    throw new Error('Gross weight must be strictly greater than zero');
  }
  if (isNaN(tare) || tare < 0) {
    throw new Error('Tare weight must be zero or positive');
  }
  if (gross <= tare) {
    throw new Error('Gross weight must be strictly greater than tare weight');
  }

  const netWeight = Number((gross - tare).toFixed(2));
  return {
    grossWeight: gross,
    tareWeight: tare,
    netWeight,
  };
}

/**
 * Pure evaluation of agricultural produce quality against Agmarknet FAQ standards.
 */
export function evaluateQuality(params: {
  moistureContent: number;
  foreignMatter?: number;
  damagedGrains?: number;
}): QualityGradeResult {
  const moisture = Number(params.moistureContent);
  const foreign = Number(params.foreignMatter || 0);
  const damaged = Number(params.damagedGrains || 0);

  if (isNaN(moisture) || moisture < 0 || moisture > 100) {
    throw new Error('Moisture content must be a percentage between 0 and 100');
  }
  if (foreign < 0 || foreign > 100) {
    throw new Error('Foreign matter must be a percentage between 0 and 100');
  }
  if (damaged < 0 || damaged > 100) {
    throw new Error('Damaged grains must be a percentage between 0 and 100');
  }

  // Agmarknet Rejection Thresholds: Moisture > 16.0%, Foreign > 2.5%, Damaged > 5.0%
  if (moisture > 16.0 || foreign > 2.5 || damaged > 5.0) {
    return {
      grade: 'REJECT',
      qualityResult: 'REJECTED',
      isAccepted: false,
      qualityAdjustment: 0,
      rejectionReason: `Failed Agmarknet FAQ threshold: Moisture ${moisture}%, Foreign ${foreign}%, Damaged ${damaged}%`,
    };
  }

  // Grade A FAQ Standard: Moisture <= 12%, Foreign <= 0.75%, Damaged <= 2.0%
  if (moisture <= 12.0 && foreign <= 0.75 && damaged <= 2.0) {
    return {
      grade: 'A',
      qualityResult: 'ACCEPTED',
      isAccepted: true,
      qualityAdjustment: 0,
    };
  }

  // Grade B Standard: Moisture <= 14.0%
  if (moisture <= 14.0 && foreign <= 1.5 && damaged <= 3.5) {
    return {
      grade: 'B',
      qualityResult: 'ACCEPTED',
      isAccepted: true,
      qualityAdjustment: -45, // -₹45/quintal deduction
    };
  }

  // Grade C Standard: Moisture <= 16.0%
  return {
    grade: 'C',
    qualityResult: 'ACCEPTED',
    isAccepted: true,
    qualityAdjustment: -110, // -₹110/quintal deduction
  };
}

/**
 * Pure calculation for Statutory Minimum Support Price (MSP) and APMC Mandi Cess (2%).
 * Formula:
 *   grossAmount = netQuantity * (baseRate + qualityAdjustment)
 *   deductions  = grossAmount * 0.02
 *   netAmount   = grossAmount - deductions
 */
export function calculateMspPayment(params: {
  netQuantity: number;
  cropType: ProduceType | string;
  grade?: string;
  customBaseRate?: number;
}): MspPaymentResult {
  const { netQuantity, cropType, grade = 'A', customBaseRate } = params;

  if (isNaN(netQuantity) || netQuantity <= 0) {
    throw new Error('Net quantity must be strictly greater than zero');
  }

  const baseRate = customBaseRate || MSP_RATES[cropType as ProduceType] || 2275;

  let qualityAdjustment = 0;
  if (grade === 'B') qualityAdjustment = -45;
  if (grade === 'C') qualityAdjustment = -110;

  const finalRate = Math.max(100, baseRate + qualityAdjustment);
  const grossAmount = Number((netQuantity * finalRate).toFixed(2));
  // 2% Statutory Mandi Cess & Handling deduction
  const deductions = Number((grossAmount * 0.02).toFixed(2));
  const netAmount = Number((grossAmount - deductions).toFixed(2));

  if (netAmount <= 0) {
    throw new Error('Net payable amount must be positive');
  }

  return {
    netQuantity,
    baseRate,
    qualityAdjustment,
    finalRate,
    grossAmount,
    deductions,
    netAmount,
  };
}
