/**
 * Payment State Machine
 * Phase 28: Standardized Payment State Lifecycle
 * CREATED -> PROCESSING -> SUCCESS / FAILED -> REVERSED
 */

import { AppError } from '../../middleware/errorHandler';
import { PaymentState } from './types';

const ALLOWED_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  CREATED: ['PROCESSING', 'FAILED'],
  PROCESSING: ['SUCCESS', 'FAILED'],
  FAILED: ['PROCESSING'], // Allows retry of failed DBT transactions
  SUCCESS: ['REVERSED'],  // Settled payments can only transition to REVERSED
  REVERSED: [],           // Terminal state
};

export class PaymentStateMachine {
  /**
   * Check if transition from currentState to nextState is permitted.
   */
  canTransition(from: PaymentState, to: PaymentState): boolean {
    const allowed = ALLOWED_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Validate transition and throw structured AppError if illegal.
   */
  assertValidTransition(from: PaymentState, to: PaymentState, paymentId?: string): void {
    if (from === to) {
      if (from === 'SUCCESS') {
        throw new AppError(
          `Payment ${paymentId || ''} is already settled in state SUCCESS. Repeated settlement is strictly prohibited.`,
          409
        );
      }
      return; // No-op transition
    }

    if (!this.canTransition(from, to)) {
      throw new AppError(
        `Illegal payment state transition from ${from} to ${to}${paymentId ? ` for payment ${paymentId}` : ''}`,
        400
      );
    }
  }

  /**
   * Check if state is finalized / terminal.
   */
  isTerminalState(state: PaymentState): boolean {
    return state === 'REVERSED';
  }

  /**
   * Check if state represents a successful settlement.
   */
  isSettled(state: PaymentState): boolean {
    return state === 'SUCCESS';
  }
}

export const paymentStateMachine = new PaymentStateMachine();
export default paymentStateMachine;
