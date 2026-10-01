import { BusinessEvent, NotificationPayload, NotificationChannelType } from './types';
import { NotificationType } from '../../../../shared/types';

export function mapEventToNotifications(event: BusinessEvent): NotificationPayload[] {
  switch (event.type) {
    case 'SLOT_BOOKED':
      return [
        {
          userId: event.farmerId,
          type: NotificationType.SLOT_CONFIRMED,
          title: 'Slot Confirmed',
          titleHi: 'स्लॉट पुष्टि',
          message: `Your arrival slot at ${event.centreName} is confirmed for ${event.slotDate} (${event.slotTime}). Digital Token: ${event.tokenNumber}.`,
          messageHi: `${event.centreName} पर आपका स्लॉट ${event.slotDate} (${event.slotTime}) के लिए पुष्ट है। डिजिटल टोकन: ${event.tokenNumber}।`,
          channels: [NotificationChannelType.IN_APP, NotificationChannelType.SMS],
          metadata: {
            slotId: event.slotId,
            centreId: event.centreId,
            tokenNumber: event.tokenNumber,
          },
        },
      ];

    case 'SLOT_CANCELLED':
      return [
        {
          userId: event.farmerId,
          type: NotificationType.SLOT_REMINDER,
          title: 'Slot Cancelled',
          titleHi: 'स्लॉट रद्द',
          message: `Your booking at ${event.centreName} for ${event.slotDate} has been cancelled. You may reserve a new slot at any available centre.`,
          messageHi: `${event.centreName} पर ${event.slotDate} का आपका स्लॉट रद्द कर दिया गया है। आप उपलब्ध किसी भी केंद्र पर नया स्लॉट बुक कर सकते हैं।`,
          channels: [NotificationChannelType.IN_APP, NotificationChannelType.SMS],
          metadata: { slotId: event.slotId },
        },
      ];

    case 'TOKEN_GENERATED':
      return [
        {
          userId: event.farmerId,
          type: NotificationType.SLOT_CONFIRMED,
          title: 'Digital Token Generated',
          titleHi: 'डिजिटल टोकन जारी',
          message: `Digital Token ${event.tokenNumber} generated for ${event.centreName}. Current queue position: #${event.queuePosition}.`,
          messageHi: `${event.centreName} के लिए डिजिटल टोकन ${event.tokenNumber} जारी हुआ। वर्तमान कतार स्थिति: #${event.queuePosition}।`,
          channels: [NotificationChannelType.IN_APP],
          metadata: { tokenId: event.tokenId, tokenNumber: event.tokenNumber },
        },
      ];

    case 'FARMER_CALLED':
      return [
        {
          userId: event.farmerId,
          type: NotificationType.QUEUE_APPROACHING,
          title: 'Token Called — Proceed to Bay',
          titleHi: 'टोकन बुलाया गया — बे पर पहुँचें',
          message: `Your token ${event.tokenNumber} has been called at ${event.centreName}. Please proceed to ${event.bayNumber ? `Bay ${event.bayNumber}` : 'Intake Bay'} for inspection.`,
          messageHi: `${event.centreName} पर आपका टोकन ${event.tokenNumber} बुलाया गया है। कृपया जांच हेतु ${event.bayNumber ? `बे ${event.bayNumber}` : 'इंटेक बे'} पर पहुँचें।`,
          channels: [
            NotificationChannelType.IN_APP,
            NotificationChannelType.SMS,
            NotificationChannelType.WHATSAPP,
          ],
          metadata: {
            tokenId: event.tokenId,
            tokenNumber: event.tokenNumber,
            bayNumber: event.bayNumber,
          },
        },
      ];

    case 'WEIGHING_COMPLETED':
      return [
        {
          userId: event.farmerId,
          type: NotificationType.WEIGHING_COMPLETED,
          title: 'Weighment Completed',
          titleHi: 'तौल पूर्ण हुई',
          message: `Weighbridge measurement recorded: Gross ${event.grossWeight.toFixed(2)} Qt, Tare ${event.tareWeight.toFixed(2)} Qt. Certified Net Weight: ${event.netWeight.toFixed(2)} Qt.`,
          messageHi: `धर्मकांटा तौल दर्ज: सकल ${event.grossWeight.toFixed(2)} क्विं, खाली ${event.tareWeight.toFixed(2)} क्विं। प्रमाणित शुद्ध वज़न: ${event.netWeight.toFixed(2)} क्विं।`,
          channels: [NotificationChannelType.IN_APP],
          metadata: {
            procurementId: event.procurementId,
            netWeight: event.netWeight,
          },
        },
      ];

    case 'QUALITY_COMPLETED':
      return [
        {
          userId: event.farmerId,
          type: NotificationType.QUALITY_COMPLETED,
          title: 'Quality Assessment Completed',
          titleHi: 'गुणवत्ता परीक्षण पूर्ण',
          message: `Quality parameters verified: Certified Grade ${event.grade} (${event.qualityResult}). Proceeding to MSP procurement generation.`,
          messageHi: `गुणवत्ता मापदंड सत्यापित: प्रमाणित ग्रेड ${event.grade} (${event.qualityResult})। एमएसपी खरीद रसीद प्रक्रिया में है।`,
          channels: [NotificationChannelType.IN_APP],
          metadata: {
            procurementId: event.procurementId,
            grade: event.grade,
            qualityResult: event.qualityResult,
          },
        },
      ];

    case 'PROCUREMENT_COMPLETED':
      return [
        {
          userId: event.farmerId,
          type: NotificationType.PROCUREMENT_COMPLETED,
          title: 'Procurement Finalized',
          titleHi: 'खरीद पूर्ण व पुष्ट',
          message: `Procurement for ${event.produceType} finalized. Certified payable amount: ₹${event.netAmount.toLocaleString('en-IN')}. Scheduled for DBT transfer.`,
          messageHi: `${event.produceType} की खरीद पूर्ण हुई। प्रमाणित देय राशि: ₹${event.netAmount.toLocaleString('en-IN')}। डीबीटी हस्तांतरण प्रक्रिया में है।`,
          channels: [NotificationChannelType.IN_APP, NotificationChannelType.SMS],
          metadata: {
            procurementId: event.procurementId,
            produceType: event.produceType,
            netAmount: event.netAmount,
          },
        },
      ];

    case 'PAYMENT_PROCESSING':
      return [
        {
          userId: event.farmerId,
          type: NotificationType.PAYMENT_PROCESSED,
          title: 'DBT Payment Processing',
          titleHi: 'डीबीटी भुगतान प्रक्रियाधीन',
          message: `Your Direct Benefit Transfer payment of ₹${event.netAmount.toLocaleString('en-IN')} is being processed via PFMS/NPCI.${event.dbtReferenceId ? ` Ref: ${event.dbtReferenceId}` : ''}`,
          messageHi: `आपका ₹${event.netAmount.toLocaleString('en-IN')} का डीबीटी भुगतान PFMS/NPCI के माध्यम से प्रक्रियाधीन है।${event.dbtReferenceId ? ` संदर्भ: ${event.dbtReferenceId}` : ''}`,
          channels: [NotificationChannelType.IN_APP],
          metadata: {
            paymentId: event.paymentId,
            netAmount: event.netAmount,
            dbtReferenceId: event.dbtReferenceId,
          },
        },
      ];

    case 'PAYMENT_SUCCESS':
      return [
        {
          userId: event.farmerId,
          type: NotificationType.PAYMENT_PROCESSED,
          title: 'DBT Payment Disbursed',
          titleHi: 'डीबीटी भुगतान सफल',
          message: `Your MSP payment of ₹${event.netAmount.toLocaleString('en-IN')} has been disbursed directly to your Aadhaar-linked bank account (UTR: ${event.utr}).`,
          messageHi: `आपका ₹${event.netAmount.toLocaleString('en-IN')} का एमएसपी भुगतान आपके आधार-लिंक्ड बैंक खाते में भेज दिया गया है (UTR: ${event.utr})।`,
          channels: [NotificationChannelType.IN_APP, NotificationChannelType.SMS],
          metadata: {
            paymentId: event.paymentId,
            netAmount: event.netAmount,
            utr: event.utr,
            dbtReferenceId: event.dbtReferenceId,
          },
        },
      ];

    case 'PAYMENT_FAILED':
      return [
        {
          userId: event.farmerId,
          type: NotificationType.PAYMENT_PROCESSED,
          title: 'DBT Payment Alert',
          titleHi: 'डीबीटी भुगतान सूचना',
          message: `DBT payment of ₹${event.netAmount.toLocaleString('en-IN')} could not be completed: ${event.reason}. Officer will review bank details.`,
          messageHi: `₹${event.netAmount.toLocaleString('en-IN')} का डीबीटी भुगतान पूरा नहीं हो सका: ${event.reason}। अधिकारी बैंक विवरण की पुनः समीक्षा करेंगे।`,
          channels: [NotificationChannelType.IN_APP, NotificationChannelType.SMS],
          metadata: {
            paymentId: event.paymentId,
            netAmount: event.netAmount,
            reason: event.reason,
          },
        },
      ];

    case 'PAYMENT_REVERSED':
      return [
        {
          userId: event.farmerId,
          type: NotificationType.PAYMENT_PROCESSED,
          title: 'DBT Payment Reversed',
          titleHi: 'डीबीटी भुगतान वापस लिया गया',
          message: `DBT payment of ₹${event.netAmount.toLocaleString('en-IN')} has been reversed: ${event.reason}. Mandi authority will follow up.`,
          messageHi: `₹${event.netAmount.toLocaleString('en-IN')} का डीबीटी भुगतान वापस लिया गया: ${event.reason}। मंडी प्राधिकरण आगे की कार्रवाई करेगा।`,
          channels: [NotificationChannelType.IN_APP, NotificationChannelType.SMS],
          metadata: {
            paymentId: event.paymentId,
            netAmount: event.netAmount,
            reason: event.reason,
          },
        },
      ];

    case 'QUEUE_UPDATED': {
      const recipientIds = event.affectedFarmerIds || [];
      return recipientIds.map(userId => ({
        userId,
        type: NotificationType.QUEUE_DELAY,
        title: 'Mandi Queue Update',
        titleHi: 'मंडी कतार अद्यतन',
        message: `Queue update at ${event.centreName}${event.reason ? `: ${event.reason}` : ''}. Please monitor your live position on KisanSetu.`,
        messageHi: `${event.centreName} पर कतार अद्यतन${event.reason ? `: ${event.reason}` : ''}। कृपया किसानसेतु पर अपनी लाइव स्थिति देखें।`,
        channels: [NotificationChannelType.IN_APP],
        metadata: {
          centreId: event.centreId,
          reason: event.reason,
        },
      }));
    }

    default:
      return [];
  }
}
