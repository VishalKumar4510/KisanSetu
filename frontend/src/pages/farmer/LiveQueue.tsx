import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { queueAPI } from '@/services/api';
import {
  ArrowLeft,
  Users,
  Clock,
  MapPin,
  Ticket,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Radio,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Scale,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState, ErrorState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';

interface QueueData {
  position: number;
  totalInQueue: number;
  estimatedTime: number | string;
  centreName: string;
  centreId: string;
  tokenNumber: string;
  tokenId?: string;
  status?: string;
  servingToken?: string;
}

export type QueueStateMode =
  | 'WAITING'
  | 'ALMOST_TURN'
  | 'NOW_SERVING'
  | 'COMPLETED'
  | 'NOT_IN_QUEUE'
  | 'ERROR';

export default function LiveQueue() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [queue, setQueue] = useState<QueueData | null>(null);
  const [currentServingToken, setCurrentServingToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [etaCountdown, setEtaCountdown] = useState(0);

  const fetchQueue = useCallback(
    async (isInitialOrManual = false) => {
      if (isInitialOrManual) {
        setLoading(true);
        setError(null);
      } else {
        setRefreshing(true);
      }

      try {
        const res = await queueAPI.getPosition();
        if (res.data && res.data.success !== undefined) {
          const data = res.data.data;
          if (data) {
            setQueue(data);
            const rawEta = data.estimatedTime;
            const eta =
              typeof rawEta === 'number'
                ? rawEta
                : parseInt(String(rawEta), 10) || 0;
            setEtaCountdown(eta);
            setLastUpdated(new Date());
            setError(null);

            // Fetch centre queue to discover the current serving token at the front
            if (data.centreId) {
              try {
                const centreRes = await queueAPI.getCentreQueue(data.centreId);
                const cQueue = centreRes.data?.data;
                if (Array.isArray(cQueue) && cQueue.length > 0) {
                  setCurrentServingToken(cQueue[0].tokenNumber || null);
                }
              } catch {
                // Non-blocking fallback
              }
            }
          } else {
            // Explicit null from server: farmer is NOT in queue
            setQueue(null);
            setError(null);
          }
        } else {
          throw new Error(
            res.data?.error ||
              (language === 'hi'
                ? 'अमान्य प्रतिक्रिया'
                : 'Invalid response from server')
          );
        }
      } catch (err: any) {
        console.error('Queue API error:', err);
        const serverMsg = err.response?.data?.error || err.response?.data?.message;
        const fallbackMsg =
          language === 'hi'
            ? 'कतार डेटा लोड करने में त्रुटि'
            : 'Failed to load live queue data';
        setError(serverMsg || err.message || fallbackMsg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [language]
  );

  // Initial fetch and auto-refresh every 12 seconds
  useEffect(() => {
    fetchQueue(true);
    const interval = setInterval(() => {
      fetchQueue(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // ETA countdown
  useEffect(() => {
    if (etaCountdown <= 0) return;
    const timer = setInterval(() => {
      setEtaCountdown((prev) => Math.max(0, prev - 1 / 60));
    }, 1000);
    return () => clearInterval(timer);
  }, [etaCountdown]);

  const formatETA = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    if (h > 0)
      return `${h}${language === 'hi' ? ' घंटा' : 'h'} ${m}${
        language === 'hi' ? ' मिनट' : 'm'
      }`;
    return `${m} ${language === 'hi' ? 'मिनट' : 'min'}`;
  };

  // Determine Queue Operational State
  const determineMode = (): QueueStateMode => {
    if (error && !queue) return 'ERROR';
    if (!queue) return 'NOT_IN_QUEUE';
    if (queue.status === 'COMPLETED') return 'COMPLETED';
    if (queue.position === 0 || queue.status === 'USED' || queue.status === 'GATE_ENTRY') {
      return 'NOW_SERVING';
    }
    if (queue.position <= 2) return 'ALMOST_TURN';
    return 'WAITING';
  };

  const mode = determineMode();
  const peopleAhead = queue ? Math.max(0, queue.position - 1) : 0;
  const progressPct =
    queue && queue.totalInQueue > 0
      ? Math.max(
          5,
          Math.min(
            100,
            ((queue.totalInQueue - queue.position + 1) / queue.totalInQueue) * 100
          )
        )
      : 0;

  // 1. Loading State
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-fadeIn">
        <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <SkeletonCard className="h-64" />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard className="h-28" />
          <SkeletonCard className="h-28" />
        </div>
      </div>
    );
  }

  // 2. Error State
  if (mode === 'ERROR') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
        <PageHeader
          title={t('liveQueue')}
          backButton={{
            label: t('back'),
            onClick: () => navigate('/farmer'),
          }}
        />

        <div className="max-w-md mx-auto py-8" aria-live="assertive">
          <ErrorState
            title={
              language === 'hi' ? 'कतार लोड करने में विफल' : 'Live Queue Connection Error'
            }
            description={error || 'Unable to establish live connection to Mandi queue server.'}
            onRetry={() => fetchQueue(true)}
            retryLabel={language === 'hi' ? 'पुनः प्रयास करें' : 'Retry Live Sync'}
          />
        </div>
      </div>
    );
  }

  // 3. Not in Queue State
  if (mode === 'NOT_IN_QUEUE') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
        <PageHeader
          title={t('liveQueue')}
          description={
            language === 'hi'
              ? 'मंडी तौल कांटे पर वाहनों की लाइव कतार ट्रैकिंग'
              : 'Real-time weighbridge arrival queue tracker'
          }
          backButton={{
            label: t('back'),
            onClick: () => navigate('/farmer'),
          }}
        />

        <div className="max-w-md mx-auto py-10">
          <EmptyState
            bordered
            icon={<Users className="w-8 h-8 text-[#16A34A]" />}
            title={language === 'hi' ? 'आप कतार में नहीं हैं' : 'Not Currently in Queue'}
            description={
              language === 'hi'
                ? 'आपने वर्तमान समय के लिए कोई खरीद स्लॉट बुक नहीं किया है। कतार में शामिल होने के लिए स्लॉट बुक करें।'
                : 'You do not have an active booking queued right now. Reserve a slot at your nearest procurement centre to enter the digital queue.'
            }
            action={{
              label: language === 'hi' ? 'स्लॉट बुक करें' : 'Book Mandi Slot',
              onClick: () => navigate('/farmer/centres'),
              icon: <ArrowRight className="w-4 h-4" />,
            }}
          />
        </div>
      </div>
    );
  }

  // 4. Completed State
  if (mode === 'COMPLETED') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
        <PageHeader
          title={t('liveQueue')}
          backButton={{
            label: t('back'),
            onClick: () => navigate('/farmer'),
          }}
        />

        <div className="max-w-md mx-auto py-8">
          <EmptyState
            bordered
            icon={<CheckCircle2 className="w-8 h-8 text-emerald-600" />}
            title={language === 'hi' ? 'खरीद पूर्ण हो चुकी है' : 'Procurement Queue Completed!'}
            description={
              language === 'hi'
                ? 'आपकी फसल का वजन और गुणवत्ता निरीक्षण पूरा हो चुका है। भुगतान स्थिति देखें।'
                : 'Your harvest has been weighed and accepted into mandi storage. Your DBT payment is being processed.'
            }
            action={{
              label: language === 'hi' ? 'भुगतान स्थिति देखें' : 'View DBT Payment',
              onClick: () => navigate('/farmer/payment'),
              icon: <TrendingUp className="w-4 h-4" />,
            }}
            secondaryAction={{
              label: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard',
              onClick: () => navigate('/farmer'),
            }}
          />
        </div>
      </div>
    );
  }

  // Guard: Ensure queue is non-null for active state rendering
  if (!queue) {
    return null;
  }

  // 5. Active Queue State (WAITING, ALMOST_TURN, NOW_SERVING)
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 animate-fadeIn">
      {/* Top Header */}
      <PageHeader
        title={t('liveQueue')}
        description={
          queue.centreName
            ? `${queue.centreName} • ${language === 'hi' ? 'लाइव तौल कतार' : 'Live Weighbridge Queue'}`
            : language === 'hi'
            ? 'मंडी तौल कांटे पर वाहनों की लाइव कतार'
            : 'Live APMC Mandi weighbridge arrival tracker'
        }
        backButton={{
          label: t('back'),
          onClick: () => navigate('/farmer'),
        }}
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-300 text-xs font-bold shadow-2xs pulse-live">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
            <span className="w-2 h-2 rounded-full bg-[#16A34A] -ml-3.5" />
            <span>{language === 'hi' ? 'लाइव सिंक' : 'LIVE QUEUE'}</span>
          </div>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchQueue(false)}
            disabled={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            {refreshing ? (language === 'hi' ? 'अपडेट...' : 'Syncing...') : (language === 'hi' ? 'ताज़ा करें' : 'Refresh')}
          </Button>
        }
      />

      {/* Background Poll Error Warning Banner (If periodic sync had a hiccup) */}
      {error && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchQueue(false)}
            className="font-bold underline text-amber-950 hover:text-amber-800"
          >
            {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
          </button>
        </div>
      )}

      {/* Operational State Announcement Banner */}
      {mode === 'NOW_SERVING' ? (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md flex items-center gap-4 animate-scaleIn">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-white animate-bounce" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-lg sm:text-xl tracking-tight leading-tight">
              {language === 'hi' ? 'आपकी बारी आ गई है!' : "It's Your Turn! Proceed to Bay Now"}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              {language === 'hi'
                ? 'कृपया अपने वाहन को तौल कांटा गेट की ओर ले जाएं और डिजिटल पास QR कोड दिखाएं।'
                : 'Please drive your vehicle onto Weighbridge Gate 1 and present your digital QR pass to the operator.'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/farmer/token')}
            className="shrink-0 text-xs bg-white text-emerald-950 hover:bg-emerald-50 hidden sm:inline-flex"
          >
            {language === 'hi' ? 'QR पास खोलें' : 'Open QR Pass'}
          </Button>
        </div>
      ) : mode === 'ALMOST_TURN' ? (
        <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-xs flex items-center gap-3.5 animate-fadeIn">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-base text-amber-950">
              {language === 'hi' ? 'तैयार रहें! आपकी बारी आने वाली है' : 'Get Ready! You are Next in Line'}
            </h3>
            <p className="text-xs text-amber-900/80 mt-0.5">
              {language === 'hi'
                ? `आपके आगे केवल ${peopleAhead} किसान हैं। वाहन को गेट के पास ले आएं।`
                : `Only ${peopleAhead} vehicle${peopleAhead === 1 ? '' : 's'} ahead. Prepare your vehicle for weighbridge check-in.`}
            </p>
          </div>
        </div>
      ) : null}

      {/* Visually Dominant Hero Queue Card */}
      <Card className="p-6 sm:p-8 text-center relative overflow-hidden shadow-md border-green-200/90 bg-white" aria-live="polite">
        {/* Decorative subtle pulse glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              {t('queuePosition')}
            </span>
            <p className="text-xs text-[#64748B]">
              {language === 'hi' ? 'मंडी तौल कांटे पर आपकी वर्तमान स्थिति' : 'Current live position in entry line'}
            </p>
          </div>

          {/* Large Dominant Queue Circle */}
          <div className="relative inline-flex items-center justify-center">
            {/* Outer animated ripple */}
            <div className="absolute w-44 h-44 rounded-full border-4 border-[#16A34A]/25 animate-ping opacity-30" />
            <div className="absolute w-40 h-40 rounded-full border-2 border-[#16A34A]/40 animate-pulse" />

            {/* Core Position Badge */}
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-[#16A34A] via-[#15803D] to-[#14532D] text-white flex flex-col items-center justify-center shadow-xl">
              <span className="text-xs font-semibold text-emerald-200 uppercase tracking-widest leading-none mb-1">
                POSITION
              </span>
              <span className="text-6xl font-black tracking-tight leading-none">
                #{queue.position}
              </span>
              <span className="text-[11px] text-emerald-100 font-medium opacity-85 mt-1">
                of {queue.totalInQueue} total
              </span>
            </div>
          </div>

          {/* Key Metric Dominance: People Ahead + Serving Token */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 max-w-lg mx-auto">
            {/* People Ahead */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 text-center">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-tight block">
                {language === 'hi' ? 'आगे खड़े किसान' : 'People Ahead'}
              </span>
              <strong className="text-2xl font-black text-[#17201A] mt-0.5 block">
                {peopleAhead}
              </strong>
              <span className="text-[10px] text-[#64748B]">
                {peopleAhead === 0 ? 'You are first' : 'Vehicles waiting'}
              </span>
            </div>

            {/* Currently Serving Token */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-green-200/80 text-center">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-tight block">
                {language === 'hi' ? 'वर्तमान में तौल जारी' : 'Now at Weighbridge'}
              </span>
              <strong className="text-xl sm:text-2xl font-black text-[#14532D] font-mono mt-0.5 block truncate">
                {currentServingToken || (queue.position === 1 ? queue.tokenNumber : `TKN-${Math.max(1001, parseInt(queue.tokenNumber?.replace(/\D/g, '') || '1001') - peopleAhead)}`)}
              </strong>
              <span className="text-[10px] text-emerald-700 font-medium">
                {language === 'hi' ? 'कांटा 01 सक्रिय' : 'Bay 01 Active'}
              </span>
            </div>

            {/* Estimated Wait Time */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-tight block">
                {t('estimatedWait')}
              </span>
              <strong className="text-2xl font-black text-amber-700 mt-0.5 block">
                ~{formatETA(etaCountdown)}
              </strong>
              <span className="text-[10px] text-[#64748B]">
                {language === 'hi' ? 'लगभग समय' : 'Estimated arrival'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Toward Your Turn */}
      <Card className="p-5 sm:p-6 space-y-3 bg-white">
        <div className="flex items-center justify-between text-xs text-[#64748B]">
          <span className="font-semibold text-[#17201A] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#16A34A]" />
            {language === 'hi' ? 'कतार प्रगति' : 'Queue Clearance Progress'}
          </span>
          <span className="font-mono font-bold text-[#16A34A]">
            {Math.round(progressPct)}%
          </span>
        </div>

        <Progress value={progressPct} variant="primary" size="md" />

        <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
          <span>{language === 'hi' ? 'कतार में प्रवेश' : 'Entered Queue'}</span>
          <span className="font-bold text-[#14532D]">
            {queue.position === 1
              ? language === 'hi'
                ? 'अभी आपकी बारी!'
                : 'Your Turn!'
              : language === 'hi'
              ? `${peopleAhead} वाहन शेष`
              : `${peopleAhead} vehicle(s) ahead`}
          </span>
        </div>
      </Card>

      {/* Mandi & Token Information Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-[#64748B] flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5 text-[#16A34A]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-tight">
                {t('tokenNumber')}
              </p>
              <p className="font-black text-base text-[#14532D] font-mono truncate">
                {queue.tokenNumber}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/farmer/token')}
            className="text-xs shrink-0"
          >
            {language === 'hi' ? 'पास देखें' : 'View Pass'}
          </Button>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-[#64748B] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#16A34A]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-tight">
                {t('centre')}
              </p>
              <p className="font-bold text-sm text-[#17201A] truncate">
                {queue.centreName || 'APMC Central Hub'}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/farmer/procurement')}
            className="text-xs text-[#16A34A] shrink-0"
          >
            {language === 'hi' ? 'स्थिति' : 'Status'}
          </Button>
        </Card>
      </div>

      {/* Live Sync Timestamp Footer */}
      <p className="text-center text-xs text-[#64748B] pt-2">
        {language === 'hi' ? 'अंतिम सिंक' : 'Last updated'}:{' '}
        <span className="font-semibold text-[#17201A]">
          {lastUpdated.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
        <span className="text-gray-300"> • </span>
        <span>
          {language === 'hi'
            ? 'प्रत्येक 12 सेकंड में लाइव स्वतः अपडेट'
            : 'Auto-refreshes every 12s'}
        </span>
      </p>
    </div>
  );
}
