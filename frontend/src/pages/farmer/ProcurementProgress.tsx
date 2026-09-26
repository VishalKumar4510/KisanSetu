import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { procurementAPI } from '@/services/api';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Scale,
  FlaskConical,
  MapPin,
  Clock,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Building2,
  Package,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const FLOW_STEPS = [
  'BOOKED',
  'ARRIVED',
  'GATE_ENTRY',
  'WEIGHING',
  'QUALITY_CHECK',
  'PROCUREMENT',
  'PAYMENT_PENDING',
  'PAYMENT_PROCESSING',
  'COMPLETED',
] as const;

interface StepMeta {
  labelEn: string;
  labelHi: string;
  descEn: string;
  descHi: string;
  icon: string;
}

const STEP_CONFIG: Record<string, StepMeta> = {
  BOOKED: {
    labelEn: 'Slot Booked & Token Issued',
    labelHi: 'स्लॉट बुक और टोकन जारी',
    descEn: 'Mandi arrival slot confirmed and digital entry pass generated.',
    descHi: 'मंडी आगमन स्लॉट की पुष्टि हुई और डिजिटल प्रवेश पास तैयार हुआ।',
    icon: '📅',
  },
  ARRIVED: {
    labelEn: 'Arrived at APMC Mandi',
    labelHi: 'मंडी केंद्र पर पहुंचे',
    descEn: 'Vehicle arrived at the mandi premises and queued for security gate.',
    descHi: 'वाहन मंडी परिसर में पहुंचा और सुरक्षा गेट के लिए कतार में है।',
    icon: '🚜',
  },
  GATE_ENTRY: {
    labelEn: 'Gate Entry & RFID Scan',
    labelHi: 'गेट प्रवेश व आरएफआईडी स्कैन',
    descEn: 'Token QR scanned by mandi operator; vehicle admitted to weighbridge bay.',
    descHi: 'मंडी ऑपरेटर द्वारा क्यूआर स्कैन किया गया; वाहन को तौल कांटे की अनुमति।',
    icon: '🚪',
  },
  WEIGHING: {
    labelEn: 'Electronic Weighbridge Measurement',
    labelHi: 'इलेक्ट्रॉनिक कांटा तौल',
    descEn: 'Gross vehicle weight recorded, followed by tare weight after unloading.',
    descHi: 'वाहन का सकल भार दर्ज किया गया, खाली होने के बाद टेयर वजन दर्ज।',
    icon: '⚖️',
  },
  QUALITY_CHECK: {
    labelEn: 'Quality Inspection & Assay',
    labelHi: 'गुणवत्ता व नमी जांच',
    descEn: 'Moisture content, foreign matter, and grade assessed by mandi lab.',
    descHi: 'मंडी लैब द्वारा नमी की मात्रा, बाहरी तत्व और ग्रेड का परीक्षण।',
    icon: '🔬',
  },
  PROCUREMENT: {
    labelEn: 'Procurement Sanctioned',
    labelHi: 'खरीद स्वीकृत व पर्ची जारी',
    descEn: 'Produce officially accepted into FCI/State warehouse inventory.',
    descHi: 'उपज को आधिकारिक तौर पर एफसीआई/राज्य भंडारण में दर्ज किया गया।',
    icon: '✅',
  },
  PAYMENT_PENDING: {
    labelEn: 'Payment Bill Generated',
    labelHi: 'भुगतान बिल तैयार',
    descEn: 'Government MSP payable bill calculated and forwarded to treasury.',
    descHi: 'सरकारी एमएसपी देय राशि का बिल तैयार और वित्त विभाग को भेजा गया।',
    icon: '⏳',
  },
  PAYMENT_PROCESSING: {
    labelEn: 'DBT Processing at PFMS / Bank',
    labelHi: 'डीबीटी प्रक्रिया जारी',
    descEn: 'Payment sanctioned through Public Financial Management System (PFMS).',
    descHi: 'सार्वजनिक वित्तीय प्रबंधन प्रणाली (PFMS) द्वारा बैंक अंतरण प्रक्रियाधीन।',
    icon: '💳',
  },
  COMPLETED: {
    labelEn: 'Payment Credited to Bank Account',
    labelHi: 'बैंक खाते में भुगतान जमा',
    descEn: 'Funds credited directly to your Aadhaar-linked bank account via DBT.',
    descHi: 'डीबीटी के माध्यम से आपके आधार से जुड़े बैंक खाते में राशि जमा।',
    icon: '🎉',
  },
};

