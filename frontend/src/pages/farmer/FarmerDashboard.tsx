import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { farmerAPI, queueAPI, notificationAPI } from '@/services/api';
import {
  Calendar,
  Users,
  Ticket,
  CreditCard,
  Bell,
  ChevronRight,
  Sprout,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Card } from '@/components/ui/card';
import { AnimatedDashboardCard } from '@/components/ui/animated-dashboard-card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

const statusSteps = [
  'BOOKED',
  'ARRIVED',
  'GATE_ENTRY',
  'WEIGHING',
  'QUALITY_CHECK',
  'PROCUREMENT',
  'PAYMENT_PENDING',
  'PAYMENT_PROCESSING',
  'COMPLETED',
];

const cropEmojiMap: Record<string, string> = {
  wheat: '🌾',
  gehun: '🌾',
  paddy: '🍚',
  rice: '🍚',
  dhan: '🍚',
  maize: '🌽',
  corn: '🌽',
  makka: '🌽',
  mustard: '🌻',
  sarson: '🌻',
  gram: '🌱',
  chana: '🌱',
  cotton: '☁️',
  kapas: '☁️',
  soybean: '🫘',
  pulses: '🫘',
};

function getCropEmoji(name?: string) {
  if (!name) return '🌾';
  const key = name.toLowerCase().trim();
  for (const [crop, emoji] of Object.entries(cropEmojiMap)) {
    if (key.includes(crop)) return emoji;
  }
  return '🌾';
}

