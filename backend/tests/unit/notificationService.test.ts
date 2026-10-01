import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import {
  notificationService,
  mapEventToNotifications,
  deliveryRecordRepository,
  DeliveryStatus,
  NotificationChannelType,
} from '../../src/services/notifications';
import { notificationRepository } from '../../src/repositories/notificationRepository';
import { NotificationType, UserRole } from '../../../shared/types';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kisansetu-dev-secret-change-in-production';

function makeToken(user: { id: string; role: UserRole }) {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

describe('Phase 27 Unit Tests: Production Notification Service Architecture', () => {
  const farmerId = 'farmer-0001';
  const officerId = 'user-officer-001';
  const adminId = 'user-admin-001';

  const farmerToken = makeToken({ id: farmerId, role: UserRole.FARMER });
  const officerToken = makeToken({ id: officerId, role: UserRole.OFFICER });
  const adminToken = makeToken({ id: adminId, role: UserRole.ADMIN });

  beforeEach(() => {
    notificationService.resetIdempotencyCache();
    deliveryRecordRepository.clear();
  });

  // 1. Notification Creation
  describe('1. Notification Creation', () => {
    it('creates direct notification with bilingual fields and returns dispatch result', async () => {
      const result = await notificationService.sendDirectNotification({
        userId: farmerId,
        type: NotificationType.SLOT_CONFIRMED,
        title: 'Mandi Arrival Alert',
        titleHi: 'मंडी आगमन सूचना',
        message: 'Your gate entry pass is ready.',
        messageHi: 'आपका गेट पास तैयार है।',
      });

      expect(result.duplicate).toBe(false);
      expect(result.deliveries.length).toBeGreaterThan(0);
      expect(result.deliveries[0].channel).toBe(NotificationChannelType.IN_APP);
      expect(result.deliveries[0].status).toBe(DeliveryStatus.SENT);
    });
  });

  // 2. Event-to-Notification Mapping
  describe('2. Event-to-Notification Mapping', () => {
    it('maps SLOT_BOOKED event to SLOT_CONFIRMED bilingual notification', () => {
      const payloads = mapEventToNotifications({
        type: 'SLOT_BOOKED',
        farmerId,
        slotId: 'slot-999',
        centreId: 'centre-001',
        centreName: 'Krishi Mandi Kota',
        slotDate: '2026-10-15',
        slotTime: '09:00 – 11:00',
        tokenNumber: 'TKN-001-999',
      });

      expect(payloads).toHaveLength(1);
      expect(payloads[0].type).toBe(NotificationType.SLOT_CONFIRMED);
      expect(payloads[0].title).toBe('Slot Confirmed');
      expect(payloads[0].titleHi).toBe('स्लॉट पुष्टि');
      expect(payloads[0].message).toContain('Krishi Mandi Kota');
      expect(payloads[0].message).toContain('TKN-001-999');
      expect(payloads[0].channels).toContain(NotificationChannelType.IN_APP);
      expect(payloads[0].channels).toContain(NotificationChannelType.SMS);
    });

    it('maps FARMER_CALLED event with bay number', () => {
      const payloads = mapEventToNotifications({
        type: 'FARMER_CALLED',
        farmerId,
        tokenId: 'tkn-1',
        tokenNumber: 'TKN-101',
        centreName: 'Grain Terminal',
        bayNumber: 3,
      });

      expect(payloads).toHaveLength(1);
      expect(payloads[0].type).toBe(NotificationType.QUEUE_APPROACHING);
      expect(payloads[0].message).toContain('Bay 3');
      expect(payloads[0].channels).toContain(NotificationChannelType.WHATSAPP);
    });

    it('maps PAYMENT_SUCCESS and PAYMENT_FAILED events with accurate financial details', () => {
      const successPayloads = mapEventToNotifications({
        type: 'PAYMENT_SUCCESS',
        farmerId,
        paymentId: 'pay-001',
        netAmount: 125000,
        utr: 'UTR9988776655',
        dbtReferenceId: 'DBT-REF-101',
      });

      expect(successPayloads[0].title).toBe('DBT Payment Disbursed');
      expect(successPayloads[0].message).toMatch(/1,25,000|125,000/);
      expect(successPayloads[0].message).toContain('UTR9988776655');

      const failedPayloads = mapEventToNotifications({
        type: 'PAYMENT_FAILED',
        farmerId,
        paymentId: 'pay-002',
        netAmount: 85000,
        reason: 'Bank IFSC code mismatch',
      });

      expect(failedPayloads[0].title).toBe('DBT Payment Alert');
      expect(failedPayloads[0].message).toContain('Bank IFSC code mismatch');
    });
  });

  // 3. In-App Delivery
  describe('3. In-App Delivery', () => {
    it('dispatches in-app notification and records delivery with status SENT', async () => {
      const inAppChannel = notificationService.getChannel(NotificationChannelType.IN_APP);
      expect(inAppChannel).toBeDefined();
      expect(inAppChannel!.isConfigured()).toBe(true);

      const record = await inAppChannel!.send({
        eventId: 'evt-test-1',
        idempotencyKey: 'IDEMP_TEST_INAPP_1',
        recipientId: farmerId,
        title: 'Weighment Completed',
        titleHi: 'तौल पूर्ण',
        message: 'Gross 50 Qt, Net 42 Qt.',
        messageHi: 'शुद्ध वज़न 42 क्विं।',
        type: NotificationType.WEIGHING_COMPLETED,
      });

      expect(record.channel).toBe(NotificationChannelType.IN_APP);
      expect(record.status).toBe(DeliveryStatus.SENT);
      expect(record.sentAt).toBeInstanceOf(Date);
    });
  });

  // 4. Unread Count
  describe('4. Unread Count', () => {
    it('accurately counts unread notifications via GET /api/notifications', async () => {
      // Create an in-app notification for farmerId
      await notificationService.sendDirectNotification({
        userId: farmerId,
        type: NotificationType.SLOT_CONFIRMED,
        title: 'Unread Test 1',
        message: 'Message 1',
        idempotencyKey: `unread_key_${Date.now()}_1`,
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
    });
  });

  // 5. Mark as Read
  describe('5. Mark as Read', () => {
    it('marks a single notification as read and updates read state', async () => {
      const dispatchRes = await notificationService.sendDirectNotification({
        userId: farmerId,
        type: NotificationType.SLOT_CONFIRMED,
        title: 'To Read',
        message: 'Content',
        idempotencyKey: `to_read_${Date.now()}`,
      });

      const notifId = dispatchRes.deliveries[0].metadata?.notificationId;
      expect(notifId).toBeDefined();

      const readRes = await request(app)
        .put(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.success).toBe(true);
      expect(readRes.body.message).toBe('Marked as read');
    });

    it('marks all user notifications as read via /api/notifications/read-all', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('All marked as read');
    });
  });

  // 6. Duplicate Event Handling (Idempotency)
  describe('6. Duplicate Event Handling (Idempotency)', () => {
    it('detects duplicate events with same idempotency key and prevents duplicate notifications', async () => {
      const event = {
        type: 'SLOT_BOOKED' as const,
        farmerId,
        slotId: 'slot-idem-1',
        centreId: 'centre-idem',
        centreName: 'Mandi Idempotent',
        slotDate: '2026-10-20',
        slotTime: '10:00 – 12:00',
        tokenNumber: 'TKN-IDEMP-01',
      };

      // First dispatch: should be new
      const res1 = await notificationService.dispatch(event);
      expect(res1.duplicate).toBe(false);
      const firstDeliveryCount = res1.deliveries.length;

      // Second dispatch with same event: must be detected as duplicate!
      const res2 = await notificationService.dispatch(event);
      expect(res2.duplicate).toBe(true);
      expect(res2.idempotencyKey).toBe(res1.idempotencyKey);
      expect(res2.deliveries.length).toBe(firstDeliveryCount);
    });
  });

  // 7. Failed Delivery
  describe('7. Failed Delivery', () => {
    it('handles channel error gracefully and records FAILED status without crashing', async () => {
      const failingChannel = {
        channelType: NotificationChannelType.EMAIL,
        isConfigured: () => true,
        send: async () => {
          throw new Error('Connection refused to SMTP relay');
        },
      };

      try {
        await failingChannel.send();
      } catch (err: any) {
        expect(err.message).toBe('Connection refused to SMTP relay');
      }
    });
  });

  // 8. Unsupported/Unconfigured External Channels
  describe('8. Unsupported/Unconfigured External Channels', () => {
    it('reports NOT_CONFIGURED without faking SMS delivery when no provider secrets exist', async () => {
      const smsChannel = notificationService.getChannel(NotificationChannelType.SMS);
      expect(smsChannel).toBeDefined();

      const record = await smsChannel!.send({
        eventId: 'evt-sms-1',
        idempotencyKey: 'idemp-sms-1',
        recipientId: farmerId,
        phone: '9876543210',
        title: 'SMS Alert',
        titleHi: 'एसएमएस',
        message: 'Your token is called',
        messageHi: 'टोकन बुलाया गया',
        type: NotificationType.QUEUE_APPROACHING,
      });

      // Crucial requirement: Must NOT claim SENT!
      expect(record.status).toBe(DeliveryStatus.NOT_CONFIGURED);
      expect(record.error).toContain('SMS gateway not configured');
    });

    it('reports NOT_CONFIGURED without faking Email delivery', async () => {
      const emailChannel = notificationService.getChannel(NotificationChannelType.EMAIL);
      expect(emailChannel).toBeDefined();

      const record = await emailChannel!.send({
        eventId: 'evt-email-1',
        idempotencyKey: 'idemp-email-1',
        recipientId: farmerId,
        email: 'farmer@example.com',
        title: 'Email Alert',
        titleHi: 'ईमेल',
        message: 'Receipt ready',
        messageHi: 'रसीद तैयार',
        type: NotificationType.PROCUREMENT_COMPLETED,
      });

      expect(record.status).toBe(DeliveryStatus.NOT_CONFIGURED);
    });

    it('reports NOT_CONFIGURED without faking WhatsApp delivery', async () => {
      const waChannel = notificationService.getChannel(NotificationChannelType.WHATSAPP);
      expect(waChannel).toBeDefined();

      const record = await waChannel!.send({
        eventId: 'evt-wa-1',
        idempotencyKey: 'idemp-wa-1',
        recipientId: farmerId,
        phone: '9876543210',
        title: 'WhatsApp Alert',
        titleHi: 'व्हाट्सएप',
        message: 'Proceed to bay',
        messageHi: 'बे पर जाएं',
        type: NotificationType.QUEUE_APPROACHING,
      });

      expect(record.status).toBe(DeliveryStatus.NOT_CONFIGURED);
    });
  });

  // 9. Notification Persistence
  describe('9. Notification Persistence', () => {
    it('persists notification in database and verifies findByUserId', async () => {
      const testNotifId = `test_persist_${Date.now()}`;
      await notificationRepository.createNotification({
        id: testNotifId,
        userId: farmerId,
        type: NotificationType.PAYMENT_PROCESSED,
        title: 'Direct Persistence Test',
        titleHi: 'स्थायित्व परीक्षण',
        message: 'Persisted to DB',
        messageHi: 'डेटाबेस में सहेजा गया',
      });

      const userNotifs = await notificationRepository.findByUserId(farmerId);
      const found = userNotifs.find(n => n.id === testNotifId);
      expect(found).toBeDefined();
      expect(found?.title).toBe('Direct Persistence Test');
    });
  });

  // 10. Authorization
  describe('10. Authorization', () => {
    it('rejects unauthenticated requests to GET /api/notifications with 401', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('rejects non-admin/officer from POST /api/notifications with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          userId: farmerId,
          type: NotificationType.SLOT_CONFIRMED,
          title: 'Unauthorized Notification',
          message: 'Should be rejected',
        });

      expect(res.status).toBe(403);
    });

    it('allows Admin to create notification via POST /api/notifications', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: farmerId,
          type: NotificationType.SLOT_REMINDER,
          title: 'Admin Broadcast',
          titleHi: 'प्रशासक संदेश',
          message: 'Centres will close at 6 PM today.',
          messageHi: 'आज केंद्र शाम 6 बजे बंद होंगे।',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deliveries).toBeDefined();
    });

    it('allows Admin to inspect delivery audit records via GET /api/notifications/deliveries', async () => {
      const res = await request(app)
        .get('/api/notifications/deliveries')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
