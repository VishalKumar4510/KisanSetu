import { describe, it, expect } from 'vitest';
import {
  calculateNetWeight,
  evaluateQuality,
  calculateMspPayment,
} from '../../src/services/procurementMath';
import { ProduceType, MSP_RATES } from '../../../shared/types';

describe('Unit Tests: Procurement Business Logic Math', () => {
  // -------------------------------------------------------------
  // A. Weighment Calculations
  // -------------------------------------------------------------
  describe('Weighment (Gross - Tare = Net)', () => {
    it('calculates correct net weight for normal realistic values', () => {
      // Truck + grain = 84.50 Qt, Empty truck = 32.20 Qt -> Net = 52.30 Qt
      const result = calculateNetWeight(84.5, 32.2);
      expect(result.netWeight).toBe(52.3);
      expect(result.grossWeight).toBe(84.5);
      expect(result.tareWeight).toBe(32.2);
    });

    it('handles zero tare weight correctly (e.g. pre-tared pallet or platform scale)', () => {
      const result = calculateNetWeight(25.5, 0);
      expect(result.netWeight).toBe(25.5);
    });

    it('handles high-precision fractional weights with 2-decimal rounding', () => {
      const result = calculateNetWeight(100.333, 40.111);
      expect(result.netWeight).toBe(60.22);
    });

    it('throws error if tare weight is greater than gross weight', () => {
      expect(() => calculateNetWeight(20.0, 25.0)).toThrow(
        'Gross weight must be strictly greater than tare weight'
      );
    });

    it('throws error if gross weight equals tare weight (zero net weight)', () => {
      expect(() => calculateNetWeight(30.0, 30.0)).toThrow(
        'Gross weight must be strictly greater than tare weight'
      );
    });

    it('throws error if gross weight is zero or negative', () => {
      expect(() => calculateNetWeight(0, 0)).toThrow(
        'Gross weight must be strictly greater than zero'
      );
      expect(() => calculateNetWeight(-10, 5)).toThrow(
        'Gross weight must be strictly greater than zero'
      );
    });

    it('throws error if tare weight is negative', () => {
      expect(() => calculateNetWeight(50, -5)).toThrow(
        'Tare weight must be zero or positive'
      );
    });
  });

  // -------------------------------------------------------------
  // B. Quality Grading & Agmarknet Thresholds
  // -------------------------------------------------------------
  describe('Quality Grading (Agmarknet FAQ Specifications)', () => {
    it('evaluates Grade A for optimal dry, clean wheat produce', () => {
      const result = evaluateQuality({
        moistureContent: 11.2,
        foreignMatter: 0.4,
        damagedGrains: 1.1,
      });
      expect(result.grade).toBe('A');
      expect(result.qualityResult).toBe('ACCEPTED');
      expect(result.isAccepted).toBe(true);
      expect(result.qualityAdjustment).toBe(0);
    });

    it('evaluates Grade B for produce within 12.0% - 14.0% moisture', () => {
      const result = evaluateQuality({
        moistureContent: 13.5,
        foreignMatter: 1.0,
        damagedGrains: 2.5,
      });
      expect(result.grade).toBe('B');
      expect(result.qualityResult).toBe('ACCEPTED');
      expect(result.isAccepted).toBe(true);
      expect(result.qualityAdjustment).toBe(-45); // statutory ₹45/Qt deduction
    });

    it('evaluates Grade C for produce within 14.0% - 16.0% moisture', () => {
      const result = evaluateQuality({
        moistureContent: 15.2,
        foreignMatter: 2.0,
        damagedGrains: 4.0,
      });
      expect(result.grade).toBe('C');
      expect(result.qualityResult).toBe('ACCEPTED');
      expect(result.isAccepted).toBe(true);
      expect(result.qualityAdjustment).toBe(-110); // statutory ₹110/Qt deduction
    });

    it('rejects produce exceeding moisture threshold (> 16.0%)', () => {
      const result = evaluateQuality({
        moistureContent: 16.8,
        foreignMatter: 0.5,
        damagedGrains: 1.0,
      });
      expect(result.grade).toBe('REJECT');
      expect(result.qualityResult).toBe('REJECTED');
      expect(result.isAccepted).toBe(false);
      expect(result.rejectionReason).toContain('Failed Agmarknet FAQ threshold');
    });

    it('rejects produce exceeding foreign matter threshold (> 2.5%)', () => {
      const result = evaluateQuality({
        moistureContent: 11.0,
        foreignMatter: 3.2,
        damagedGrains: 1.0,
      });
      expect(result.grade).toBe('REJECT');
      expect(result.qualityResult).toBe('REJECTED');
      expect(result.isAccepted).toBe(false);
    });

    it('rejects produce exceeding damaged grain threshold (> 5.0%)', () => {
      const result = evaluateQuality({
        moistureContent: 11.0,
        foreignMatter: 0.5,
        damagedGrains: 6.2,
      });
      expect(result.grade).toBe('REJECT');
      expect(result.qualityResult).toBe('REJECTED');
      expect(result.isAccepted).toBe(false);
    });

    it('throws error on out-of-range percentage inputs (< 0 or > 100)', () => {
      expect(() => evaluateQuality({ moistureContent: -2 })).toThrow();
      expect(() => evaluateQuality({ moistureContent: 105 })).toThrow();
      expect(() => evaluateQuality({ moistureContent: 12, foreignMatter: 110 })).toThrow();
    });
  });

  // -------------------------------------------------------------
  // C. MSP & Payment Calculation
  // -------------------------------------------------------------
  describe('Statutory MSP and Payment Calculation', () => {
    it('calculates correct MSP payment for Grade A Wheat with 2% APMC cess', () => {
      // 50.00 Quintals of Wheat @ MSP ₹2275/Qt
      // Gross = 50 * 2275 = ₹1,13,750.00
      // 2% Deductions = 113750 * 0.02 = ₹2,275.00
      // Net Payable = 113750 - 2275 = ₹1,11,475.00
      const result = calculateMspPayment({
        netQuantity: 50.0,
        cropType: ProduceType.WHEAT,
        grade: 'A',
      });

      expect(result.baseRate).toBe(2275);
      expect(result.qualityAdjustment).toBe(0);
      expect(result.finalRate).toBe(2275);
      expect(result.grossAmount).toBe(113750.0);
      expect(result.deductions).toBe(2275.0);
      expect(result.netAmount).toBe(111475.0);
    });

    it('applies statutory deduction for Grade B produce (-₹45/Qt)', () => {
      // 40 Quintals of Paddy @ MSP ₹2203 - ₹45 = ₹2158/Qt
      // Gross = 40 * 2158 = ₹86,320.00
      // 2% Deductions = 86320 * 0.02 = ₹1,726.40
      // Net Payable = 86320 - 1726.40 = ₹84,593.60
      const result = calculateMspPayment({
        netQuantity: 40.0,
        cropType: ProduceType.PADDY,
        grade: 'B',
      });

      expect(result.baseRate).toBe(2203);
      expect(result.qualityAdjustment).toBe(-45);
      expect(result.finalRate).toBe(2158);
      expect(result.grossAmount).toBe(86320.0);
      expect(result.deductions).toBe(1726.4);
      expect(result.netAmount).toBe(84593.6);
    });

    it('applies statutory deduction for Grade C produce (-₹110/Qt)', () => {
      // 20 Quintals of Maize @ MSP ₹2090 - ₹110 = ₹1980/Qt
      // Gross = 20 * 1980 = ₹39,600.00
      // 2% Deductions = 39600 * 0.02 = ₹792.00
      // Net Payable = 39600 - 792 = ₹38,808.00
      const result = calculateMspPayment({
        netQuantity: 20.0,
        cropType: ProduceType.MAIZE,
        grade: 'C',
      });

      expect(result.qualityAdjustment).toBe(-110);
      expect(result.finalRate).toBe(1980);
      expect(result.grossAmount).toBe(39600.0);
      expect(result.deductions).toBe(792.0);
      expect(result.netAmount).toBe(38808.0);
    });

    it('handles decimal quantities with financial 2-decimal precision', () => {
      // 33.33 Quintals of Pulses @ MSP ₹6600
      // Gross = 33.33 * 6600 = ₹2,19,978.00
      // Deductions = 219978 * 0.02 = ₹4,399.56
      // Net = 219978 - 4399.56 = ₹2,15,578.44
      const result = calculateMspPayment({
        netQuantity: 33.33,
        cropType: ProduceType.PULSES,
        grade: 'A',
      });

      expect(result.grossAmount).toBe(219978.0);
      expect(result.deductions).toBe(4399.56);
      expect(result.netAmount).toBe(215578.44);
    });

    it('throws error if netQuantity is zero or negative', () => {
      expect(() =>
        calculateMspPayment({ netQuantity: 0, cropType: ProduceType.WHEAT })
      ).toThrow('Net quantity must be strictly greater than zero');
      expect(() =>
        calculateMspPayment({ netQuantity: -15, cropType: ProduceType.WHEAT })
      ).toThrow('Net quantity must be strictly greater than zero');
    });
  });
});