const TIMESTAMP_KEYS: Record<string, string> = {
  BOOKED: 'bookedAt',
  ARRIVED: 'arrivedAt',
  GATE_ENTRY: 'gateEntryAt',
  WEIGHING: 'weighingAt',
  QUALITY_CHECK: 'qualityCheckAt',
  PROCUREMENT: 'procurementAt',
  PAYMENT_PENDING: 'paymentPendingAt',
  PAYMENT_PROCESSING: 'paymentProcessingAt',
  COMPLETED: 'completedAt',
};

export default function ProcurementProgress() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [procurement, setProcurement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await procurementAPI.getCurrent(user?.farmerId);
      setProcurement(res.data.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          (language === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Failed to load procurement status')
      );
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  const formatTimestamp = (ts: string | undefined) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return ts;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-fadeIn">
        <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <SkeletonCard className="h-44" />
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  if (error && !procurement) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
        <PageHeader
          title={t('procurementStatus')}
          backButton={{
            label: t('back'),
            onClick: () => navigate('/farmer'),
          }}
        />
        <div className="max-w-md mx-auto py-10" aria-live="assertive">
          <ErrorState
            title={language === 'hi' ? 'खरीद डेटा लोड करने में विफल' : 'Procurement Data Connection Error'}
            description={error}
            onRetry={() => fetchData(true)}
            retryLabel={language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
          />
        </div>
      </div>
    );
  }

  if (!procurement) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
        <PageHeader
          title={t('procurementStatus')}
          description={
            language === 'hi'
              ? 'मंडी तौल, गुणवत्ता जांच और डीबीटी भुगतान की लाइव ट्रैकिंग'
              : 'End-to-end operational timeline from weighment to bank disbursement'
          }
          backButton={{
            label: t('back'),
            onClick: () => navigate('/farmer'),
          }}
        />

        <div className="max-w-md mx-auto py-10">
          <EmptyState
            bordered
            icon={<TrendingUp className="w-8 h-8 text-[#16A34A]" />}
            title={language === 'hi' ? 'कोई सक्रिय खरीद नहीं' : 'No Active Procurement in Progress'}
            description={
              language === 'hi'
                ? 'आपने वर्तमान में किसी खरीद प्रक्रिया में भाग नहीं लिया है। पहले एक स्लॉट बुक करें।'
                : 'You do not have an active procurement underway. Once you reserve an arrival slot, live step-by-step progress will display here.'
            }
            action={{
              label: language === 'hi' ? 'स्लॉट बुक करें' : 'Book Procurement Slot',
              onClick: () => navigate('/farmer/centres'),
              icon: <ArrowRight className="w-4 h-4" />,
            }}
          />
        </div>
      </div>
    );
  }

  const currentIdx = FLOW_STEPS.indexOf(procurement.status);
  const activeStepKey = currentIdx >= 0 ? FLOW_STEPS[currentIdx] : 'BOOKED';
  const activeMeta = STEP_CONFIG[activeStepKey] || STEP_CONFIG.BOOKED;

  const weighing = procurement.weighingData || procurement.weighing;
  const quality = procurement.qualityData || procurement.qualityCheck;

  const progressPct =
    currentIdx >= 0
      ? Math.round(((currentIdx + 1) / FLOW_STEPS.length) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 animate-fadeIn" aria-live="polite">
      {/* Page Header */}
      <PageHeader
        title={t('procurementStatus')}
        description={
          procurement.centreName
            ? `${procurement.centreName} • ${language === 'hi' ? 'प्रोक्योरमेंट ट्रैकर' : 'Procurement Tracker'}`
            : language === 'hi'
            ? 'तौल कांटे से लेकर बैंक खाते तक की पूरी प्रक्रिया'
            : 'Live operational pipeline from weighment to DBT bank transfer'
        }
        backButton={{
          label: t('back'),
          onClick: () => navigate('/farmer'),
        }}
        badge={
          <StatusBadge
            status={procurement.status}
            language={language}
            size="md"
          />
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            {refreshing ? (language === 'hi' ? 'अपडेट...' : 'Syncing...') : (language === 'hi' ? 'रिफ्रेश' : 'Refresh')}
          </Button>
        }
      />

      {/* Error state if manual sync failed */}
      {error && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchData(true)} className="font-bold underline">
            {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
          </button>
        </div>
      )}

      {/* Current Active Stage Hero Banner */}
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-emerald-50/70 via-white to-green-50/40 border-green-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-3xl flex items-center justify-center shadow-xs border border-green-200 shrink-0">
              {activeMeta.icon}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-emerald-800 uppercase font-extrabold tracking-wider block">
                {language === 'hi' ? 'वर्तमान सक्रिय चरण' : 'CURRENT OPERATIONAL STAGE'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#17201A] tracking-tight">
                {language === 'hi' ? activeMeta.labelHi : activeMeta.labelEn}
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-xl">
                {language === 'hi' ? activeMeta.descHi : activeMeta.descEn}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
            <span className="text-xs font-bold text-[#14532D]">
              {language === 'hi' ? `चरण ${currentIdx + 1} / ${FLOW_STEPS.length}` : `Step ${currentIdx + 1} of ${FLOW_STEPS.length}`}
            </span>
            <span className="text-2xl font-black text-[#16A34A] font-mono mt-0.5">
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Linear Progress */}
        <div className="space-y-1 pt-1">
          <Progress value={progressPct} variant="primary" size="sm" />
          <div className="flex justify-between text-[11px] text-[#64748B]">
            <span>{language === 'hi' ? 'स्लॉट बुक' : 'Booked'}</span>
            <span>{language === 'hi' ? 'डीबीटी बैंक अंतरण पूर्ण' : 'DBT Completed'}</span>
          </div>
        </div>
      </Card>

      {/* Modern 9-Step Timeline (Enhanced with 21st.dev Modern Timeline reference) */}
      <Card className="p-5 sm:p-7 space-y-6 bg-white shadow-sm border-slate-200/90">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-base text-[#17201A]">
              {language === 'hi' ? 'विस्तृत खरीद समयरेखा' : 'Procurement Lifecycle Steps'}
            </h3>
            <p className="text-xs text-[#64748B]">
              {language === 'hi'
                ? 'सरकारी न्यूनतम समर्थन मूल्य (MSP) खरीद का लाइव डिजिटल ऑडिट ट्रेल'
                : 'Auditable milestone sequence from mandi gate to DBT treasury clearance'}
            </p>
          </div>
          <Badge variant="outline" size="sm" className="font-mono">
            {currentIdx + 1} / {FLOW_STEPS.length} {language === 'hi' ? 'चरण' : 'Stages'}
          </Badge>
        </div>

        <div className="relative pl-1">
          {FLOW_STEPS.map((step, idx) => {
            const isDone = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isFuture = idx > currentIdx;
            const meta = STEP_CONFIG[step];
            const timestampKey = TIMESTAMP_KEYS[step];
            const timestamp = procurement[timestampKey];
            const isLast = idx === FLOW_STEPS.length - 1;

            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className="flex gap-4 group"
              >
                {/* Step Connector & Icon Indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`relative w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${
                      isDone
                        ? 'bg-[#16A34A] text-white shadow-2xs ring-2 ring-emerald-100'
                        : isCurrent
                        ? 'bg-[#16A34A] text-white ring-4 ring-[#16A34A]/30 shadow-md'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-white stroke-[2.5]" />
                    ) : isCurrent ? (
                      <>
                        <span className="absolute -inset-1 rounded-2xl bg-[#16A34A]/20 animate-ping pointer-events-none" />
                        <span className="w-3 h-3 rounded-full bg-white shadow-xs" />
                      </>
                    ) : (
                      <span className="text-xs font-bold font-mono">{idx + 1}</span>
                    )}
                  </div>

                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 min-h-[40px] my-1 transition-colors ${
                        idx < currentIdx
                          ? 'bg-[#16A34A]'
                          : idx === currentIdx
                          ? 'bg-gradient-to-b from-[#16A34A] to-slate-200'
                          : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>

                {/* Step Content Card */}
                <div
                  className={`pb-7 flex-1 min-w-0 transition-opacity duration-200 ${
                    isFuture ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  <div
                    className={`rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 ${
                      isCurrent
                        ? 'bg-emerald-50/50 border-emerald-200 shadow-xs'
                        : isDone
                        ? 'bg-white border-slate-200/80 hover:border-slate-300'
                        : 'bg-slate-50/40 border-slate-200/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg" role="img" aria-label="Step icon">
                          {meta.icon}
                        </span>
                        <h4
                          className={`font-bold text-sm sm:text-base leading-snug ${
                            isDone || isCurrent ? 'text-[#17201A]' : 'text-slate-500'
                          }`}
                        >
                          {language === 'hi' ? meta.labelHi : meta.labelEn}
                        </h4>
                        {isCurrent && (
                          <Badge variant="primary" size="sm">
                            {language === 'hi' ? 'सक्रिय' : 'Active'}
                          </Badge>
                        )}
                        {isDone && (
                          <Badge variant="success" size="sm">
                            {language === 'hi' ? 'सम्पन्न' : 'Done'}
                          </Badge>
                        )}
                      </div>

                      {timestamp && (
                        <span className="text-[11px] text-[#64748B] flex items-center gap-1 font-mono bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/70">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatTimestamp(timestamp)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      {language === 'hi' ? meta.descHi : meta.descEn}
                    </p>

                  {/* Weighing Details Card */}
                  {step === 'WEIGHING' && weighing && (isDone || isCurrent) && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs text-purple-900 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-purple-600" />
                          {language === 'hi' ? 'प्रमाणित तौल कांटे का विवरण' : 'Certified Weighbridge Data'}
                        </span>
                        {weighing.scaleId && (
                          <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-lg border border-purple-200">
                            Scale: {weighing.scaleId}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="p-2 rounded-xl bg-white border border-purple-100">
                          <span className="text-[10px] text-purple-600 font-bold uppercase block">
                            {language === 'hi' ? 'सकल (Gross)' : 'Gross Weight'}
                          </span>
                          <strong className="text-sm font-black text-purple-900 mt-0.5 block">
                            {weighing.grossWeight?.toLocaleString('en-IN') || 0} kg
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-purple-100">
                          <span className="text-[10px] text-purple-600 font-bold uppercase block">
                            {language === 'hi' ? 'खाली (Tare)' : 'Tare Weight'}
                          </span>
                          <strong className="text-sm font-black text-purple-900 mt-0.5 block">
                            {weighing.tareWeight?.toLocaleString('en-IN') || 0} kg
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50 border border-green-200">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase block">
                            {language === 'hi' ? 'शुद्ध उपज (Net)' : 'Net Produce'}
                          </span>
                          <strong className="text-sm font-black text-[#14532D] mt-0.5 block">
                            {weighing.netWeight?.toLocaleString('en-IN') || 0} kg
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quality Inspection Details Card */}
                  {step === 'QUALITY_CHECK' && quality && (isDone || isCurrent) && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs text-indigo-900 font-bold">
                        <span className="flex items-center gap-1.5">
                          <FlaskConical className="w-4 h-4 text-indigo-600" />
                          {language === 'hi' ? 'मंडी लैब गुणवत्ता परिणाम' : 'Mandi Quality Assay Report'}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                            quality.grade === 'A'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : quality.grade === 'B'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          Grade {quality.grade}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2 rounded-xl bg-white border border-indigo-100 flex justify-between items-center">
                          <span className="text-indigo-600 font-medium">
                            {language === 'hi' ? 'नमी (Moisture)' : 'Moisture'}
                          </span>
                          <strong className="text-indigo-950 font-bold">
                            {quality.moistureContent}%
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-indigo-100 flex justify-between items-center">
                          <span className="text-indigo-600 font-medium">
                            {language === 'hi' ? 'विदेशी तत्व' : 'Foreign Matter'}
                          </span>
                          <strong className="text-indigo-950 font-bold">
                            {quality.foreignMatter}%
                          </strong>
                        </div>
                      </div>

                      {quality.remarks && (
                        <p className="text-[11px] text-indigo-800 bg-white/70 p-2 rounded-xl italic border border-indigo-100">
                          "{quality.remarks}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Payment Navigation Link on Payment Steps */}
                  {(step === 'PAYMENT_PENDING' || step === 'PAYMENT_PROCESSING' || step === 'COMPLETED') &&
                    (isDone || isCurrent) && (
                      <div className="mt-3 flex items-center justify-between p-3 rounded-2xl bg-[#F0FDF4] border border-green-200">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#16A34A]" />
                          <span className="text-xs font-bold text-[#14532D]">
                            {language === 'hi' ? 'डीबीटी बैंक भुगतान स्थिति देखें' : 'View DBT Direct Bank Transfer'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/farmer/payment')}
                          rightIcon={<ArrowRight className="w-3.5 h-3.5 text-[#16A34A]" />}
                          className="text-xs text-[#16A34A] py-1 px-2.5"
                        >
                          {t('view')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
