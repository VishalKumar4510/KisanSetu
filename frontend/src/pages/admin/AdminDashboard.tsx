import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { analyticsAPI, centreAPI, queueAPI, paymentAPI, demoAPI } from '../../services/api';
import { Users, Calendar, Clock, Timer, CheckCircle, IndianRupee, Sprout, BarChart3, MapPin, LogOut, Activity, Play, Square, FileText, CreditCard, Building2, Sliders, ChevronRight, Globe, Zap } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [kpis, setKpis] = useState<any>(null);
  const [centres, setCentres] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [demo, setDemo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, []);

  const fetchData = async () => {
    try {
      const [kR, cR, pR, dR] = await Promise.all([analyticsAPI.getKPIs(), centreAPI.getAll(), paymentAPI.getAll(), demoAPI.getState()]);
      setKpis(kR.data.data); setCentres(cR.data.data || []); setPayments(pR.data.data || []); setDemo(dR.data.data);
      if (cR.data.data?.length > 0) { const qR = await queueAPI.getCentreQueue(cR.data.data[0].id); setQueue(qR.data.data || []); }
    } catch {} finally { setLoading(false); }
  };

  const handleDemo = async () => {
    try { if (demo?.isRunning) { await demoAPI.stop(); } else { await demoAPI.start(1); } const dR = await demoAPI.getState(); setDemo(dR.data.data); } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center animate-fadeIn">
        <div className="w-16 h-16 gradient-green rounded-2xl flex items-center justify-center mx-auto mb-4 glow-green">
          <Sprout className="w-8 h-8 text-white animate-pulse" />
        </div>
        <p className="text-gray-400 text-sm">{t('loading')}</p>
      </div>
    </div>
  );

  const congestionBadge = (level: string) => {
    const styles: Record<string, string> = {
      GREEN: 'bg-green-100 text-green-700 border-green-200',
      YELLOW: 'bg-amber-100 text-amber-700 border-amber-200',
      RED: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[level] || styles.GREEN;
  };

  const navItems = [
    { icon: Activity, label: t('dashboard'), path: '/admin' },
    { icon: Building2, label: t('centreMonitoring'), path: '/admin/centres' },
    { icon: Sliders, label: t('slotManagement'), path: '/admin/slots' },
    { icon: CreditCard, label: t('paymentMonitoring'), path: '/admin/payments' },
    { icon: BarChart3, label: t('analytics'), path: '/admin/analytics' },
    { icon: FileText, label: t('reports'), path: '/admin/reports' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-green text-white px-6 py-4 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t('appName')}</h1>
              <p className="text-green-200 text-xs font-medium">{t('adminDashboard')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Demo Button */}
            <button onClick={handleDemo}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 ${
                demo?.isRunning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white text-green-700 hover:bg-green-50'
              }`}>
              {demo?.isRunning ? <><Square className="w-4 h-4" /> {t('stopDemo')}</> : <><Play className="w-4 h-4" /> {t('startDemo')}</>}
            </button>
            <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all">
              <Globe className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/20">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-green-200 text-xs">Administrator</p>
              </div>
              <button onClick={logout} className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <nav className="w-60 min-h-[calc(100vh-72px)] bg-white border-r border-gray-100 py-6 px-3 hidden md:block">
          <div className="space-y-1">
            {navItems.map(({ icon: Icon, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <button key={path} onClick={() => navigate(path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive ? 'bg-green-50 text-green-700 shadow-sm border border-green-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}>
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-green-600' : ''}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 px-6 py-6 space-y-6 animate-fadeIn">
          {/* Demo Banner */}
          {demo?.isRunning && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between animate-scaleIn shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-amber-800">Live Demo Running</p>
                  <p className="text-sm text-amber-600">Step: {demo.currentStep?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="text-xs text-amber-600 max-w-sm truncate bg-amber-100/50 px-3 py-1.5 rounded-lg">
                {demo.log?.[demo.log.length - 1]}
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger">
            {[
              { icon: Users, label: t('farmersRegistered'), value: kpis?.farmersRegistered || 0, gradient: 'from-green-500 to-emerald-600', bg: 'bg-green-50' },
              { icon: Calendar, label: t('todaysBookings'), value: kpis?.todaysBookings || 0, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
              { icon: Clock, label: t('activeQueue'), value: kpis?.activeQueue || 0, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
              { icon: Timer, label: t('avgWaitTime'), value: `${kpis?.avgWaitTime || 0}m`, gradient: 'from-rose-500 to-red-600', bg: 'bg-rose-50' },
              { icon: CheckCircle, label: t('completedProcurement'), value: kpis?.completedProcurement || 0, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50' },
              { icon: IndianRupee, label: t('paymentsProcessed'), value: kpis?.paymentsProcessed || 0, gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50' },
            ].map(({ icon: Icon, label, value, gradient, bg }) => (
              <div key={label} className="card hover:shadow-md transition-all duration-300 animate-slideUp">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="stat-value">{value}</p>
                <p className="stat-label">{label}</p>
              </div>
            ))}
          </div>

          {/* Centre Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{t('centreMonitoring')}</h2>
              <button onClick={() => navigate('/admin/centres')} className="text-sm text-green-600 font-semibold flex items-center gap-1 hover:text-green-700">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {centres.slice(0, 3).map(c => (
                <div key={c.id} className="card-hover" onClick={() => navigate('/admin/centres')}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800">{c.name}</h3>
                    <span className={`badge border ${congestionBadge(c.congestionLevel || c.stats?.congestionLevel || 'GREEN')}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${c.congestionLevel === 'RED' ? 'bg-red-500' : c.congestionLevel === 'YELLOW' ? 'bg-amber-500' : 'bg-green-500'}`} />
                      {c.congestionLevel || c.stats?.congestionLevel || 'GREEN'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 flex items-center gap-1 mb-4">
                    <MapPin className="w-3 h-3" />{c.location}, {c.district}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl py-2.5"><p className="text-lg font-bold text-gray-800">{c.availableSlots || 0}</p><p className="text-[10px] text-gray-400 font-medium">Slots</p></div>
                    <div className="bg-gray-50 rounded-xl py-2.5"><p className="text-lg font-bold text-gray-800">{c.stats?.queueLength || 0}</p><p className="text-[10px] text-gray-400 font-medium">Queue</p></div>
                    <div className="bg-gray-50 rounded-xl py-2.5"><p className="text-lg font-bold text-gray-800">{c.stats?.avgWaitTime || 0}m</p><p className="text-[10px] text-gray-400 font-medium">Wait</p></div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-gray-400 font-medium mb-1">
                      <span>{t('utilization')}</span><span>{c.stats?.utilization || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full transition-all duration-700 ${(c.stats?.utilization || 0) > 80 ? 'bg-red-500' : (c.stats?.utilization || 0) > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, c.stats?.utilization || 0)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Queue & Payments Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Queue */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">{t('liveQueue')}</h2>
                <span className="badge bg-blue-100 text-blue-700">{queue.length} active</span>
              </div>
              {queue.length > 0 ? (
                <div className="space-y-2">
                  {queue.slice(0, 5).map((q, i) => (
                    <div key={q.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                      <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">#{q.queuePosition}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{q.farmerName}</p>
                        <p className="text-xs text-gray-400">{q.produce} {q.quantity}</p>
                      </div>
                      <span className="badge bg-blue-50 text-blue-600 text-[10px] border border-blue-100">{q.procurementStatus || 'WAITING'}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-sm text-center py-6">{t('noData')}</p>}
            </div>

            {/* Payments */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">{t('payment')}</h2>
                <button onClick={() => navigate('/admin/payments')} className="text-sm text-green-600 font-semibold">View All →</button>
              </div>
              {payments.length > 0 ? (
                <div className="space-y-2">
                  {payments.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{p.farmerName || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{p.produce?.type || '-'}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-800">₹{(p.netAmount || 0).toLocaleString()}</p>
                      <span className={`badge text-[10px] border ${p.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-sm text-center py-6">{t('noData')}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