export default function FarmerDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState<any>(null);
  const [queuePos, setQueuePos] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [location.key]);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [profileRes, queueRes, notifRes] = await Promise.all([
        farmerAPI.getProfile(),
        queueAPI.getPosition(),
        notificationAPI.getAll(),
      ]);
      setProfile(profileRes.data.data);
      setQueuePos(queueRes.data.data);
      setNotifications(notifRes.data.data?.notifications?.slice(0, 4) || []);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
        <div className="h-44 rounded-3xl bg-gray-200/70 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-200/70 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const proc = profile?.activeProcurement;
  const token = profile?.activeToken;
  const payment = profile?.latestPayment;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const latestNotif = notifications[0];

  const currentStepIdx = proc ? statusSteps.indexOf(proc.status) : -1;
  const progressPercent =
    currentStepIdx >= 0
      ? Math.round(((currentStepIdx + 1) / statusSteps.length) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 animate-fadeIn">
      {/* 1. Welcome & Farmer Identity Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#14532D] via-[#16A34A] to-[#15803D] text-white p-5 sm:p-7 shadow-md">
        {/* Subtle decorative concentric rings */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-emerald-900/30 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-emerald-50 border border-white/25">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                {language === 'hi' ? 'सत्यापित किसान' : 'Verified Farmer'}
              </span>
              {(profile?.farmerId || user?.farmerId) && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-black/20 text-emerald-100">
                  ID: {profile?.farmerId || user?.farmerId}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {t('welcome')}, {profile?.name || user?.name || 'Kisan'}
            </h1>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-emerald-100 flex-wrap">
              {(profile?.village || profile?.district) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-300 shrink-0" />
                  {profile.village ? `${profile.village}, ` : ''}
                  {profile.district}
                </span>
              )}
              {profile?.landArea && (
                <span className="flex items-center gap-1.5 border-l border-white/20 pl-3">
                  <Sprout className="w-4 h-4 text-emerald-300 shrink-0" />
                  {profile.landArea} {language === 'hi' ? 'एकड़ भूमि' : 'Acres Land'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              leftIcon={
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
                />
              }
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs py-2 px-3.5 backdrop-blur-sm"
            >
              {refreshing
                ? language === 'hi'
                  ? 'अद्यतन...'
                  : 'Updating...'
                : language === 'hi'
                ? 'रिफ्रेश'
                : 'Live Sync'}
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Notification Indicator / Preview Pill */}
      {unreadCount > 0 && latestNotif && (
        <section
          onClick={() => navigate('/farmer/notifications')}
          className="cursor-pointer group flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 hover:bg-amber-100/80 hover:border-amber-300 transition-all duration-150 shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 truncate">
                  {language === 'hi' ? latestNotif.titleHi : latestNotif.title}
                </span>
                <Badge variant="warning" size="sm">
                  {unreadCount} {language === 'hi' ? 'नई सूचना' : 'new'}
                </Badge>
              </div>
              <p className="text-xs text-amber-800/80 truncate mt-0.5">
                {language === 'hi' ? latestNotif.messageHi : latestNotif.message}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </section>
      )}

      {/* 3. Active Token Hero / Booking Callout (Enhanced with 21st.dev Animated Dashboard Card) */}
      <section>
        {token ? (
          <AnimatedDashboardCard
            variant="white"
            glow={true}
            withDots={true}
            className="p-5 sm:p-6"
          >
            {/* Top digital pass header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 text-[#16A34A] flex items-center justify-center">
                  <Ticket className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  {language === 'hi' ? 'सक्रिय मंडी टोकन' : 'Active Digital Mandi Pass'}
                </span>
              </div>
              <StatusBadge status={token.status || 'ACTIVE'} language={language} />
            </div>

            {/* Main Token Body */}
            <div className="pt-5 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="text-xs text-[#64748B] font-medium uppercase tracking-wider">
                  {t('tokenNumber')}
                </p>
                <p className="text-3xl sm:text-4xl md:text-5xl font-black text-[#14532D] tracking-tight font-mono break-all sm:break-normal">
                  {token.tokenNumber}
                </p>
                {token.centreName && (
                  <p className="text-xs sm:text-sm text-[#64748B] flex items-center gap-1.5 pt-1">
                    <MapPin className="w-4 h-4 text-[#16A34A]" />
                    <span className="font-medium text-[#17201A]">{token.centreName}</span>
                  </p>
                )}
              </div>

              {/* Queue Position Card / Pulse Widget */}
              {queuePos && (
                <div className="flex items-center gap-4 bg-[#F0FDF4] border border-green-200/80 rounded-2xl p-4 sm:p-5 w-full sm:w-auto">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#15803D] text-white flex flex-col items-center justify-center pulse-green shadow-xs shrink-0">
                    <span className="text-2xl font-black leading-none">
                      #{queuePos.position}
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider opacity-85 mt-0.5">
                      {language === 'hi' ? 'कतार स्थिति' : 'Position'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#14532D]">
                      <Clock className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>
                        ~{queuePos.estimatedTime || 15} {language === 'hi' ? 'मिनट प्रतीक्षा' : 'min wait'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      {language === 'hi'
                        ? `कतार में कुल ${queuePos.totalInQueue || 1} किसान`
                        : `${queuePos.totalInQueue || 1} farmers currently ahead`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex items-center gap-3 flex-wrap">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/farmer/token')}
                leftIcon={<QrCode className="w-4 h-4" />}
                className="flex-1 sm:flex-none"
              >
                {language === 'hi' ? 'डिजिटल पास और QR देखें' : 'View Digital QR Pass'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/farmer/queue')}
                leftIcon={<Users className="w-4 h-4" />}
                className="flex-1 sm:flex-none"
              >
                {t('liveQueue')}
              </Button>
            </div>
          </AnimatedDashboardCard>
        ) : (
          <AnimatedDashboardCard
            variant="emerald"
            glow={true}
            withDots={true}
            className="p-6 sm:p-7"
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 text-center sm:text-left">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F0FDF4] text-[#15803D] border border-green-200">
                  <Calendar className="w-3.5 h-3.5" />
                  {language === 'hi' ? 'एमएसपी खरीद स्लॉट' : 'MSP Procurement Slot'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#17201A]">
                  {language === 'hi'
                    ? 'अपनी उपज बेचने के लिए केंद्र और समय चुनें'
                    : 'Ready to Sell Your Harvest at Minimum Support Price?'}
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] max-w-xl">
                  {language === 'hi'
                    ? 'लंबी कतारों से बचें। अपने नजदीकी अधिकृत खरीद केंद्र पर पहले से स्लॉट बुक करें और डिजिटल टोकन प्राप्त करें।'
                    : 'Skip the chaos and hours of waiting in line. Pre-book an arrival slot at your nearest procurement mandi for hassle-free weighment and direct DBT.'}
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/farmer/centres')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shrink-0 w-full sm:w-auto"
              >
                {language === 'hi' ? 'अभी स्लॉट बुक करें' : 'Book Mandi Slot Now'}
              </Button>
            </div>
          </AnimatedDashboardCard>
        )}
      </section>

      {/* 4. Quick Actions Grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
          {language === 'hi' ? 'त्वरित सेवाएं' : 'Quick Mandi Services'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              title: t('bookSlot'),
              desc: language === 'hi' ? 'नया स्लॉट आरक्षित करें' : 'Reserve mandi arrival',
              icon: Calendar,
              path: '/farmer/centres',
              color: 'text-emerald-700 bg-emerald-50 border-emerald-100 hover:border-emerald-300',
              iconBg: 'bg-emerald-600 text-white',
            },
            {
              title: t('liveQueue'),
              desc: language === 'hi' ? 'कतार और ईटीए जांचें' : 'Wait time & position',
              icon: Users,
              path: '/farmer/queue',
              color: 'text-amber-800 bg-amber-50 border-amber-100 hover:border-amber-300',
              iconBg: 'bg-amber-500 text-white',
            },
            {
              title: t('myToken'),
              desc: language === 'hi' ? 'गेट पास और QR कोड' : 'Check-in QR ticket',
              icon: Ticket,
              path: '/farmer/token',
              color: 'text-purple-800 bg-purple-50 border-purple-100 hover:border-purple-300',
              iconBg: 'bg-purple-600 text-white',
            },
            {
              title: t('payment'),
              desc: language === 'hi' ? 'डीबीटी बैंक अंतरण' : 'Direct DBT tracking',
              icon: CreditCard,
              path: '/farmer/payment',
              color: 'text-blue-800 bg-blue-50 border-blue-100 hover:border-blue-300',
              iconBg: 'bg-blue-600 text-white',
            },
          ].map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => navigate(action.path)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 hover:shadow-sm active:scale-[0.98] flex flex-col justify-between h-32 group ${action.color}`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${action.iconBg}`}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#17201A] leading-tight">
                  {action.title}
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                  {action.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Procurement Status Tracker */}
      {proc && (
        <section>
          <Card
            onClick={() => navigate('/farmer/procurement')}
            className="cursor-pointer hover:shadow-md transition-shadow p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-[#17201A]">
                    {t('procurementStatus')}
                  </h3>
                  <StatusBadge status={proc.status} language={language} size="sm" />
                </div>
                {proc.centreName && (
                  <p className="text-xs text-[#64748B] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
                    {proc.centreName}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/farmer/procurement');
                }}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="text-xs text-[#16A34A]"
              >
                {language === 'hi' ? 'विस्तार देखें' : 'View Timeline'}
              </Button>
            </div>

            {/* Stepper progress visual */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-medium">
                  {language === 'hi' ? 'वर्तमान चरण' : 'Current Stage'}:{' '}
                  <strong className="text-[#17201A]">
                    {proc.status.replace(/_/g, ' ')}
                  </strong>
                </span>
                <span className="font-mono font-semibold text-[#16A34A]">
                  {progressPercent}%
                </span>
              </div>
              <Progress value={progressPercent} variant="primary" size="md" />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[#64748B] block text-[10px] uppercase">
                  {language === 'hi' ? 'कुल उपज' : 'Declared Weight'}
                </span>
                <strong className="text-[#17201A] font-semibold text-xs">
                  {proc.quantity ? `${proc.quantity} Qt` : 'Pending weighment'}
                </strong>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[#64748B] block text-[10px] uppercase">
                  {language === 'hi' ? 'गुणवत्ता' : 'Quality Grade'}
                </span>
                <strong className="text-[#17201A] font-semibold text-xs">
                  {proc.grade || 'In Inspection'}
                </strong>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[#64748B] block text-[10px] uppercase">
                  {language === 'hi' ? 'भुगतान स्थिति' : 'Payment Status'}
                </span>
                <strong className="text-emerald-700 font-semibold text-xs">
                  {proc.paymentStatus || 'Queued'}
                </strong>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 6. Produce Summary & DBT Payment Overview (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Produce Summary */}
        <Card className="p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#17201A]">
                    {t('registerProduce')}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    {language === 'hi'
                      ? 'एमएसपी खरीद के लिए पंजीकृत फसलें'
                      : 'Registered crops & MSP rates'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/farmer/produce')}
                className="text-xs py-1.5 px-3"
              >
                + {language === 'hi' ? 'फसल जोड़ें' : 'Add Crop'}
              </Button>
            </div>

            {profile?.produce && profile.produce.length > 0 ? (
              <div className="space-y-2.5">
                {profile.produce.slice(0, 3).map((crop: any) => (
                  <div
                    key={crop.id}
                    className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" role="img" aria-label="Crop">
                        {getCropEmoji(crop.type)}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-[#17201A]">
                          {crop.type}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          {crop.quantity} {crop.unit || 'Quintals'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#F0FDF4] text-[#16A34A] border border-green-200">
                        ₹{crop.mspRate || 2275} / qt
                      </span>
                      <p className="text-[10px] text-[#64748B] mt-0.5">Govt MSP</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={<Sprout className="w-6 h-6 text-[#16A34A]" />}
                title={
                  language === 'hi'
                    ? 'कोई फसल दर्ज नहीं है'
                    : 'No Harvest Registered Yet'
                }
                description={
                  language === 'hi'
                    ? 'स्लॉट बुक करने के लिए पहले अपनी फसल और अनुमानित मात्रा जोड़ें।'
                    : 'Declare your harvest quantity to become eligible for guaranteed MSP procurement.'
                }
                action={{
                  label: language === 'hi' ? 'फसल जोड़ें' : 'Register Produce',
                  onClick: () => navigate('/farmer/produce'),
                }}
              />
            )}
          </div>

          {profile?.produce?.length > 3 && (
            <button
              onClick={() => navigate('/farmer/produce')}
              className="text-xs font-semibold text-[#16A34A] hover:underline pt-2 text-center"
            >
              {language === 'hi'
                ? `सभी ${profile.produce.length} फसलें देखें`
                : `View all ${profile.produce.length} registered crops`}
            </button>
          )}
        </Card>

        {/* DBT Payment Status / Recent Activity */}
        <Card className="p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#17201A]">
                    {language === 'hi' ? 'डीबीटी भुगतान' : 'DBT Bank Transfer'}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    {language === 'hi'
                      ? 'सीधा बैंक खाता अंतरण'
                      : 'Direct bank account credit'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/farmer/payment')}
                rightIcon={<ChevronRight className="w-4 h-4 text-[#16A34A]" />}
                className="text-xs text-[#16A34A]"
              >
                {t('view')}
              </Button>
            </div>

            {payment ? (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50/70 to-blue-50/50 border border-green-200/80 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                      {language === 'hi' ? 'शुद्ध भुगतान राशि' : 'Net Disbursed Amount'}
                    </span>
                    <p className="text-3xl font-extrabold text-[#14532D] tracking-tight">
                      ₹{payment.netAmount?.toLocaleString('en-IN') || '0'}
                    </p>
                  </div>
                  <StatusBadge
                    status={payment.status || 'COMPLETED'}
                    language={language}
                    size="sm"
                  />
                </div>

                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs text-[#64748B]">
                  <span>{t('dbtReference')}:</span>
                  <span className="font-mono font-bold text-[#17201A] bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                    {payment.dbtReferenceId || 'DBT-GOV-98421'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-gray-50 border border-gray-200/70 p-4 text-center space-y-1.5">
                <CheckCircle2 className="w-7 h-7 text-gray-400 mx-auto" />
                <p className="font-semibold text-xs text-[#17201A]">
                  {language === 'hi' ? 'कोई बकाया भुगतान नहीं' : 'No Pending DBT Payments'}
                </p>
                <p className="text-[11px] text-[#64748B]">
                  {language === 'hi'
                    ? 'खरीद पूरी होने के 48 घंटों के भीतर भुगतान सीधे आपके बैंक खाते में जमा किया जाता है।'
                    : 'Payment is credited directly to your Aadhaar-linked bank account within 48 hours of mandi weighment.'}
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-[#64748B]">
              {language === 'hi' ? 'सरकारी गारंटी' : 'Government Guarantee'}:
            </span>
            <span className="font-semibold text-[#16A34A] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% MSP DBT
            </span>
          </div>
        </Card>
      </div>

      {/* 7. Recent Notifications / Activity Log */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader
            title={t('notifications')}
            description={
              language === 'hi'
                ? 'खरीद और भुगतान संबंधी हालिया सूचनाएं'
                : 'Recent alerts regarding procurement, queue, and payments'
            }
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/farmer/notifications')}
            rightIcon={<ChevronRight className="w-4 h-4 text-[#16A34A]" />}
            className="text-xs text-[#16A34A]"
          >
            {language === 'hi' ? 'सभी देखें' : 'View All'}
          </Button>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-2.5">
            {notifications.slice(0, 3).map((notif: any) => (
              <div
                key={notif.id}
                onClick={() => navigate('/farmer/notifications')}
                className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-150 flex items-start gap-3 hover:shadow-2xs ${
                  !notif.read
                    ? 'bg-emerald-50/60 border-emerald-200/80'
                    : 'bg-white border-gray-200/70 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    !notif.read ? 'bg-[#16A34A] ring-4 ring-green-100' : 'bg-gray-300'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-xs sm:text-sm text-[#17201A] truncate">
                      {language === 'hi' ? notif.titleHi : notif.title}
                    </p>
                    {notif.createdAt && (
                      <span className="text-[10px] text-[#64748B] shrink-0">
                        {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
                    {language === 'hi' ? notif.messageHi : notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            bordered
            icon={<Bell className="w-6 h-6 text-gray-400" />}
            title={language === 'hi' ? 'कोई सूचना नहीं' : 'No Notifications'}
            description={
              language === 'hi'
                ? 'जब आपकी खरीद या भुगतान की स्थिति बदलेगी, यहां अपडेट दिखाई देगा।'
                : 'You are all caught up! Updates regarding your token, queue, and payments will appear here.'
            }
          />
        )}
      </section>
    </div>
  );
}
