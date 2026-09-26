import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { analyticsAPI, centreAPI, queueAPI, paymentAPI, demoAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import {
  Users,
  Calendar,
  Clock,
  Timer,
  CheckCircle,
  IndianRupee,
  Sprout,
  BarChart3,
  MapPin,
  Activity,
  Play,
  Square,
  FileText,
  CreditCard,
  Building2,
  Sliders,
  ChevronRight,
  Zap,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ShieldCheck,
  Search,
  ExternalLink,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ProgressMetricCard } from '@/components/ui/progress-metric-card';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Core State
  const [kpis, setKpis] = useState<any>(null);
  const [centres, setCentres] = useState<any[]>([]);
  const [selectedCentreFilter, setSelectedCentreFilter] = useState('ALL');
  const [queue, setQueue] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [demo, setDemo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [demoSpeed, setDemoSpeed] = useState(1);
  const [demoOperating, setDemoOperating] = useState(false);

  // Active Command Tab View
  const [activeTab, setActiveTab] = useState<'all' | 'centres' | 'queue' | 'payments' | 'analytics' | 'reports'>('all');

  // Analytics Period
  const [analyticsPeriod, setAnalyticsPeriod] = useState('7d');
  const [charts, setCharts] = useState<Record<string, any[]>>({});
  const [centreComp, setCentreComp] = useState<any[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(false);

  // Live Time
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString('en-IN'));

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('en-IN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async (isPolling = false) => {
    if (!isPolling) setRefreshing(true);
    try {
      const [kR, cR, pR, dR] = await Promise.all([
        analyticsAPI.getKPIs(),
        centreAPI.getAll(),
        paymentAPI.getAll(),
        demoAPI.getState(),
      ]);
      setKpis(kR.data.data);
      const allCentres = cR.data.data || [];
      setCentres(allCentres);
      setPayments(pR.data.data || []);
      setDemo(dR.data.data);

      if (allCentres.length > 0) {
        const targetCentreId = selectedCentreFilter !== 'ALL' ? selectedCentreFilter : allCentres[0].id;
        const qR = await queueAPI.getCentreQueue(targetCentreId);
        setQueue(qR.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCentreFilter]);

  // Initial load and polling every 12 seconds
  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => fetchData(true), 12000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Fetch charts when tab is analytics or all
  const fetchAnalyticsCharts = useCallback(async () => {
    setLoadingCharts(true);
    try {
      const types = ['registrations', 'bookings', 'waitTime', 'queueLength', 'utilization', 'procurement', 'payments'];
      const results = await Promise.all(
        types.map((type) =>
          analyticsAPI.getChartData(
            type,
            analyticsPeriod,
            selectedCentreFilter !== 'ALL' ? selectedCentreFilter : undefined
          )
        )
      );
      const data: Record<string, any[]> = {};
      types.forEach((type, i) => {
        data[type] = results[i].data.data || [];
      });
      setCharts(data);
      const compRes = await analyticsAPI.getCentreComparison();
      setCentreComp(compRes.data.data || []);
    } catch (err) {
      console.error('Failed to load analytics chart data:', err);
    } finally {
      setLoadingCharts(false);
    }
  }, [analyticsPeriod, selectedCentreFilter]);

  useEffect(() => {
    if (activeTab === 'all' || activeTab === 'analytics') {
      fetchAnalyticsCharts();
    }
  }, [activeTab, fetchAnalyticsCharts]);

  // Demo Controls
  const handleStartDemo = async () => {
    setDemoOperating(true);
    try {
      await demoAPI.start(demoSpeed);
      const dR = await demoAPI.getState();
      setDemo(dR.data.data);
      toast.success('Simulation Active', `Demo running at ${demoSpeed}x speed`);
      fetchData(false);
    } catch (err: any) {
      toast.error('Simulation Failed', err.response?.data?.error || 'Failed to start demo simulation');
    } finally {
      setDemoOperating(false);
    }
  };

  const handleStopDemo = async () => {
    setDemoOperating(true);
    try {
      await demoAPI.stop();
      const dR = await demoAPI.getState();
      setDemo(dR.data.data);
      toast.info('Simulation Paused', 'Demo simulation halted');
      fetchData(false);
    } catch (err: any) {
      toast.error('Simulation Error', err.response?.data?.error || 'Failed to stop demo simulation');
    } finally {
      setDemoOperating(false);
    }
  };

  const handleStepDemo = async () => {
    setDemoOperating(true);
    try {
      await demoAPI.step();
      const dR = await demoAPI.getState();
      setDemo(dR.data.data);
      toast.success('Step Executed', 'Advanced simulation by one event');
      fetchData(false);
    } catch (err: any) {
      toast.error('Simulation Error', err.response?.data?.error || 'Failed to advance demo step');
    } finally {
      setDemoOperating(false);
    }
  };

  // Payment Quick Process
  const handleProcessPayment = async (paymentId: string) => {
    try {
      await paymentAPI.process(paymentId);
      toast.success('Payment Initiated', 'Direct DBT transfer processed successfully');
      await fetchData(false);
    } catch (e: any) {
      toast.error('Payment Failed', e.response?.data?.error || 'Failed to process payment');
    }
  };

  // Congestion Badge
  const congestionBadge = (level: string) => {
    const l = (level || 'GREEN').toUpperCase();
    if (l === 'RED') {
      return {
        cls: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500 animate-ping',
        text: 'CONGESTED',
      };
    }
    if (l === 'YELLOW') {
      return {
        cls: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        text: 'MODERATE',
      };
    }
    return {
      cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      text: 'NORMAL',
    };
  };

  // Calculated Metrics
  const totalDisbursedValue = useMemo(() => {
    return payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (p.netAmount || 0), 0);
  }, [payments]);

  const totalDeductionsValue = useMemo(() => {
    return payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (p.deductions || 0), 0);
  }, [payments]);

  const avgUtilization = useMemo(() => {
    if (!centres.length) return 0;
    const total = centres.reduce((sum, c) => sum + (c.stats?.utilization || 0), 0);
    return Math.round(total / centres.length);
  }, [centres]);

  // Dynamic day-over-day trend calculation helper
  const calculateSeriesTrend = useCallback((series?: Array<{ value?: number; count?: number; quantity?: number; amount?: number }>) => {
    if (!series || series.length < 2) return null;
    const last = series[series.length - 1];
    const prev = series[series.length - 2];
    const lastVal = last?.value ?? last?.count ?? last?.quantity ?? last?.amount;
    const prevVal = prev?.value ?? prev?.count ?? prev?.quantity ?? prev?.amount;

    if (typeof lastVal !== 'number' || typeof prevVal !== 'number' || isNaN(lastVal) || isNaN(prevVal)) {
      return null;
    }

    if (prevVal === 0) {
      if (lastVal === 0) return { text: '0%', type: 'neutral' as const };
      return { text: `+${lastVal}`, type: 'positive' as const };
    }

    const delta = lastVal - prevVal;
    const pct = Math.round((delta / Math.abs(prevVal)) * 100);

    return {
      text: `${pct >= 0 ? '+' : ''}${pct}%`,
      type: pct > 0 ? ('positive' as const) : pct < 0 ? ('negative' as const) : ('neutral' as const),
    };
  }, []);

  // Real dynamic trends from time series data
  const registrationTrend = useMemo(() => calculateSeriesTrend(charts.registrations), [charts.registrations, calculateSeriesTrend]);
  const bookingsTrend = useMemo(() => calculateSeriesTrend(charts.bookings), [charts.bookings, calculateSeriesTrend]);
  const procurementTrend = useMemo(() => calculateSeriesTrend(charts.procurement), [charts.procurement, calculateSeriesTrend]);

  // Real dynamic DBT success rate calculated from payments collection
  const dbtSuccessMetrics = useMemo(() => {
    if (!payments || payments.length === 0) return null;
    const completed = payments.filter((p) => p.status === 'COMPLETED').length;
    const total = payments.length;
    const rate = Math.round((completed / total) * 1000) / 10;
    return {
      text: `${rate}%`,
      type: rate >= 90 ? ('positive' as const) : rate >= 70 ? ('neutral' as const) : ('negative' as const),
      completed,
      total,
    };
  }, [payments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] text-slate-800">
        <div className="text-center animate-in fade-in">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <Sprout className="w-7 h-7 text-white" />
          </div>
          <p className="text-slate-600 font-semibold text-sm">
            Initializing State Agricultural Command Centre...
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Connecting to APMC Mandi Telemetry Streams
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F5] text-slate-900 pb-20">
      {/* 1. STATE COMMAND CENTRE TELEMETRY BAR */}
      <section className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
                  State Agricultural Operations Command Centre
                </span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="hidden sm:inline-block text-[11px] text-slate-300 font-mono">
                  District Hub #01
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Department of Agriculture & Farmers Welfare • Mandi Procurement Network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
            <div className="bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300">Live Clock:</span>
              <strong className="text-white">{liveTime}</strong>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-300">
              Mandis Online: <strong className="text-emerald-400">{centres.length} APMC Centers</strong>
            </div>

            <button
              type="button"
              onClick={() => fetchData(false)}
              disabled={refreshing}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-sans font-semibold">Sync</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. DEMO CONTROLLER ENGINE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        {demo?.isRunning ? (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-amber-900 tracking-wide uppercase">
                    Live Demo Simulation Running
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200 text-amber-900 border border-amber-300">
                    Step: {demo.currentStep?.replace(/_/g, ' ') || 'ACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5 font-mono truncate max-w-xl">
                  {demo.log?.[demo.log.length - 1] || 'Simulating farmer booking, weighbridge, quality and DBT clearing...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={handleStepDemo}
                disabled={demoOperating}
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" /> Step Forward
              </button>
              <button
                type="button"
                onClick={handleStopDemo}
                disabled={demoOperating}
                className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5" /> Halt Simulation
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 px-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                <Zap className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 block">
                  Autonomous Mandi Simulation Engine
                </span>
                <span className="text-[11px] text-slate-500">
                  Inject live test traffic: farmer slot booking, queue sequencing, weighment, QC, and DBT payments.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-mono font-semibold">
                {[1, 2, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDemoSpeed(s)}
                    className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
                      demoSpeed === s ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleStartDemo}
                disabled={demoOperating}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Simulation</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. DISTRICT & STATE KPI METRICS (Enhanced with 21st.dev Progress Metric Card reference) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-3" aria-label="District Agricultural Operations KPIs">
        {/* Top Featured Progress Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ProgressMetricCard
            title="Farmers Registered"
            value={kpis?.farmersRegistered || 0}
            unit="farmers"
            change={registrationTrend?.text}
            changeType={registrationTrend?.type || 'neutral'}
            subText="Verified Aadhaar & Land KYC"
            icon={<Users className="w-4 h-4" />}
            color="#16A34A"
            data={
              charts.registrations?.length
                ? charts.registrations.map((d: any) => ({ val: Number(d.value ?? d.count ?? 0) }))
                : (kpis?.farmersRegistered ? [{ val: Number(kpis.farmersRegistered) }] : [])
            }
          />

          <ProgressMetricCard
            title="Today's Slots"
            value={kpis?.todaysBookings || 0}
            unit="slots"
            change={bookingsTrend?.text}
            changeType={bookingsTrend?.type || 'neutral'}
            subText="Mandi arrival reservations"
            icon={<Calendar className="w-4 h-4" />}
            color="#2563EB"
            data={
              charts.bookings?.length
                ? charts.bookings.map((d: any) => ({ val: Number(d.value ?? d.count ?? 0) }))
                : (kpis?.todaysBookings ? [{ val: Number(kpis.todaysBookings) }] : [])
            }
          />

          <ProgressMetricCard
            title="Completed Lots"
            value={kpis?.completedProcurement || 0}
            unit="lots"
            change={procurementTrend?.text}
            changeType={procurementTrend?.type || 'neutral'}
            subText="Weighed & quality assayed"
            icon={<CheckCircle className="w-4 h-4" />}
            color="#15803D"
            data={
              charts.procurement?.length
                ? charts.procurement.map((d: any) => ({ val: Number(d.value ?? d.quantity ?? 0) }))
                : (kpis?.completedProcurement ? [{ val: Number(kpis.completedProcurement) }] : [])
            }
          />

          <ProgressMetricCard
            title="DBT Disbursed"
            value={formatCurrency(totalDisbursedValue || kpis?.paymentsProcessed * 25000 || 0)}
            unit=""
            change={dbtSuccessMetrics?.text}
            changeType={dbtSuccessMetrics?.type || 'positive'}
            subText={
              dbtSuccessMetrics
                ? `${dbtSuccessMetrics.completed} of ${dbtSuccessMetrics.total} DBT credits settled`
                : 'Direct treasury bank credit'
            }
            icon={<IndianRupee className="w-4 h-4" />}
            color="#16A34A"
            data={
              charts.payments?.length
                ? charts.payments.map((d: any) => ({ val: Number(d.value ?? d.amount ?? 0) }))
                : (totalDisbursedValue ? [{ val: totalDisbursedValue }] : [])
            }
          />
        </div>

        {/* Secondary High-Density Telemetry Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            {
              id: 'queue',
              label: 'Active Queue',
              value: kpis?.activeQueue || 0,
              unit: 'tokens',
              sub: 'At Mandi bays',
              icon: Clock,
              color: 'text-amber-700',
              badge: 'bg-amber-50 text-amber-800 border border-amber-200/60',
            },
            {
              id: 'wait',
              label: 'Avg Gate Wait',
              value: `${kpis?.avgWaitTime || 0}`,
              unit: 'mins',
              sub: 'Across Mandi bays',
              icon: Timer,
              color: 'text-slate-800',
              badge: 'bg-slate-100 text-slate-700 border border-slate-200/60',
            },
            {
              id: 'utilization',
              label: 'Network Load',
              value: `${avgUtilization}%`,
              unit: 'cap.',
              sub: 'Mandi bays active',
              icon: Activity,
              color: 'text-slate-900',
              badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
            },
            {
              id: 'dbt_rate',
              label: 'DBT Success',
              value: dbtSuccessMetrics ? dbtSuccessMetrics.text : '100%',
              unit: 'PFMS',
              sub: dbtSuccessMetrics ? `${dbtSuccessMetrics.completed}/${dbtSuccessMetrics.total} settled` : 'PFMS bridge active',
              icon: ShieldCheck,
              color: 'text-emerald-700',
              badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
            },
          ].map((kpi) => (
            <div
              key={kpi.id}
              className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                  {kpi.label}
                </span>
                <div className={`p-1 rounded-md ${kpi.badge}`}>
                  <kpi.icon className="w-3 h-3" />
                </div>
              </div>

              <div className="flex items-baseline gap-1 my-0.5 truncate">
                <span className={`text-base sm:text-lg font-black font-mono tracking-tight ${kpi.color} truncate`}>
                  {kpi.value}
                </span>
                {kpi.unit && (
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    {kpi.unit}
                  </span>
                )}
              </div>

              <span className="text-[10px] text-slate-500 truncate block">
                {kpi.sub}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. MODULE NAVIGATION & FILTERS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Segmented View Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {[
              { id: 'all', label: 'Command Centre Overview', icon: Activity },
              { id: 'centres', label: 'Centre Monitoring', icon: Building2 },
              { id: 'queue', label: 'Live Queue & Congestion', icon: Clock },
              { id: 'payments', label: 'Payment & DBT Pipeline', icon: CreditCard },
              { id: 'analytics', label: 'District Analytics & Charts', icon: BarChart3 },
              { id: 'reports', label: 'Impact & Reports', icon: FileText },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap text-xs ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Centre Filter Dropdown */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">APMC Filter:</span>
            <select
              value={selectedCentreFilter}
              onChange={(e) => setSelectedCentreFilter(e.target.value)}
              className="py-1.5 pl-2.5 pr-8 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="ALL">All District Mandis ({centres.length})</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.district})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 5. MAIN COMMAND VIEW CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* ================================================================ */}
        {/* SECTION: CENTRE MONITORING & CONGESTION RADAR                    */}
        {/* ================================================================ */}
        {(activeTab === 'all' || activeTab === 'centres') && (
          <section className="space-y-3" aria-labelledby="centres-radar-heading">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <h2 id="centres-radar-heading" className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  APMC Mandi Congestion & Facility Telemetry
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/centres')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
              >
                <span>Full Facility Screen</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {centres.map((c) => {
                const cStats = c.stats || {};
                const congestion = congestionBadge(c.congestionLevel || cStats.congestionLevel || 'GREEN');
                const util = cStats.utilization || 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => navigate('/admin/centres')}
                    className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{c.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{c.location}, {c.district}</span>
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shrink-0 ${congestion.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${congestion.dot}`} />
                        {congestion.text}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-mono font-bold text-slate-900 block">{c.availableSlots || 0}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Slots</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-mono font-bold text-slate-900 block">{cStats.queueLength || 0}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Queue</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-mono font-bold text-slate-900 block">{cStats.avgWaitTime || 0}m</span>
                        <span className="text-[10px] text-slate-500 font-medium">Avg Wait</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-mono font-bold text-slate-900 block">{c.activeBays || 2}/{c.totalBays || c.activeBays || 2}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Bays</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1">
                        <span>Weighbridge Capacity Utilization</span>
                        <span className="font-mono font-bold text-slate-800">{util}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            util > 80 ? 'bg-rose-500' : util > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, util)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================ */}
        {/* SECTION: LIVE QUEUE & CONGESTION TELEMETRY                       */}
        {/* ================================================================ */}
        {(activeTab === 'all' || activeTab === 'queue') && (
          <section className="space-y-3" aria-labelledby="queue-telemetry-heading">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h2 id="queue-telemetry-heading" className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  Live Mandi Queue & Gate Inflow
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                {queue.length} Tokens in Active Queue
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {queue.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">No active queue tokens registered at this Mandi bay</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use the Demo Engine to simulate incoming farmer lots</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-4 w-28">Queue Pos</th>
                        <th className="py-2.5 px-4">Farmer Details</th>
                        <th className="py-2.5 px-4 w-36">Produce / Qty</th>
                        <th className="py-2.5 px-4 w-36">Gate Status</th>
                        <th className="py-2.5 px-4 w-40">Mandi Facility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queue.slice(0, 8).map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-bold text-xs">
                                #{q.queuePosition}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500 font-medium">
                                {q.tokenNumber || 'TKN-...'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 text-xs block">{q.farmerName || 'Registered Farmer'}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{q.farmerId || 'KS-FARM-...'}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-semibold text-slate-800 text-xs block">{q.produce || q.produce?.type || 'WHEAT'}</span>
                            <span className="text-[11px] text-slate-500 font-medium">{q.quantity || 25} Qt</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <StatusBadge status={q.procurementStatus || 'WAITING'} size="sm" />
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-xs">
                            <span className="font-medium text-slate-900 block truncate">{q.centreName || 'APMC Mandi'}</span>
                            <span className="text-[10px] text-slate-500">Bay #1 (Calibrated)</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ================================================================ */}
        {/* SECTION: PAYMENT MONITORING & DBT STATUS PIPELINE                */}
        {/* ================================================================ */}
        {(activeTab === 'all' || activeTab === 'payments') && (
          <section className="space-y-3" aria-labelledby="payments-dbt-heading">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <h2 id="payments-dbt-heading" className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  Payment Monitoring & DBT Disbursal Pipeline
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/payments')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
              >
                <span>Full Payments Desk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Gross MSP</span>
                <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
                  {formatCurrency(totalDisbursedValue + totalDeductionsValue)}
                </span>
                <span className="text-[10px] text-slate-500">Statutory crop valuation</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-rose-600 block">Mandi Cess (2%)</span>
                <span className="text-xl font-black font-mono text-rose-700 mt-1 block">
                  -{formatCurrency(totalDeductionsValue)}
                </span>
                <span className="text-[10px] text-slate-500">State Marketing Board cess</span>
              </div>
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[10px] uppercase font-extrabold text-emerald-800 block">Net DBT Credited</span>
                <span className="text-xl font-black font-mono text-emerald-950 mt-1 block">
                  {formatCurrency(totalDisbursedValue)}
                </span>
                <span className="text-[10px] text-emerald-700">Disbursed via PFMS bridge</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-amber-600 block">Pending Batch</span>
                <span className="text-xl font-black font-mono text-amber-700 mt-1 block">
                  {payments.filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING').length} Lots
                </span>
                <span className="text-[10px] text-slate-500">Awaiting bank settlement</span>
              </div>
            </div>

            {/* DBT Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-4 w-32">Farmer ID</th>
                      <th className="py-2.5 px-4">Beneficiary</th>
                      <th className="py-2.5 px-4 w-28">Produce</th>
                      <th className="py-2.5 px-4 w-28">Gross (₹)</th>
                      <th className="py-2.5 px-4 w-28">Cess (₹)</th>
                      <th className="py-2.5 px-4 w-32">Net Disbursed</th>
                      <th className="py-2.5 px-4 w-28">DBT Status</th>
                      <th className="py-2.5 px-4 w-36">Bank UTR / Ref</th>
                      <th className="py-2.5 px-4 w-24 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.slice(0, 6).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600 font-bold">
                          {p.farmerId ? p.farmerId.slice(0, 14) : 'KS-FARM-...'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 text-xs block">{p.farmerName || 'Beneficiary'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{p.maskedBankAccount || '•••• 4138'}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                          {p.produce?.type || p.crop || 'WHEAT'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700">
                          {formatCurrency(p.grossAmount || 0)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-rose-600 font-medium">
                          -{formatCurrency(p.deductions || 0)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-emerald-800 text-xs">
                          {formatCurrency(p.netAmount || 0)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge status={p.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px] truncate">
                          {p.utr || p.dbtReferenceId || '982440385255'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {p.status === 'PENDING' || p.status === 'PROCESSING' ? (
                            <button
                              type="button"
                              onClick={() => handleProcessPayment(p.id)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs"
                            >
                              Disburse
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-semibold px-2 py-0.5 bg-emerald-50 rounded">
                              Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================ */}
        {/* SECTION: DISTRICT ANALYTICS & RECHARTS VISUALIZATIONS            */}
        {/* ================================================================ */}
        {(activeTab === 'all' || activeTab === 'analytics') && (
          <section className="space-y-3" aria-labelledby="analytics-visuals-heading">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                <h2 id="analytics-visuals-heading" className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  State Agricultural Analytics & Recharts Telemetry
                </h2>
              </div>

              {/* Period Filters */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 text-xs">
                {[
                  { key: 'today', label: 'Today' },
                  { key: '7d', label: 'Last 7 Days' },
                  { key: '30d', label: 'Last 30 Days' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setAnalyticsPeriod(p.key)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                      analyticsPeriod === p.key
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingCharts ? (
              <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                <p className="text-xs font-semibold">Updating district chart telemetry...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Farmer Registrations */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Farmer Registrations
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">KYC Verified</span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={charts.registrations || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 2. Daily Bookings */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Daily Slot Bookings
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">Confirmed Digital Passes</span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={charts.bookings || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 3. Average Wait Time */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Gate Waiting Time (Minutes)
                    </h3>
                    <span className="text-[10px] text-amber-700 font-bold">Target &lt; 20m</span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={charts.waitTime || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 4. Queue Length Telemetry */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Queue Inflow & Congestion
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">Bays Active</span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={charts.queueLength || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="value" stroke="#ea580c" fill="#ffedd5" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================================================================ */}
        {/* SECTION: OPERATIONAL REPORTS & PROTOTYPE IMPACT METRICS          */}
        {/* ================================================================ */}
        {(activeTab === 'all' || activeTab === 'reports') && (
          <section className="space-y-3" aria-labelledby="reports-impact-heading">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <h2 id="reports-impact-heading" className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  Operational Impact & SIH 2026 Audit Benchmarks
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/reports')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
              >
                <span>Full Reports Module</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Gate Waiting Time', value: '42%', direction: 'down', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { label: 'Mandi Congestion', value: '35%', direction: 'down', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { label: 'Unplanned Visits', value: '50%', direction: 'down', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { label: 'Slot Utilization', value: '28%', direction: 'up', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                { label: 'Digital Bookings', value: '65%', direction: 'up', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                { label: 'Payment Visibility', value: '90%', direction: 'up', color: 'text-blue-700 bg-blue-50 border-blue-200' },
              ].map((m) => (
                <div key={m.label} className={`p-4 rounded-xl border text-center ${m.color}`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {m.direction === 'down' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    <span className="text-xl font-black font-mono">{m.value}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{m.label}</p>
                  <p className="text-[10px] opacity-75 font-semibold">
                    {m.direction === 'down' ? '↓ Reduction' : '↑ Increase'}
                  </p>
                </div>
              ))}
            </div>

            {/* Vision Banner */}
            <div className="p-6 bg-gradient-to-r from-emerald-900 to-green-950 text-white rounded-2xl border border-emerald-800/60 shadow-xs text-center space-y-2">
              <p className="text-base sm:text-lg font-medium leading-relaxed max-w-4xl mx-auto text-emerald-100">
                “Instead of farmers travelling blindly to crowded procurement centres and waiting for hours,
                KisanSetu provides a scheduled slot, digital token, live queue, procurement tracking,
                and transparent DBT payment settlement.”
              </p>
              <span className="text-xs text-emerald-400 font-bold block pt-1">
                — KisanSetu Mission Statement • Smart India Hackathon 2026
              </span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
