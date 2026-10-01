import { DeliveryRecord } from './types';

export class DeliveryRecordRepository {
  private records: Map<string, DeliveryRecord> = new Map();

  save(record: DeliveryRecord): void {
    this.records.set(record.id, { ...record });
  }

  saveMany(records: DeliveryRecord[]): void {
    for (const r of records) {
      this.save(r);
    }
  }

  getById(id: string): DeliveryRecord | null {
    return this.records.get(id) || null;
  }

  getByEventId(eventId: string): DeliveryRecord[] {
    return Array.from(this.records.values()).filter(r => r.eventId === eventId);
  }

  getByIdempotencyKey(key: string): DeliveryRecord[] {
    return Array.from(this.records.values()).filter(r => r.idempotencyKey === key);
  }

  getAll(): DeliveryRecord[] {
    return Array.from(this.records.values()).sort(
      (a, b) => ((b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0))
    );
  }

  markInAppRead(notificationId: string): void {
    for (const record of this.records.values()) {
      if (record.metadata?.notificationId === notificationId) {
        record.readAt = new Date();
      }
    }
  }

  clear(): void {
    this.records.clear();
  }
}

export const deliveryRecordRepository = new DeliveryRecordRepository();
export default deliveryRecordRepository;
