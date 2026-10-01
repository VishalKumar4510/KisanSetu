/**
 * Payment Provider Adapters Registry
 * Phase 28: Provider-Agnostic Payment & Webhook Architecture
 */

import { PaymentAdapter } from './PaymentAdapter';
import { simulatedPfmsAdapter } from './SimulatedPfmsAdapter';
import { productionPfmsAdapter } from './ProductionPfmsAdapter';
import config from '../../../lib/config';

export * from './PaymentAdapter';
export * from './SimulatedPfmsAdapter';
export * from './ProductionPfmsAdapter';

const adapters: Record<string, PaymentAdapter> = {
  PFMS_SIMULATED: simulatedPfmsAdapter,
  PFMS_PRODUCTION: productionPfmsAdapter,
};

export function getActivePaymentAdapter(): PaymentAdapter {
  if (config.PAYMENT_MODE === 'PRODUCTION' || config.PAYMENT_PROVIDER === 'production') {
    return productionPfmsAdapter;
  }
  return simulatedPfmsAdapter;
}

export function getPaymentAdapterByName(name: string): PaymentAdapter | null {
  return adapters[name] || null;
}
