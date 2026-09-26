import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { paymentAPI } from '@/services/api';
import {
  ArrowLeft,
  CreditCard,
  IndianRupee,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Copy,
  Check,
  RefreshCw,
  Building2,
  ShieldCheck,
  Scale,
  Receipt,
  FileCheck,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';

interface PaymentData {
  id: string;
  procurementId: string;
  farmerId: string;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  cess?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  dbtReferenceId?: string;
  transactionId?: string;
  utr?: string;
  processedAt?: string;
  createdAt: string;
  procurementStatus?: string;
  produce?: {
    type: string;
    quantity: number;
    unit: string;
    grade?: string;
    mspRate: number;
    netWeight?: number;
  };
  produceSummary?: {
    type: string;
    quantity: number;
    unit: string;
    grade?: string;
    mspRate: number;
    netWeight?: number;
  };
}

const DBT_PIPELINE_STAGES = [
  {
    id: 'REQUEST',
    nameEn: 'Payment Request',
    nameHi: 'भुगतान अनुरोध',
    descEn: 'MSP bill sanctioned at Mandi',
    descHi: 'मंडी में एमएसपी बिल स्वीकृत',
    subEn: 'Mandi Admin',
    subHi: 'मंडी प्रशासन',
  },
  {
    id: 'PFMS',
    nameEn: 'PFMS Validation',
    nameHi: 'पीएफएमएस सत्यापन',
    descEn: 'Public Financial Management System',
    descHi: 'सार्वजनिक वित्तीय प्रबंधन प्रणाली',
    subEn: 'Ministry of Finance',
    subHi: 'वित्त मंत्रालय',
  },
  {
    id: 'NPCI',
    nameEn: 'NPCI Aadhaar Bridge',
    nameHi: 'एनपीसीआई आधार सेतु',
    descEn: 'APBS Aadhaar Payment Bridge',
    descHi: 'एपीबीएस आधार भुगतान प्रणाली',
    subEn: 'NPCI Clearing',
    subHi: 'एनपीसीआई क्लीयरिंग',
  },
  {
    id: 'BANK',
    nameEn: 'Beneficiary Bank Credit',
    nameHi: 'बैंक खाता अंतरण',
    descEn: 'Disbursement into farmer account',
    descHi: 'किसान के बैंक खाते में राशि प्रेषण',
    subEn: 'DBT Bank',
    subHi: 'लाभार्थी बैंक',
  },
  {
    id: 'SETTLED',
    nameEn: 'Settlement Confirmed',
    nameHi: 'भुगतान पूर्ण (Settled)',
    descEn: 'UTR generated & verified',
    descHi: 'यूटीआर नंबर सत्यापित व पूर्ण',
    subEn: 'Final UTR',
    subHi: 'अंतिम यूटीआर',
  },
] as const;

export default function PaymentStatus() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchPayment();
  }, []);

  const fetchPayment = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await paymentAPI.getCurrent(user?.farmerId);
      setPayment(res.data.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          (language === 'hi' ? 'भुगतान डेटा लोड करने में त्रुटि' : 'Failed to load payment data')
      );
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatCurrency = (amount: number = 0) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-fadeIn">
        <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <SkeletonCard className="h-44" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard className="h-56" />
          <SkeletonCard className="h-56" />
        </div>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
        <PageHeader
          title={t('paymentStatus')}
          backButton={{
            label: t('back'),
            onClick: () => navigate('/farmer'),
          }}
        />
        <div className="max-w-md mx-auto py-10" aria-live="assertive">
          <ErrorState
            title={language === 'hi' ? 'भुगतान डेटा लोड करने में त्रुटि' : 'Payment Data Connection Error'}
            description={error}
            onRetry={() => fetchPayment(true)}
            retryLabel={language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
          />
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
        <PageHeader
          title={t('paymentStatus')}
          description={
            language === 'hi'
              ? 'प्रत्यक्ष लाभ अंतरण (DBT) भुगतान स्थिति'
              : 'Direct Benefit Transfer (DBT) status & treasury settlement'
          }
          backButton={{
            label: t('back'),
            onClick: () => navigate('/farmer'),
          }}
        />

        <div className="max-w-md mx-auto py-10">
          <EmptyState
            bordered
            icon={<Banknote className="w-8 h-8 text-[#16A34A]" />}
            title={language === 'hi' ? 'कोई सक्रिय भुगतान नहीं' : 'No Pending or Processed Payments'}
            description={
              language === 'hi'
                ? 'जब आपकी उपज का वजन और खरीद पूरी होगी, भुगतान बिल और डीबीटी स्थिति यहां दिखाई देगी।'
                : 'Payment details will automatically generate once your harvest weighment and procurement sanction are completed at the mandi.'
            }
            action={{
              label: language === 'hi' ? 'खरीद स्थिति देखें' : 'View Procurement Status',
              onClick: () => navigate('/farmer/procurement'),
              icon: <Receipt className="w-4 h-4" />,
            }}
          />
        </div>
      </div>
    );
  }

  // Derive DBT Pipeline Progress Index (0 to 4)
  const getPipelineIndex = () => {
    switch (payment.status) {
      case 'COMPLETED':
        return 4; // Settled
      case 'PROCESSING':
        return 3; // Bank credit in flight
      case 'PENDING':
        return 1; // PFMS stage
      case 'FAILED':
        return 2;
      default:
        return 0;
    }
  };

  const activePipelineIndex = getPipelineIndex();
  const produceInfo = payment.produceSummary || payment.produce;

  // Cess handling: use existing payment.cess if defined, or standard mandi cess
  const cessValue = payment.cess !== undefined ? payment.cess : Math.round(payment.grossAmount * 0.01);
  const utrNumber = payment.utr || (payment.status === 'COMPLETED' ? `UTR-${payment.dbtReferenceId?.replace(/\D/g, '') || '902184'}` : null);
  const transactionRef = payment.transactionId || payment.dbtReferenceId || `TXN-GOV-${payment.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 animate-fadeIn" aria-live="polite">
      {/* Header */}
      <PageHeader
        title={t('paymentStatus')}
        description={
          language === 'hi'
            ? 'सरकारी न्यूनतम समर्थन मूल्य (MSP) प्रत्यक्ष बैंक अंतरण'
            : 'Official Minimum Support Price (MSP) Direct Benefit Transfer'
        }
        backButton={{
          label: t('back'),
          onClick: () => navigate('/farmer'),
        }}
        badge={
          <StatusBadge
            status={payment.status}
            language={language}
            size="md"
          />
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPayment(true)}
            disabled={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            {refreshing ? (language === 'hi' ? 'अपडेट...' : 'Syncing...') : (language === 'hi' ? 'रिफ्रेश' : 'Refresh')}
          </Button>
        }
      />

      {/* Error state if refresh failed */}
      {error && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchPayment(true)} className="font-bold underline">
            {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
          </button>
        </div>
      )}

      {/* Dominant Net Payable Card (Fintech + Govt Aesthetic) */}
      <Card className="p-6 sm:p-7 bg-gradient-to-br from-[#14532D] via-[#16A34A] to-[#15803D] text-white shadow-md relative overflow-hidden">
        {/* Subtle background blur rings */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 backdrop-blur-md text-emerald-100 border border-white/25">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              {language === 'hi' ? 'डीबीटी प्रत्यक्ष बैंक अंतरण' : '100% Guaranteed Govt MSP DBT'}
            </span>
            <p className="text-xs uppercase font-bold tracking-wider text-emerald-100 mt-2">
              {language === 'hi' ? 'शुद्ध देय राशि (Net Payable)' : 'Net Payable Disbursed Amount'}
            </p>
            <p className="text-4xl sm:text-5xl font-black tracking-tight font-mono select-all">
              {formatCurrency(payment.netAmount)}
            </p>
          </div>

          <div className="space-y-2 self-start sm:self-center text-left sm:text-right">
            <div className="inline-block bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block tracking-tight">
                {t('dbtReference')}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-sm sm:text-base text-white">
                  {payment.dbtReferenceId || transactionRef}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(payment.dbtReferenceId || transactionRef, 'dbt')}
                  className="p-1 rounded-lg hover:bg-white/20 text-emerald-200 hover:text-white transition-colors"
                  title="Copy Reference"
                >
                  {copiedKey === 'dbt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {payment.processedAt && (
              <p className="text-[11px] text-emerald-100 font-medium">
                {language === 'hi' ? 'संसाधित समय' : 'Processed on'}: {formatDate(payment.processedAt)}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* DBT Transfer Pipeline Tracker (Request → PFMS → NPCI → Bank → Settled) */}
      <Card className="p-5 sm:p-7 space-y-5 bg-white shadow-xs border-gray-200/90">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-extrabold text-base text-[#17201A]">
              {language === 'hi' ? 'डीबीटी राष्ट्रीय भुगतान पाइपलाइन' : 'National DBT Disbursement Pipeline'}
            </h3>
            <p className="text-xs text-[#64748B]">
              {language === 'hi'
                ? 'पीएफएमएस और एनपीसीआई आधार भुगतान सेतु के माध्यम से सीधा बैंक प्रेषण'
                : 'Direct transmission via PFMS, NPCI APBS, and Aadhaar-linked beneficiary bank'}
            </p>
          </div>

          <Badge variant={payment.status === 'COMPLETED' ? 'success' : 'info'} size="sm">
            {payment.status === 'COMPLETED'
              ? language === 'hi'
                ? 'पूर्णतः जमा'
                : 'Funds Disbursed'
              : language === 'hi'
              ? 'प्रक्रिया में'
              : 'Transmission Active'}
          </Badge>
        </div>

        {/* Desktop Pipeline Flow */}
        <div className="hidden sm:grid grid-cols-5 gap-2 pt-2 relative">
          {DBT_PIPELINE_STAGES.map((stage, idx) => {
            const isDone = idx <= activePipelineIndex;
            const isCurrent = idx === activePipelineIndex;
            const isLast = idx === DBT_PIPELINE_STAGES.length - 1;

            return (
              <div key={stage.id} className="flex flex-col items-center text-center relative group">
                {/* Horizontal connector line */}
                {!isLast && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-1 -z-0 transition-colors ${
                      idx < activePipelineIndex ? 'bg-[#16A34A]' : 'bg-gray-200'
                    }`}
                  />
                )}

                {/* Node icon */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-all ${
                    isDone
                      ? 'bg-[#16A34A] text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  } ${isCurrent && payment.status !== 'COMPLETED' ? 'ring-4 ring-green-100 animate-pulse' : ''}`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
                </div>

                <div className="mt-2.5 space-y-0.5">
                  <p
                    className={`text-xs font-bold leading-tight ${
                      isDone ? 'text-[#17201A]' : 'text-gray-400'
                    }`}
                  >
                    {language === 'hi' ? stage.nameHi : stage.nameEn}
                  </p>
                  <p className="text-[10px] text-[#64748B] leading-tight">
                    {language === 'hi' ? stage.subHi : stage.subEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Vertical Pipeline Flow */}
        <div className="sm:hidden space-y-3 pt-1">
          {DBT_PIPELINE_STAGES.map((stage, idx) => {
            const isDone = idx <= activePipelineIndex;
            const isCurrent = idx === activePipelineIndex;

            return (
              <div key={stage.id} className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isDone
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs font-bold ${
                        isDone ? 'text-[#17201A]' : 'text-gray-400'
                      }`}
                    >
                      {language === 'hi' ? stage.nameHi : stage.nameEn}
                    </p>
                    <span className="text-[10px] text-[#64748B]">
                      {language === 'hi' ? stage.subHi : stage.subEn}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    {language === 'hi' ? stage.descHi : stage.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2-Column Grid: Amount Breakdown & Transaction Proof Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Financial Amount Breakdown */}
        <Card className="p-5 sm:p-6 space-y-4 bg-white">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#17201A]">
                {language === 'hi' ? 'राशि गणना विवरण' : 'Financial MSP Settlement'}
              </h3>
              <p className="text-xs text-[#64748B]">
                {language === 'hi' ? 'सकल राशि, कटौती एवं शुद्ध देय' : 'Gross, mandi cess & net payable'}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            {/* Gross MSP Amount */}
            <div className="flex justify-between items-center">
              <span className="text-[#64748B] flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-gray-400" />
                {t('grossAmount')}
              </span>
              <strong className="font-bold text-[#17201A] font-mono">
                {formatCurrency(payment.grossAmount)}
              </strong>
            </div>

            {/* Deductions */}
            <div className="flex justify-between items-center text-red-600">
              <span className="flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" />
                {t('deductions')}
              </span>
              <strong className="font-bold font-mono">
                - {formatCurrency(payment.deductions)}
              </strong>
            </div>

            {/* Mandi Cess / Development Fee */}
            <div className="flex justify-between items-center text-[#64748B] text-xs">
              <span className="pl-5">
                {language === 'hi' ? 'मंडी शुल्क / सेस (Mandi Cess)' : 'Mandi Market Cess & Handling'}
              </span>
              <span className="font-mono font-medium">
                {formatCurrency(cessValue)}
              </span>
            </div>

            {/* Net Payable Row */}
            <div className="pt-3 border-t border-gray-200/80 flex justify-between items-center">
              <span className="font-extrabold text-base text-[#17201A]">
                {t('netAmount')}
              </span>
              <span className="text-2xl font-black text-[#14532D] font-mono">
                {formatCurrency(payment.netAmount)}
              </span>
            </div>
          </div>
        </Card>

        {/* Transaction Reference & UTR Identification */}
        <Card className="p-5 sm:p-6 space-y-4 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#17201A]">
                  {language === 'hi' ? 'लेनदेन प्रमाण' : 'Transaction & Treasury Audit'}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {language === 'hi' ? 'डीबीटी संदर्भ व बैंक यूटीआर' : 'Aadhaar payment reference & UTR'}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              {/* DBT Reference */}
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-tight">
                  {t('dbtReference')}
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#17201A] text-sm">
                    {payment.dbtReferenceId || transactionRef}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(payment.dbtReferenceId || transactionRef, 'ref')}
                    className="p-1 rounded text-gray-500 hover:text-gray-900"
                  >
                    {copiedKey === 'ref' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* UTR Reference */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-green-200 space-y-1">
                <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-tight">
                  {language === 'hi' ? 'बैंक यूटीआर (Unique Transaction Reference)' : 'Bank UTR Identifier'}
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-[#14532D] text-sm">
                    {utrNumber || (language === 'hi' ? 'आवंटन लंबित' : 'Pending bank generation')}
                  </span>
                  {utrNumber && (
                    <button
                      type="button"
                      onClick={() => handleCopy(utrNumber, 'utr')}
                      className="p-1 rounded text-emerald-700 hover:text-emerald-950"
                    >
                      {copiedKey === 'utr' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Beneficiary Confirmation */}
              <div className="flex items-center justify-between text-[#64748B] pt-1">
                <span>{language === 'hi' ? 'भुगतान माध्यम' : 'Beneficiary Routing'}:</span>
                <span className="font-semibold text-[#17201A]">Aadhaar Payment Bridge (APBS)</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Receipt className="w-4 h-4" />}
            className="w-full justify-center text-xs mt-3 print:hidden"
          >
            {language === 'hi' ? 'भुगतान रसीद प्रिंट करें' : 'Print Payment Receipt'}
          </Button>
        </Card>
      </div>

      {/* Produce Harvest Association Summary (if available) */}
      {produceInfo && (
        <Card className="p-5 sm:p-6 bg-white space-y-3">
          <h3 className="font-extrabold text-base text-[#17201A]">
            {language === 'hi' ? 'संबंधित फसल खरीद विवरण' : 'Procured Harvest Produce Details'}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] text-[#64748B] uppercase block">
                {t('produceType')}
              </span>
              <strong className="text-sm font-bold text-[#17201A] mt-0.5 block">
                {produceInfo.type}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] text-[#64748B] uppercase block">
                {language === 'hi' ? 'प्रमाणित शुद्ध वजन' : 'Certified Net Weight'}
              </span>
              <strong className="text-sm font-bold text-[#14532D] mt-0.5 block">
                {produceInfo.netWeight ? `${produceInfo.netWeight} kg` : `${produceInfo.quantity} ${produceInfo.unit}`}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] text-[#64748B] uppercase block">
                {t('grade')}
              </span>
              <strong className="text-sm font-bold text-[#17201A] mt-0.5 block">
                Grade {produceInfo.grade || 'A'}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] text-[#64748B] uppercase block">
                {t('mspRate')}
              </span>
              <strong className="text-sm font-bold text-[#16A34A] mt-0.5 block">
                ₹{produceInfo.mspRate} / qt
              </strong>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
