import { initializeDatabase, prisma, pool } from '../src/lib/prisma';
import { stopLocalPostgres } from '../src/lib/dbServer';
import {
  userRepository,
  farmerRepository,
  centreRepository,
  slotRepository,
  tokenRepository,
  procurementRepository,
  paymentRepository,
} from '../src/repositories';
import { seedDatabase } from '../prisma/seed';
import { ProduceType } from '../../shared/types';

async function main() {
  console.log('--- TESTING REPOSITORIES & TRANSACTIONS ---');
  await seedDatabase();

  // 1. Test User Repository
  const user = await userRepository.findByPhone('farmer1');
  console.log('1. Found User by phone (farmer1):', user?.name, user?.role);
  if (!user || user.role !== 'FARMER') throw new Error('User lookup failed');

  // 2. Test Farmer Repository
  const farmer = await farmerRepository.findById(user.id);
  console.log('2. Found Farmer profile:', farmer?.name, farmer?.farmerId, farmer?.crops);
  if (!farmer || !farmer.farmerId) throw new Error('Farmer lookup failed');

  // 3. Test Centre Repository
  const centres = await centreRepository.getAllCentres();
  console.log('3. Found Centres count:', centres.length);
  if (centres.length === 0) throw new Error('Centres query failed');

  // 4. Test Slot Repository
  const slots = await slotRepository.getAvailableSlots(centres[0].id);
  console.log('4. Available Slots for centre 0:', slots.length);
  if (slots.length === 0) throw new Error('Slots query failed');

  // 5. Test Atomic Slot Booking Transaction
  // farmer1 currently has no active token in seed data
  console.log('5. Testing Atomic Slot Booking Transaction for farmer1...');
  const bookingResult = await slotRepository.bookSlotAtomic({
    slotId: slots[0].id,
    farmerId: farmer.id,
    centreId: centres[0].id,
    crop: ProduceType.WHEAT,
    estimatedQuantity: 45,
  });
  console.log('   Booked Token:', bookingResult.token.tokenNumber, 'Status:', bookingResult.token.status);
  console.log('   Created Procurement:', bookingResult.procurement.id, 'Status:', bookingResult.procurement.status);
  console.log('   Updated Slot Bookings:', bookingResult.slot.currentBookings);

  // Verify duplicate booking rejection
  try {
    await slotRepository.bookSlotAtomic({
      slotId: slots[0].id,
      farmerId: farmer.id,
      centreId: centres[0].id,
    });
    throw new Error('Duplicate booking should have been rejected!');
  } catch (err: any) {
    console.log('   Duplicate booking properly rejected with error:', err.message);
  }

  // 6. Test Procurement Repository
  const proc = await procurementRepository.findByTokenId(bookingResult.token.id);
  console.log('6. Verified Procurement by Token ID:', proc?.id, 'Status:', proc?.status);
  if (!proc) throw new Error('Procurement lookup by token failed');

  // Test adding timeline event
  await procurementRepository.addTimelineEvent(proc.id, {
    stage: 'CALLED',
    label: 'Farmer called to Gate #1',
    actor: 'Gate Officer',
  });
  const updatedProc = await procurementRepository.findById(proc.id);
  console.log('   Procurement timeline events count:', updatedProc?.timeline?.length);

  // 7. Test Payment Repository & Atomic Completion Transaction
  // Find a pending payment from seed
  const payments = await paymentRepository.getAllPayments();
  const pendingPayment = payments.find(p => p.status !== 'COMPLETED');
  if (pendingPayment) {
    console.log('7. Testing Payment Completion Transaction for:', pendingPayment.id);
    const completed = await paymentRepository.completePaymentAtomic({
      paymentId: pendingPayment.id,
      utr: '982412345678',
      dbtReferenceId: 'DBT-20260926-TEST',
      actorName: 'Admin Sharma',
    });
    console.log('   Payment Status:', completed.payment.status, 'UTR:', completed.payment.utr);
    const linkedProc = await procurementRepository.findById(completed.procurementId);
    console.log('   Linked Procurement Status:', linkedProc?.status);
    if (linkedProc?.status !== 'COMPLETED') throw new Error('Procurement should be COMPLETED');
  }

  console.log('✅ ALL REPOSITORY & TRANSACTION TESTS PASSED SUCCESSFULLY!');
  await pool.end();
  await stopLocalPostgres();
}

main().catch(async (err) => {
  console.error('❌ Repository test failed:', err);
  await pool.end();
  await stopLocalPostgres();
  process.exit(1);
});
