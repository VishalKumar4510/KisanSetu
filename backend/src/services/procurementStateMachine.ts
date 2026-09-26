import { ProcurementStatus, PROCUREMENT_FLOW } from '../../../shared/types';
import { AppError } from '../middleware/errorHandler';

/**
 * Central Procurement State Machine Service
 * Single source of truth for all lifecycle state transitions across the platform.
 */
export class ProcurementStateMachine {
  /**
   * Validate if a transition from currentStatus to targetStatus is permitted.
   */
  static validateTransition(currentStatus: ProcurementStatus, targetStatus: ProcurementStatus): void {
    // Normal sequential progression
    const currentIdx = PROCUREMENT_FLOW.indexOf(currentStatus);
    const targetIdx = PROCUREMENT_FLOW.indexOf(targetStatus);

    if (currentIdx === -1 || targetIdx === -1) {
      throw new AppError(`Unrecognized procurement status in transition: ${currentStatus} -> ${targetStatus}`, 400);
    }

    if (targetIdx !== currentIdx + 1) {
      throw new AppError(`Invalid transition from ${currentStatus} to ${targetStatus}`, 400);
    }
  }

  /**
   * Check if status indicates the procurement is completed or terminal.
   */
  static isTerminal(status: ProcurementStatus): boolean {
    return status === ProcurementStatus.COMPLETED || status === ProcurementStatus.REJECTED;
  }
}
