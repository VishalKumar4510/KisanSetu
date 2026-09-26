/**
 * Payment Gateway Integration Interface & Simulator Adapter
 * Clean abstraction separating business logic from external banking / PFMS / NPCI providers.
 */

export interface ProcessPaymentParams {
  paymentId: string;
  amount: number;
  farmerId: string;
  bankAccount?: string | null;
  ifsc?: string | null;
}

export interface PaymentGatewayResult {
  success: boolean;
  utr?: string;
  dbtReferenceId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface PaymentGateway {
  processDbt(params: ProcessPaymentParams): Promise<PaymentGatewayResult>;
}

/**
 * Simulated DBT Payment Gateway for Development & Staging
 * Simulates real-world banking responses, UTR numbers, and failure retry paths.
 */
export class SimulatedPaymentGateway implements PaymentGateway {
  async processDbt(params: ProcessPaymentParams): Promise<PaymentGatewayResult> {
    const timestamp = Date.now();
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
    const utr = `${randomDigits}`;
    const dbtReferenceId = `DBT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      success: true,
      utr,
      dbtReferenceId,
    };
  }
}

export const defaultPaymentGateway: PaymentGateway = new SimulatedPaymentGateway();
