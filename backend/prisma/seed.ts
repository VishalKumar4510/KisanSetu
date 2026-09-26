import { initializeDatabase, prisma, pool } from '../src/lib/prisma';
import { stopLocalPostgres } from '../src/lib/dbServer';
import {
  seedUsers,
  seedFarmers,
  seedCentres,
  seedSlots,
  seedTokens,
  seedProduce,
  seedProcurements,
  seedWeighings,
  seedQualityChecks,
  seedPayments,
  seedNotifications,
  seedAuditLogs,
} from '../src/data/seedData';
import { UserRole } from '../../shared/types';

export async function seedDatabase(): Promise<void> {
  console.log('--- SEEDING POSTGRESQL DATABASE ---');
  await initializeDatabase();

  // 1. Clear existing data in reverse foreign key order
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      audit_logs, 
      notifications, 
      payments, 
      quality_checks, 
      weighings, 
      procurements, 
      produces, 
      tokens, 
      slots, 
      centres, 
      farmers, 
      users 
    CASCADE;
  `);

  // 2. Insert Admin and Officer Users
  for (const u of seedUsers) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        phone: u.phone,
        password: u.password || '',
        role: u.role as any,
        aadhaar: u.aadhaar || null,
        language: u.language,
        createdAt: new Date(u.createdAt),
      },
    });
  }

  // 3. Insert Farmers and their corresponding User accounts
  for (const f of seedFarmers) {
    // Create base user record for farmer
    await prisma.user.create({
      data: {
        id: f.id,
        name: f.name,
        phone: f.phone,
        password: f.password || '',
        role: UserRole.FARMER as any,
        aadhaar: f.aadhaar || null,
        language: f.language,
        createdAt: new Date(f.createdAt),
      },
    });

    // Create farmer profile record
    await prisma.farmer.create({
      data: {
        id: f.id,
        farmerId: f.farmerId,
        userId: f.id,
        village: f.village,
        district: f.district,
        state: f.state,
        landArea: f.landArea,
        crops: f.crops as string[],
        bankAccount: f.bankAccount || null,
        ifsc: f.ifsc || null,
        bankName: f.bankName || null,
        bankVerificationStatus: f.bankVerificationStatus || 'VERIFIED',
        createdAt: new Date(f.createdAt),
      },
    });
  }

  // 4. Insert Centres
  for (const c of seedCentres) {
    await prisma.centre.create({
      data: {
        id: c.id,
        name: c.name,
        location: c.location,
        district: c.district,
        state: c.state,
        capacity: c.capacity,
        activeBays: c.activeBays,
        totalBays: c.totalBays,
        operatingHoursStart: c.operatingHours.start,
        operatingHoursEnd: c.operatingHours.end,
        status: c.status,
        congestionLevel: c.congestionLevel as any,
        contactPhone: c.contactPhone,
      },
    });
  }

  // 5. Insert Slots
  for (const s of seedSlots) {
    await prisma.slot.create({
      data: {
        id: s.id,
        centreId: s.centreId,
        date: s.date,
        timeStart: s.timeStart,
        timeEnd: s.timeEnd,
        maxCapacity: s.maxCapacity,
        currentBookings: s.currentBookings,
        status: s.status,
      },
    });
  }

  // 6. Insert Tokens
  for (const t of seedTokens) {
    await prisma.token.create({
      data: {
        id: t.id,
        farmerId: t.farmerId,
        slotId: t.slotId,
        centreId: t.centreId,
        tokenNumber: t.tokenNumber,
        qrData: t.qrData,
        status: t.status as any,
        queuePosition: t.queuePosition,
        estimatedTime: t.estimatedTime,
        createdAt: new Date(t.createdAt),
      },
    });
  }

  // 7. Insert Produces
  for (const p of seedProduce) {
    await prisma.produce.create({
      data: {
        id: p.id,
        farmerId: p.farmerId,
        type: p.type as any,
        quantity: p.quantity,
        unit: p.unit,
        grade: p.grade || null,
        mspRate: p.mspRate,
      },
    });
  }

  // 8. Insert Procurements
  for (const pr of seedProcurements) {
    await prisma.procurement.create({
      data: {
        id: pr.id,
        farmerId: pr.farmerId,
        centreId: pr.centreId,
        tokenId: pr.tokenId,
        produceId: pr.produceId,
        status: pr.status as any,
        bookedAt: pr.bookedAt ? new Date(pr.bookedAt) : new Date(),
        calledAt: pr.calledAt ? new Date(pr.calledAt) : null,
        arrivedAt: pr.arrivedAt ? new Date(pr.arrivedAt) : null,
        gateEntryAt: pr.gateEntryAt ? new Date(pr.gateEntryAt) : null,
        weighingAt: pr.weighingAt ? new Date(pr.weighingAt) : null,
        qualityCheckAt: pr.qualityCheckAt ? new Date(pr.qualityCheckAt) : null,
        procurementAt: pr.procurementAt ? new Date(pr.procurementAt) : null,
        paymentPendingAt: pr.paymentPendingAt ? new Date(pr.paymentPendingAt) : null,
        paymentProcessingAt: pr.paymentProcessingAt ? new Date(pr.paymentProcessingAt) : null,
        completedAt: pr.completedAt ? new Date(pr.completedAt) : null,
        rejectedAt: pr.rejectedAt ? new Date(pr.rejectedAt) : null,
        rejectionReason: pr.rejectionReason || null,
        scaleId: pr.scaleId || null,
        calculatedBaseRate: pr.calculatedBaseRate || null,
        calculatedAdjustment: pr.calculatedAdjustment || null,
        calculatedGrossAmount: pr.calculatedGrossAmount || null,
        calculatedDeductions: pr.calculatedDeductions || null,
        calculatedNetAmount: pr.calculatedNetAmount || null,
        timeline: pr.timeline ? (pr.timeline as any) : [],
      },
    });
  }

  // 9. Insert Weighings
  for (const w of seedWeighings) {
    await prisma.weighing.create({
      data: {
        id: w.id,
        procurementId: w.procurementId,
        grossWeight: w.grossWeight,
        tareWeight: w.tareWeight,
        netWeight: w.netWeight,
        scaleId: w.scaleId || null,
        timestamp: new Date(w.timestamp),
      },
    });
  }

  // 10. Insert Quality Checks
  for (const q of seedQualityChecks) {
    await prisma.qualityCheck.create({
      data: {
        id: q.id,
        procurementId: q.procurementId,
        crop: q.crop || null,
        moistureContent: q.moistureContent,
        foreignMatter: q.foreignMatter,
        damagedGrains: q.damagedGrains || null,
        grade: q.grade,
        qualityResult: q.qualityResult || 'ACCEPTED',
        accepted: q.accepted,
        remarks: q.remarks || '',
        timestamp: new Date(q.timestamp),
      },
    });
  }

  // 11. Insert Payments
  for (const pay of seedPayments) {
    await prisma.payment.create({
      data: {
        id: pay.id,
        procurementId: pay.procurementId,
        farmerId: pay.farmerId,
        bookingId: pay.bookingId || null,
        grossAmount: pay.grossAmount,
        deductions: pay.deductions,
        netAmount: pay.netAmount,
        status: pay.status as any,
        paymentMethod: pay.paymentMethod || 'DBT (Direct Benefit Transfer)',
        transactionId: pay.transactionId || null,
        utr: pay.utr || null,
        dbtReferenceId: pay.dbtReferenceId || null,
        initiatedAt: pay.initiatedAt ? new Date(pay.initiatedAt) : null,
        completedAt: pay.completedAt ? new Date(pay.completedAt) : null,
        processedAt: pay.processedAt ? new Date(pay.processedAt) : null,
        failureReason: pay.failureReason || null,
        createdAt: new Date(pay.createdAt),
      },
    });
  }

  // 12. Insert Notifications
  for (const n of seedNotifications) {
    await prisma.notification.create({
      data: {
        id: n.id,
        userId: n.userId,
        type: n.type as any,
        title: n.title,
        titleHi: n.titleHi,
        message: n.message,
        messageHi: n.messageHi,
        read: n.read,
        createdAt: new Date(n.createdAt),
      },
    });
  }

  // 13. Insert Audit Logs
  for (const a of seedAuditLogs) {
    await prisma.auditLog.create({
      data: {
        id: a.id,
        userId: a.userId,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        details: a.details,
        timestamp: new Date(a.timestamp),
      },
    });
  }

  console.log('✅ PostgreSQL Database successfully seeded with all KisanSetu entities!');
}

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await pool.end();
      await stopLocalPostgres();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seeding failed:', err);
      await pool.end();
      await stopLocalPostgres();
      process.exit(1);
    });
}
