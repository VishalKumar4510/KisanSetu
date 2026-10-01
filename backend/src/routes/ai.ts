import { Router } from 'express';
import store from '../data/store';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { PaymentStatus, MSP_RATES, ProduceType } from '../../../shared/types';

const router = Router();

// POST /api/ai/query
router.post('/query', optionalAuth, asyncHandler(async (req, res) => {
  const { query, farmerId } = req.body;
  if (!query) return res.status(400).json({ success: false, error: 'Query required' });

  const q = query.toLowerCase();
  let answer = '';
  let answerHi = '';
  let data: any = null;

  if (q.includes('msp') || q.includes('एमएसपी') || q.includes('rate') || q.includes('भाव') || q.includes('मूल्य')) {
    answer = `Today's MSP Rates per Quintal: Wheat: ₹${MSP_RATES[ProduceType.WHEAT]}, Paddy: ₹${MSP_RATES[ProduceType.PADDY]}, Maize: ₹${MSP_RATES[ProduceType.MAIZE]}, Pulses: ₹${MSP_RATES[ProduceType.PULSES]}, Onion: ₹${MSP_RATES[ProduceType.ONION]}.`;
    answerHi = `आज का न्यूनतम समर्थन मूल्य (एमएसपी) प्रति क्विंटल: गेहूं: ₹${MSP_RATES[ProduceType.WHEAT]}, धान: ₹${MSP_RATES[ProduceType.PADDY]}, मक्का: ₹${MSP_RATES[ProduceType.MAIZE]}, दालें: ₹${MSP_RATES[ProduceType.PULSES]}, प्याज: ₹${MSP_RATES[ProduceType.ONION]}।`;
    data = { mspRates: MSP_RATES };
  }
  else if (q.includes('longest queue') || q.includes('सबसे लंबी कतार')) {
    const centres = store.getAllCentres();
    let maxQueue = 0, maxCentre = centres[0];
    centres.forEach(c => {
      const len = store.getQueueByCentre(c.id).length;
      if (len > maxQueue) { maxQueue = len; maxCentre = c; }
    });
    answer = `${maxCentre.name} has the longest queue with ${maxQueue} farmers waiting.`;
    answerHi = `${maxCentre.name} में सबसे लंबी कतार है, ${maxQueue} किसान प्रतीक्षा में हैं।`;
    data = { centreId: maxCentre.id, queueLength: maxQueue };
  }
  else if (q.includes('earliest') || q.includes('पहला स्लॉट') || q.includes('सबसे पहला')) {
    const slots = store.getAvailableSlots();
    if (slots.length > 0) {
      const earliest = slots.sort((a, b) => `${a.date}${a.timeStart}`.localeCompare(`${b.date}${b.timeStart}`))[0];
      const centre = store.getCentreById(earliest.centreId);
      answer = `Earliest available slot is at ${centre?.name} on ${earliest.date} at ${earliest.timeStart}.`;
      answerHi = `सबसे पहला स्लॉट ${centre?.name} में ${earliest.date} को ${earliest.timeStart} पर उपलब्ध है।`;
      data = earliest;
    } else {
      answer = 'No slots are currently available.';
      answerHi = 'वर्तमान में कोई स्लॉट उपलब्ध नहीं है।';
    }
  }
  else if (q.includes('token') || q.includes('टोकन')) {
    const fId = farmerId || req.user?.id;
    if (fId) {
      const token = store.getActiveTokenByFarmer(fId);
      if (token) {
        answer = `Your token ${token.tokenNumber} is ${token.status}. Queue position: ${token.queuePosition}.`;
        answerHi = `आपका टोकन ${token.tokenNumber} ${token.status} है। कतार स्थिति: ${token.queuePosition}।`;
        data = token;
      } else {
        answer = 'You don\'t have an active token. Book a slot first.';
        answerHi = 'आपके पास कोई सक्रिय टोकन नहीं है। पहले स्लॉट बुक करें।';
      }
    } else {
      answer = 'Please log in as a farmer to view your token status.';
      answerHi = 'कृपया अपने टोकन की स्थिति देखने के लिए किसान के रूप में लॉगिन करें।';
    }
  }
  else if (q.includes('lowest waiting') || q.includes('shortest wait') || q.includes('least wait') || q.includes('कम प्रतीक्षा')) {
    const centres = store.getAllCentres();
    let minWait = Infinity, minCentre = centres[0];
    centres.forEach(c => {
      const queue = store.getQueueByCentre(c.id);
      const wait = queue.length > 0 ? Math.round(queue.length * 15 / Math.max(c.activeBays, 1)) : 0;
      if (wait < minWait) { minWait = wait; minCentre = c; }
    });
    answer = `${minCentre.name} has the lowest waiting time of approximately ${minWait} minutes.`;
    answerHi = `${minCentre.name} में सबसे कम प्रतीक्षा समय है, लगभग ${minWait} मिनट।`;
    data = { centreId: minCentre.id, waitTime: minWait };
  }
  else if (q.includes('how many') || q.includes('waiting') || q.includes('कितने किसान') || q.includes('प्रतीक्षा')) {
    const count = store.getActiveQueueCount();
    answer = `Currently ${count} farmers are waiting in queue across all centres.`;
    answerHi = `वर्तमान में सभी केंद्रों पर ${count} किसान कतार में प्रतीक्षा कर रहे हैं।`;
    data = { totalWaiting: count };
  }
  else if (q.includes('payment') || q.includes('भुगतान')) {
    const fId = farmerId || req.user?.id;
    if (fId) {
      const payment = store.getCurrentPayment(fId);
      if (payment) {
        answer = `Your payment of ₹${payment.netAmount.toLocaleString()} is ${payment.status}.${payment.dbtReferenceId ? ` DBT Ref: ${payment.dbtReferenceId}` : ''}`;
        answerHi = `आपका भुगतान ₹${payment.netAmount.toLocaleString()} ${payment.status} है।${payment.dbtReferenceId ? ` DBT संदर्भ: ${payment.dbtReferenceId}` : ''}`;
        data = payment;
      } else {
        answer = 'No payment records found for you.';
        answerHi = 'आपके लिए कोई भुगतान रिकॉर्ड नहीं मिला।';
      }
    } else {
      answer = 'Please log in as a farmer to check your payment status.';
      answerHi = 'कृपया अपने भुगतान की स्थिति देखने के लिए किसान के रूप में लॉगिन करें।';
    }
  }
  else {
    const kpis = {
      farmers: store.getAllFarmers().length,
      activeQueue: store.getActiveQueueCount(),
      completed: store.getCompletedToday().length,
      payments: store.getAllPayments().filter(p => p.status === PaymentStatus.COMPLETED).length,
    };
    answer = `KisanSetu Summary: ${kpis.farmers} farmers registered, ${kpis.activeQueue} in queue, ${kpis.completed} completed today, ${kpis.payments} payments processed. Try asking: "Which centre has the longest queue?" or "Where is the earliest slot?"`;
    answerHi = `किसानसेतु सारांश: ${kpis.farmers} किसान पंजीकृत, ${kpis.activeQueue} कतार में, ${kpis.completed} आज पूर्ण, ${kpis.payments} भुगतान प्रसंस्कृत। पूछें: "किस केंद्र में सबसे लंबी कतार है?" या "सबसे पहला स्लॉट कहाँ है?"`;
    data = kpis;
  }

  return res.json({ success: true, data: { answer, answerHi, data } });
}));

export default router;
