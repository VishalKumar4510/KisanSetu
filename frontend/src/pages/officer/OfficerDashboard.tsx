import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { officerAPI, centreAPI } from '../../services/api';
import { downloadReceiptPdf } from '../../utils/generateReceiptPdf';
import { formatCurrency } from '../../utils/formatters';
import {
  Sprout,
  Shield,
  History,
  BarChart2,
  FileText,
  Activity,
  CheckCircle2,
  ChevronRight,
  Download,
  Phone,
  Scale,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

import { OfficerHeader, AlertItem } from './components/OfficerHeader';
import { OperationsNav } from './components/OperationsNav';
import { MetricsPanel, OfficerStats } from './components/MetricsPanel';
import { LiveQueuePanel, QueueRow } from './components/LiveQueuePanel';
import { CurrentFarmerHeader } from './components/CurrentFarmerHeader';
import { WorkflowStepper } from './components/WorkflowStepper';
import { WeighmentStep, ScaleItem } from './components/WeighmentStep';
import { QualityStep } from './components/QualityStep';
import { ProcurementStep } from './components/ProcurementStep';
import { PaymentStep } from './components/PaymentStep';
import { PaymentHistory } from './components/PaymentHistory';
import { FarmerHistory } from './components/FarmerHistory';
import { AlertsPanel } from './components/AlertsPanel';
import { EquipmentPanel } from './components/EquipmentPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { SettlementPanel } from './components/SettlementPanel';
import { AuditTimeline } from './components/AuditTimeline';
import { ReceiptModal } from './components/ReceiptModal';

export default function OfficerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Core State
  const [centres, setCentres] = useState<any[]>([]);
  const [selectedCentre, setSelectedCentre] = useState('');
  const [stats, setStats] = useState<OfficerStats | null>(null);
  const [queueList, setQueueList] = useState<QueueRow[]>([]);
  const [currentFarmerData, setCurrentFarmerData] = useState<any>(null);
  const [scales, setScales] = useState<ScaleItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [settlementData, setSettlementData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState(new Date().toLocaleTimeString('en-IN'));
  const [showCallConfirmModal, setShowCallConfirmModal] = useState(false);
  const [pendingCallTokenId, setPendingCallTokenId] = useState<string | undefined>(undefined);

  // Top Metrics Expandable Toggle
  const [showMoreMetrics, setShowMoreMetrics] = useState(false);

  // Active Workflow Stepper: Steps 1 to 7
  const [userSelectedStep, setUserSelectedStep] = useState<number | null>(null);

  // Queue Filter, Search & Sort
  const [queueSearch, setQueueSearch] = useState('');
  const [queueFilter, setQueueFilter] = useState<string>('ALL');
  const [queueSort, setQueueSort] = useState<'position' | 'arrival' | 'name'>('position');

  // Lower Section Active Tab
  const [activeLowerTab, setActiveLowerTab] = useState<'reconciliation' | 'history' | 'analytics' | 'settlement' | 'timeline'>('reconciliation');
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Timeline Expand Toggle
  const [showFullTimeline, setShowFullTimeline] = useState(false);

  // Selected Farmer for History Panel
  const [historyFarmerId, setHistoryFarmerId] = useState<string | null>(null);
  const [farmerHistoryData, setFarmerHistoryData] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Weighment form
  const [weighingForm, setWeighingForm] = useState({
    grossWeight: '25.50',
    tareWeight: '0.50',
    scaleId: 'scale-wb-01',
  });

  // Quality assessment form
  const [qualityForm, setQualityForm] = useState({
    crop: 'WHEAT',
    moistureContent: '11.4',
    foreignMatter: '0.35',
    damagedGrains: '0.80',
    grade: 'A',
    qualityResult: 'ACCEPTED' as 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW',
    remarks: 'Produce meets FAQ standard specifications.',
  });

  // Procurement calculation state
  const [calculationData, setCalculationData] = useState<any>(null);

  // Payment Review Modal & Processing simulation state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<number>(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Digital Receipt Modal & PDF Download state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Settlement Daily Report Modal
  const [showDailyReportModal, setShowDailyReportModal] = useState(false);

  // Live Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial Load of Centres
  useEffect(() => {
    centreAPI.getAll().then((res) => {
      const c = res.data.data || [];
      setCentres(c);
      if (c.length > 0) {
        setSelectedCentre(c[0].id);
      }
    });
  }, []);

  // Fetch Centre Data
  const fetchDashboardData = useCallback(async (isPolling = false) => {
    if (!selectedCentre) return;
    if (!isPolling) setRefreshing(true);

    try {
      const [statsRes, currentRes, queueRes, paymentsRes, alertsRes, scalesRes, settlementRes] = await Promise.all([
        officerAPI.getStats(selectedCentre),
        officerAPI.getCurrentFarmer(selectedCentre),
        officerAPI.getQueue(selectedCentre),
        officerAPI.getPayments(selectedCentre, paymentFilter),
        officerAPI.getAlerts(selectedCentre),
        officerAPI.getScales(selectedCentre),
        officerAPI.getSettlement(selectedCentre),
      ]);

      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
        setIsQueuePaused(Boolean(statsRes.data.data.isQueuePaused));
      }
      if (queueRes.data?.data?.items) {
        setQueueList(queueRes.data.data.items);
        if (queueRes.data.data.isQueuePaused !== undefined) {
          setIsQueuePaused(queueRes.data.data.isQueuePaused);
        }
      }
      if (paymentsRes.data?.data) setPaymentHistory(paymentsRes.data.data);
      if (alertsRes.data?.data) {
        setAlerts(alertsRes.data.data.alerts || []);
        setUnreadAlertsCount(alertsRes.data.data.unreadCount || 0);
      }
      if (scalesRes.data?.data) setScales(scalesRes.data.data || []);
      if (settlementRes.data?.data) setSettlementData(settlementRes.data.data);

      const activeFarmer = currentRes.data?.data;
      setCurrentFarmerData(activeFarmer);

      // Pre-fill forms if active farmer exists
      if (activeFarmer) {
        if (activeFarmer.weighing) {
          setWeighingForm({
            grossWeight: String(activeFarmer.weighing.grossWeight || ''),
            tareWeight: String(activeFarmer.weighing.tareWeight || '0.50'),
            scaleId: activeFarmer.weighing.scaleId || 'scale-wb-01',
          });
        }
        if (activeFarmer.quality) {
          setQualityForm({
            crop: activeFarmer.produce?.type || activeFarmer.quality.crop || 'WHEAT',
            moistureContent: String(activeFarmer.quality.moistureContent || '11.4'),
            foreignMatter: String(activeFarmer.quality.foreignMatter || '0.35'),
            damagedGrains: String(activeFarmer.quality.damagedGrains || '0.80'),
            grade: activeFarmer.quality.grade || 'A',
            qualityResult: activeFarmer.quality.qualityResult || 'ACCEPTED',
            remarks: activeFarmer.quality.remarks || 'Produce meets FAQ standard specifications.',
          });
        }
        if (activeFarmer.procurement?.calculatedNetAmount) {
          setCalculationData({
            netQuantity: activeFarmer.weighing?.netWeight || 20,
            baseRate: activeFarmer.procurement.calculatedBaseRate || 2275,
            qualityAdjustment: activeFarmer.procurement.calculatedAdjustment || 0,
            finalRate: (activeFarmer.procurement.calculatedBaseRate || 2275) + (activeFarmer.procurement.calculatedAdjustment || 0),
            grossAmount: activeFarmer.procurement.calculatedGrossAmount || 0,
            deductions: activeFarmer.procurement.calculatedDeductions || 0,
            finalPayableAmount: activeFarmer.procurement.calculatedNetAmount,
          });
        }
      } else {
        setCalculationData(null);
      }
    } catch (err) {
      console.error('Failed to load officer dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCentre, paymentFilter]);

  // Polling every 12s
  useEffect(() => {
    if (!selectedCentre) return;
    fetchDashboardData(false);
    const interval = setInterval(() => fetchDashboardData(true), 12000);
    return () => clearInterval(interval);
  }, [selectedCentre, fetchDashboardData]);

  // Load Farmer History when historyFarmerId changes
  useEffect(() => {
    if (!historyFarmerId) return;
    setLoadingHistory(true);
    officerAPI
      .getFarmerHistory(historyFarmerId)
      .then((res) => {
        if (res.data?.data) setFarmerHistoryData(res.data.data);
      })
      .catch((err) => console.error('Failed to load farmer history:', err))
      .finally(() => setLoadingHistory(false));
  }, [historyFarmerId]);

  // Queue Pause / Resume Handlers
  const handlePauseQueue = async () => {
    if (!selectedCentre) return;
    try {
      setRefreshing(true);
      await officerAPI.pauseQueue(selectedCentre, 'Operator pause request');
      setIsQueuePaused(true);
      toast.warning('Queue Paused', 'Operational queue has been paused.');
      await fetchDashboardData(false);
    } catch (err: any) {
      toast.error('Queue Pause Failed', err.response?.data?.error || 'Failed to pause queue');
    } finally {
      setRefreshing(false);
    }
  };

  const handleResumeQueue = async () => {
    if (!selectedCentre) return;
    try {
      setRefreshing(true);
      await officerAPI.resumeQueue(selectedCentre);
      setIsQueuePaused(false);
      toast.success('Queue Resumed', 'Operational queue is active and processing.');
      await fetchDashboardData(false);
    } catch (err: any) {
      toast.error('Queue Resume Failed', err.response?.data?.error || 'Failed to resume queue');
    } finally {
      setRefreshing(false);
    }
  };

  // Mark Alert Read
  const handleMarkAlertRead = async (id: string) => {
    try {
      await officerAPI.markAlertRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
      setUnreadAlertsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  // Toggle Scale Status
  const handleToggleScaleStatus = async (scaleId: string, currentScaleStatus: string) => {
    const cycle: Record<string, 'ONLINE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE'> = {
      ONLINE: 'BUSY',
      BUSY: 'OFFLINE',
      OFFLINE: 'MAINTENANCE',
      MAINTENANCE: 'ONLINE',
    };
    const nextStatus = cycle[currentScaleStatus] || 'ONLINE';
    try {
      await officerAPI.updateScale(scaleId, nextStatus);
      setScales((prev) => prev.map((s) => (s.id === scaleId ? { ...s, status: nextStatus } : s)));
    } catch (err) {
      console.error('Failed to update scale status:', err);
    }
  };

  // Filtered & Sorted Queue
  const filteredQueue = useMemo(() => {
    let list = [...queueList];

    if (queueFilter !== 'ALL') {
      list = list.filter((item) => {
        if (queueFilter === 'WAITING') return item.status === 'WAITING' || item.status === 'BOOKED';
        return item.status === queueFilter;
      });
    }

    if (queueSearch.trim()) {
      const q = queueSearch.toLowerCase();
      list = list.filter(
        (i) =>
          i.farmerName.toLowerCase().includes(q) ||
          i.farmerId.toLowerCase().includes(q) ||
          i.tokenNumber.toLowerCase().includes(q)
      );
    }

    if (queueSort === 'arrival') {
      list.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));
    } else if (queueSort === 'name') {
      list.sort((a, b) => a.farmerName.localeCompare(b.farmerName));
    } else {
      list.sort((a, b) => a.position - b.position);
    }

    return list;
  }, [queueList, queueFilter, queueSearch, queueSort]);

  // Derive Current Step and Status
  const currentProc = currentFarmerData?.procurement;
  const currentStatus = currentProc?.status || (currentFarmerData ? 'CALLED' : 'IDLE');

  const inProgressCount = useMemo(() => {
    return queueList.filter((q) =>
      ['CALLED', 'GATE_ENTRY', 'ARRIVED', 'WEIGHING', 'QUALITY_CHECK', 'PROCUREMENT', 'PAYMENT_PENDING', 'PAYMENT_PROCESSING'].includes(
        q.status
      )
    ).length;
  }, [queueList]);

  const deriveActiveStep = (): number => {
    if (!currentFarmerData) return 1;
    if (currentStatus === 'CALLED' || currentStatus === 'ARRIVED' || currentStatus === 'GATE_ENTRY') return 1;
    if (currentStatus === 'WEIGHING') return 2;
    if (currentStatus === 'QUALITY_CHECK') return 3;
    if (currentStatus === 'PROCUREMENT') return 4;
    if (currentStatus === 'PAYMENT_PENDING') return 5;
    if (currentStatus === 'PAYMENT_PROCESSING') return 6;
    if (currentStatus === 'COMPLETED') return 7;
    return 1;
  };

  const naturalStep = deriveActiveStep();
  const activeStep = userSelectedStep !== null ? userSelectedStep : naturalStep;

  const isStepCompleted = (stepNum: number): boolean => {
    if (!currentFarmerData) return false;
    if (stepNum === 1) return Boolean(currentFarmerData);
    if (stepNum === 2) return Boolean(currentFarmerData.weighing);
    if (stepNum === 3) return Boolean(currentFarmerData.quality);
    if (stepNum === 4) return Boolean(calculationData || (currentProc?.calculatedNetAmount && currentProc.calculatedNetAmount > 0));
    if (stepNum === 5) return currentStatus === 'PAYMENT_PROCESSING' || currentStatus === 'COMPLETED';
    if (stepNum === 6) return currentStatus === 'COMPLETED' || paymentStep === 5;
    if (stepNum === 7) return currentStatus === 'COMPLETED';
    return false;
  };

  const canOpenStep = (stepNum: number): boolean => {
    if (stepNum === 1) return true;
    if (stepNum === 2) return Boolean(currentFarmerData);
    if (stepNum === 3) return Boolean(currentFarmerData?.weighing);
    if (stepNum === 4) return Boolean(currentFarmerData?.quality && currentFarmerData.quality.accepted);
    if (stepNum === 5) return Boolean(calculationData || currentProc?.calculatedNetAmount);
    if (stepNum === 6) return Boolean(currentFarmerData?.payment || currentStatus === 'PAYMENT_PROCESSING' || currentStatus === 'COMPLETED');
    if (stepNum === 7) return currentStatus === 'COMPLETED';
    return false;
  };

  // Workflow Handlers
  const executeCallFarmer = async (tokenId?: string) => {
    if (!selectedCentre) return;
    try {
      setRefreshing(true);
      const res = await officerAPI.callFarmer(selectedCentre, tokenId);
      if (res.data?.data) {
        toast.success('Farmer Called', `Token ${res.data.data.tokenNumber || tokenId || ''} called to station.`);
        setUserSelectedStep(null);
        await fetchDashboardData(false);
      } else {
        toast.info('Queue Notice', res.data?.message || 'Queue is empty or all farmers currently in progress');
      }
    } catch (err: any) {
      toast.error('Call Farmer Failed', err.response?.data?.error || 'Failed to call farmer');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCallFarmer = async (tokenId?: string) => {
    if (!selectedCentre) return;
    if (isQueuePaused) {
      toast.warning('Queue Paused', 'Queue is currently paused. Please resume the queue before calling farmers.');
      return;
    }
    const hasUnfinishedLot =
      currentFarmerData &&
      currentFarmerData.procurement?.status !== 'COMPLETED' &&
      currentFarmerData.procurement?.status !== 'REJECTED';

    if (hasUnfinishedLot) {
      setPendingCallTokenId(tokenId);
      setShowCallConfirmModal(true);
      return;
    }

    executeCallFarmer(tokenId);
  };

  const handleConfirmWeighment = async () => {
    if (!currentFarmerData?.procurement?.id) return;
    const gross = Number(weighingForm.grossWeight);
    const tare = Number(weighingForm.tareWeight);

    if (isNaN(gross) || gross <= 0) {
      toast.warning('Invalid Weight', 'Please enter a valid Gross Weight greater than 0');
      return;
    }
    if (isNaN(tare) || tare < 0) {
      toast.warning('Invalid Weight', 'Tare Weight cannot be negative');
      return;
    }
    if (gross <= tare) {
      toast.warning('Weight Validation', 'Gross Weight must be strictly greater than Tare Weight');
      return;
    }

    try {
      setRefreshing(true);
      await officerAPI.submitWeighment({
        procurementId: currentFarmerData.procurement.id,
        grossWeight: gross,
        tareWeight: tare,
        scaleId: weighingForm.scaleId,
      });
      toast.success('Weighment Recorded', `Gross: ${gross} kg | Net: ${(gross - tare).toFixed(2)} kg`);
      setUserSelectedStep(3); // Advance to Quality Assessment
      await fetchDashboardData(false);
    } catch (err: any) {
      toast.error('Weighment Failed', err.response?.data?.error || 'Weighment submission failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmitQuality = async () => {
    if (!currentFarmerData?.procurement?.id) return;
    try {
      setRefreshing(true);
      await officerAPI.submitQuality({
        procurementId: currentFarmerData.procurement.id,
        crop: qualityForm.crop,
        moistureContent: Number(qualityForm.moistureContent) || 11.4,
        foreignMatter: Number(qualityForm.foreignMatter) || 0.35,
        damagedGrains: Number(qualityForm.damagedGrains) || 0.8,
        grade: qualityForm.grade,
        qualityResult: qualityForm.qualityResult,
        remarks: qualityForm.remarks,
      });
      if (qualityForm.qualityResult === 'ACCEPTED') {
        toast.success('Quality Approved', `Grade ${qualityForm.grade} accepted for procurement.`);
        setUserSelectedStep(4); // Advance to Calculation
      } else {
        toast.warning('Quality Rejected', 'Lot was flagged/rejected based on standards.');
      }
      await fetchDashboardData(false);
    } catch (err: any) {
      toast.error('Quality Assessment Failed', err.response?.data?.error || 'Quality assessment submission failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCalculateProcurement = async () => {
    if (!currentFarmerData?.procurement?.id) return;
    try {
      setRefreshing(true);
      const res = await officerAPI.calculateProcurement(currentFarmerData.procurement.id);
      if (res.data?.data) {
        setCalculationData(res.data.data);
        toast.success('Procurement Calculated', 'MSP and payable amounts verified.');
        setUserSelectedStep(5); // Advance to Payment Review
      }
      await fetchDashboardData(false);
    } catch (err: any) {
      toast.error('Calculation Failed', err.response?.data?.error || 'Procurement calculation failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenReviewModal = async () => {
    if (!currentFarmerData?.procurement?.id) return;
    try {
      const res = await officerAPI.getPaymentReview(currentFarmerData.procurement.id);
      if (res.data?.data) {
        setReviewData(res.data.data);
        setShowReviewModal(true);
      }
    } catch (err: any) {
      toast.error('Review Error', err.response?.data?.error || 'Failed to prepare payment review');
    }
  };

  const handleInitiatePayment = async () => {
    if (!currentFarmerData?.procurement?.id) return;
    try {
      setPaymentProcessing(true);
      setPaymentError(null);
      setPaymentStep(1);
      setUserSelectedStep(6);

      const res = await officerAPI.initiatePayment(currentFarmerData.procurement.id);
      const payment = res.data?.data?.payment;

      if (!payment?.id) throw new Error('Payment initiation failed');

      setTimeout(() => setPaymentStep(2), 500);
      setTimeout(() => setPaymentStep(3), 1000);

      setTimeout(async () => {
        setPaymentStep(4);
        try {
          await officerAPI.processPayment(payment.id, false);
          setTimeout(() => {
            setPaymentStep(5);
            setPaymentProcessing(false);
            setUserSelectedStep(7);
            fetchDashboardData(false);
          }, 800);
        } catch (procErr: any) {
          setPaymentError(procErr.response?.data?.error || 'Bank Gateway Timeout');
          setPaymentProcessing(false);
        }
      }, 1600);
    } catch (err: any) {
      setPaymentError(err.response?.data?.error || 'Failed to initiate payment');
      setPaymentProcessing(false);
    }
  };

  const handleViewReceipt = async (procId?: string) => {
    const id = procId || currentFarmerData?.procurement?.id;
    if (!id) return;
    try {
      const res = await officerAPI.getReceipt(id);
      if (res.data?.data) {
        setReceiptData(res.data.data);
        setShowReceiptModal(true);
      }
    } catch (err: any) {
      toast.error('Receipt Error', err.response?.data?.error || 'Failed to load receipt');
    }
  };

  const handleDownloadPdf = async (target?: string | any) => {
    try {
      setDownloadingPdf(true);
      setDownloadError(null);
      let data = typeof target === 'object' && target !== null ? target : null;
      if (!data) {
        const procId = typeof target === 'string' ? target : (currentFarmerData?.procurement?.id || receiptData?.procurement?.id);
        if (procId) {
          const res = await officerAPI.getReceipt(procId);
          data = res.data?.data;
          setReceiptData(data);
        } else if (receiptData) {
          data = receiptData;
        }
      }
      if (!data) throw new Error('No receipt data available to generate PDF');
      await downloadReceiptPdf(data);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      setDownloadError(err.response?.data?.error || err.message || 'Download failed');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <Sprout className="w-7 h-7 text-white" />
          </div>
          <p className="text-slate-300 font-medium tracking-wide text-sm">
            Loading Operations Console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20 font-sans antialiased">
      {/* 1. HEADER */}
      <OfficerHeader
        centres={centres}
        selectedCentre={selectedCentre}
        setSelectedCentre={setSelectedCentre}
        isQueuePaused={isQueuePaused}
        onPauseQueue={handlePauseQueue}
        onResumeQueue={handleResumeQueue}
        currentTimeStr={currentTimeStr}
        alerts={alerts}
        unreadAlertsCount={unreadAlertsCount}
        showAlertsDropdown={showAlertsDropdown}
        setShowAlertsDropdown={setShowAlertsDropdown}
        onMarkAlertRead={handleMarkAlertRead}
        user={user}
        refreshing={refreshing}
        onRefresh={() => fetchDashboardData(false)}
        logout={logout}
      />

      {/* 2. OFFICER OPERATIONS NAVIGATION */}
      <OperationsNav />

      {/* 3. SUMMARY: 5 PRIMARY METRICS */}
      <MetricsPanel
        stats={stats}
        inProgressCount={inProgressCount}
        showMoreMetrics={showMoreMetrics}
        setShowMoreMetrics={setShowMoreMetrics}
      />

      {/* 4. MAIN OPERATIONAL WORKSPACE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-5">
        {/* STEP A: QUEUE MANAGEMENT CONSOLE */}
        <LiveQueuePanel
          filteredQueue={filteredQueue}
          currentFarmerTokenId={currentFarmerData?.token?.id}
          isQueuePaused={isQueuePaused}
          refreshing={refreshing}
          queueSearch={queueSearch}
          setQueueSearch={setQueueSearch}
          queueFilter={queueFilter}
          setQueueFilter={setQueueFilter}
          queueSort={queueSort}
          setQueueSort={setQueueSort}
          onCallFarmer={handleCallFarmer}
          onResumeQueue={handleResumeQueue}
          onSelectFarmerHistory={(internalId) => {
            setHistoryFarmerId(internalId);
            setActiveLowerTab('history');
          }}
          onNavigateToFullQueue={() => navigate('/officer/queue')}
        />

        {/* STEP B: ACTIVE PROCUREMENT WORKBENCH */}
        <section className="space-y-4" aria-label="Active Procurement Workbench">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* WORKBENCH PROCESSING DESK (2 OF 3 COLS) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                    Active Procurement Workbench
                  </h2>
                </div>
                {currentFarmerData ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Processing Lot #{currentFarmerData.token?.tokenNumber}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    Weighbridge Station Ready
                  </span>
                )}
              </div>

              {/* CURRENT FARMER HEADER */}
              <CurrentFarmerHeader
                currentFarmerData={currentFarmerData}
                currentStatus={currentStatus}
                centres={centres}
                selectedCentre={selectedCentre}
                crop={qualityForm.crop}
                calculationData={calculationData}
                isQueuePaused={isQueuePaused}
                onCallFarmer={() => handleCallFarmer()}
              />

              {/* If an active farmer exists, render stepper and active stage */}
              {currentFarmerData ? (
                <>
                  <WorkflowStepper
                    activeStep={activeStep}
                    userSelectedStep={userSelectedStep}
                    setUserSelectedStep={setUserSelectedStep}
                    isStepCompleted={isStepCompleted}
                    canOpenStep={canOpenStep}
                  />

                  <div className="mt-5">
                    {/* STEP 1: CALLED */}
                    {activeStep === 1 && (
                      <div className="p-5 bg-white border border-slate-200/80 rounded-2xl space-y-4 shadow-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Step 1 — Farmer Bay Entry & Verification
                            </span>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            VERIFIED AT BAY
                          </span>
                        </div>
                        <div className="space-y-3 text-xs">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-slate-600">
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block">Farmer Beneficiary</span>
                              <span className="font-bold text-slate-900 text-xs">{currentFarmerData.farmer?.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono block">ID: {currentFarmerData.farmer?.farmerId}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block">Verified Contact</span>
                              <span className="font-bold text-slate-900 font-mono text-xs">{currentFarmerData.farmer?.phone || 'Verified'}</span>
                              <span className="text-[10px] text-slate-500 block">{currentFarmerData.farmer?.village}, {currentFarmerData.farmer?.district}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block">Declared Commodity</span>
                              <span className="font-bold text-slate-900 text-xs">{currentFarmerData.produce?.type || qualityForm.crop || 'WHEAT'}</span>
                              <span className="text-[10px] text-slate-500 block">Est: {currentFarmerData.produce?.quantity || 20} Qt</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-semibold block">Queue Mandi Token</span>
                              <span className="font-mono font-black text-emerald-800 text-sm">#{currentFarmerData.token?.tokenNumber}</span>
                              <span className="text-[10px] text-slate-500 block">Bay #1 (Calibrated)</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Farmer Present at Weighbridge Bay — Produce inspected for gate pass
                            </span>
                            <button
                              type="button"
                              onClick={() => setUserSelectedStep(2)}
                              className="min-h-10 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                            >
                              <span>Start Weighment</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: WEIGHMENT */}
                    {activeStep === 2 && (
                      <WeighmentStep
                        currentFarmerData={currentFarmerData}
                        weighingForm={weighingForm}
                        setWeighingForm={setWeighingForm}
                        scales={scales}
                        isCompleted={isStepCompleted(2)}
                        refreshing={refreshing}
                        onConfirmWeighment={handleConfirmWeighment}
                        onProceedToQuality={() => setUserSelectedStep(3)}
                      />
                    )}

                    {/* STEP 3: QUALITY */}
                    {activeStep === 3 && (
                      <QualityStep
                        currentFarmerData={currentFarmerData}
                        qualityForm={qualityForm}
                        setQualityForm={setQualityForm}
                        isCompleted={isStepCompleted(3)}
                        refreshing={refreshing}
                        onSubmitQuality={handleSubmitQuality}
                        onProceedToCalculation={() => setUserSelectedStep(4)}
                      />
                    )}

                    {/* STEP 4: CALCULATION */}
                    {activeStep === 4 && (
                      <ProcurementStep
                        calculationData={calculationData}
                        isCompleted={isStepCompleted(4)}
                        refreshing={refreshing}
                        onCalculate={handleCalculateProcurement}
                        onProceedToPayment={() => setUserSelectedStep(5)}
                      />
                    )}

                    {/* STEP 5 or 6: PAYMENT */}
                    {(activeStep === 5 || activeStep === 6) && (
                      <PaymentStep
                        currentFarmerData={currentFarmerData}
                        currentProc={currentProc}
                        calculationData={calculationData}
                        paymentStep={paymentStep}
                        paymentProcessing={paymentProcessing}
                        paymentError={paymentError}
                        activeSubStep={activeStep as 5 | 6}
                        showReviewModal={showReviewModal}
                        reviewData={reviewData}
                        setShowReviewModal={setShowReviewModal}
                        onOpenReviewModal={handleOpenReviewModal}
                        onInitiatePayment={handleInitiatePayment}
                        onProceedToReceipt={() => setUserSelectedStep(7)}
                      />
                    )}

                    {/* STEP 7: RECEIPT */}
                    {activeStep === 7 && (
                      <div className="p-5 bg-white border border-slate-200/80 rounded-2xl space-y-4 shadow-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-700" />
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                              Step 7 — Procurement Receipt & Statutory Settlement
                            </span>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            SETTLED & DISBURSED
                          </span>
                        </div>

                        {/* 6 Core Fields: transaction, UTR, receipt number, farmer, quantity, amount */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                          {/* 1. Receipt Number */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] text-slate-500 font-sans block">Receipt Number</span>
                            <span className="font-bold text-slate-900 block truncate">
                              {receiptData?.receiptNumber || currentFarmerData?.procurement?.receiptNumber || `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(currentFarmerData?.procurement?.id || 'PROC').slice(0, 6).toUpperCase()}`}
                            </span>
                          </div>

                          {/* 2. Transaction Reference */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] text-slate-500 font-sans block">Transaction Reference</span>
                            <span className="font-bold text-slate-900 block truncate">
                              {currentFarmerData?.payment?.transactionId || receiptData?.payment?.transactionId || 'KS-TXN-...'}
                            </span>
                          </div>

                          {/* 3. UTR Reference */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] text-slate-500 font-sans block">Bank UTR Reference</span>
                            <span className="font-bold text-emerald-800 block truncate">
                              {currentFarmerData?.payment?.utr || receiptData?.payment?.utr || '982440385255'}
                            </span>
                          </div>

                          {/* 4. Farmer */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] text-slate-500 font-sans block">Farmer Beneficiary</span>
                            <span className="font-bold text-slate-900 block truncate">
                              {currentFarmerData?.farmer?.name || receiptData?.farmer?.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {currentFarmerData?.farmer?.farmerId || receiptData?.farmer?.farmerId}
                            </span>
                          </div>

                          {/* 5. Quantity */}
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                            <span className="text-[10px] text-slate-500 font-sans block">Net Procured Quantity</span>
                            <span className="font-black text-slate-900 text-sm block">
                              {currentFarmerData?.weighing?.netWeight || currentProc?.netQuantity || calculationData?.netQuantity || receiptData?.procurement?.netQuantity || 0} Qt
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Commodity: {currentFarmerData?.procurement?.crop || qualityForm.crop || 'WHEAT'}
                            </span>
                          </div>

                          {/* 6. Amount */}
                          <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
                            <span className="text-[10px] text-emerald-800 font-sans font-semibold block">Total DBT Disbursed Amount</span>
                            <span className="font-black text-emerald-950 text-base block">
                              {formatCurrency(calculationData?.finalPayableAmount || currentProc?.calculatedNetAmount || currentFarmerData?.payment?.amount || receiptData?.procurement?.finalPayableAmount || 0)}
                            </span>
                            <span className="text-[10px] text-emerald-700 block">
                              Credit: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {downloadSuccess && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>✓ Receipt PDF downloaded successfully</span>
                          </div>
                        )}

                        {downloadError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
                            <span>{downloadError}</span>
                            <button type="button" onClick={() => handleDownloadPdf()} className="text-xs font-bold text-rose-700 underline">
                              Retry
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="min-h-10 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" /> Print Ticket
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewReceipt()}
                            className="min-h-10 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" /> View Digital Receipt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf()}
                            disabled={downloadingPdf}
                            className="min-h-10 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {downloadingPdf ? 'Generating PDF...' : 'Download Official PDF'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-10 px-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Scale className="w-6 h-6 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-slate-800">
                      Weighbridge Station Idle & Calibrated
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No farmer is currently called to the bay. Select a farmer from the queue above or click to call the next waiting lot.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCallFarmer()}
                    disabled={refreshing || isQueuePaused || filteredQueue.length === 0}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Next Farmer
                  </button>
                </div>
              )}
            </div>

            {/* SIDEBAR OPERATIONAL TOOLS: ALERTS + EQUIPMENT + QUICK FARMER (1 OF 3 COLS) */}
            <div className="space-y-4">
              <EquipmentPanel scales={scales} onToggleScaleStatus={handleToggleScaleStatus} />
              <AlertsPanel alerts={alerts} onViewAll={() => setShowAlertsDropdown(true)} />

              {/* Quick Farmer Card */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-600" /> Quick Farmer Summary
                  </span>
                  <button
                    onClick={() => navigate('/officer/farmers')}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Open dedicated Farmer Directory page"
                  >
                    View Directory
                  </button>
                </div>

                {loadingHistory ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Loading profile...</p>
                ) : farmerHistoryData ? (
                  <div className="mt-3 text-xs space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900">{farmerHistoryData.name}</span>
                      <span className="font-mono text-xs text-slate-500">{farmerHistoryData.farmerId}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 text-slate-600">
                      <div>
                        <span className="text-xs text-slate-500 block">Previous Lots:</span>
                        <span className="font-bold text-slate-800">{farmerHistoryData.previousProcurementCount}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Total Quantity:</span>
                        <span className="font-bold text-slate-900">{farmerHistoryData.totalQuantityProcured} Qt</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-slate-500 block">Total Amount Paid:</span>
                        <span className="font-bold text-emerald-800 tabular-nums">
                          {formatCurrency(farmerHistoryData.totalAmountPaid || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">Select any farmer in queue to view past history</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 5. LOWER AREA — OPERATIONAL RECORDS & RECONCILIATION */}
      <section className="max-w-7xl mx-auto px-6 pt-8 pb-12" aria-labelledby="operational-records-title">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h2 id="operational-records-title" className="text-sm font-bold text-slate-900 tracking-tight">
                Operational Records & Reconciliation
              </h2>
              <p className="text-xs text-slate-500">
                Inspect local centre payment reconciliation, past farmer lots, analytics and settlement logs
              </p>
            </div>
          </div>

          {/* Sub-panel Segmented Tab Navigation */}
          <div
            role="tablist"
            aria-label="Operational Records and Audit Modules"
            className="flex items-center gap-1.5 pt-3 pb-3 border-b border-slate-100 overflow-x-auto text-xs"
          >
            {[
              { id: 'reconciliation', label: 'Payments', icon: Shield },
              { id: 'history', label: 'Farmer History', icon: History },
              { id: 'analytics', label: 'Analytics', icon: BarChart2 },
              { id: 'settlement', label: 'Settlement', icon: FileText },
              { id: 'timeline', label: 'Audit', icon: Activity },
            ].map((tab) => {
              const isActive = activeLowerTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-controls={`panel-${tab.id}`}
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveLowerTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 whitespace-nowrap text-xs border focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200/80'
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`panel-${activeLowerTab}`}
            aria-labelledby={`tab-${activeLowerTab}`}
            tabIndex={0}
            className="pt-5 focus:outline-none"
          >
            {/* TAB 1: PAYMENTS */}
            {activeLowerTab === 'reconciliation' && (
              <PaymentHistory
                paymentHistory={paymentHistory}
                paymentFilter={paymentFilter}
                setPaymentFilter={setPaymentFilter}
                onViewReceipt={handleViewReceipt}
                onDownloadReceipt={handleDownloadPdf}
                downloadingPdf={downloadingPdf}
              />
            )}

            {/* TAB 2: FARMER HISTORY */}
            {activeLowerTab === 'history' && (
              <FarmerHistory
                farmerHistoryData={farmerHistoryData}
                loadingHistory={loadingHistory}
                onViewReceipt={handleViewReceipt}
                onDownloadReceipt={handleDownloadPdf}
                onNavigateToDirectory={() => navigate('/officer/farmers')}
              />
            )}

            {/* TAB 3: ANALYTICS */}
            {activeLowerTab === 'analytics' && (
              <AnalyticsPanel stats={stats} settlementData={settlementData} />
            )}

            {/* TAB 4: SETTLEMENT */}
            {activeLowerTab === 'settlement' && (
              <SettlementPanel
                settlementData={settlementData}
                stats={stats}
                user={user}
                showDailyReportModal={showDailyReportModal}
                setShowDailyReportModal={setShowDailyReportModal}
              />
            )}

            {/* TAB 5: AUDIT */}
            {activeLowerTab === 'timeline' && (
              <AuditTimeline
                timeline={currentProc?.timeline || []}
                showFullTimeline={showFullTimeline}
                setShowFullTimeline={setShowFullTimeline}
              />
            )}
          </div>
        </div>
      </section>

      {/* RECEIPT MODAL */}
      <ReceiptModal
        show={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receiptData={receiptData}
        downloadingPdf={downloadingPdf}
        downloadSuccess={downloadSuccess}
        downloadError={downloadError}
        onDownloadPdf={() => handleDownloadPdf()}
        onPrint={() => window.print()}
      />

      {/* CONFIRMATION MODAL: SWITCHING ACTIVE LOT */}
      <Modal
        isOpen={showCallConfirmModal}
        onClose={() => setShowCallConfirmModal(false)}
        size="md"
        ariaLabel="Confirm Switching Active Lot"
      >
        <ModalHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <ModalTitle>Active Lot in Progress</ModalTitle>
              <ModalDescription>An active farmer is currently called to the workbench</ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <p className="text-xs text-slate-700 leading-relaxed">
            Lot <strong>#{currentFarmerData?.token?.tokenNumber}</strong> ({currentFarmerData?.farmer?.name}) is currently at the bay and has not completed statutory settlement.
          </p>
          <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 mt-2 leading-relaxed">
            Calling a new farmer will switch the active bay workstation to the newly called lot. Are you sure you want to proceed?
          </p>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={() => setShowCallConfirmModal(false)}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCallConfirmModal(false);
              executeCallFarmer(pendingCallTokenId);
            }}
            className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Yes, Call New Farmer
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
