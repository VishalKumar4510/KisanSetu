import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { analyticsAPI, queueAPI, centreAPI } from '../../services/api';
import { Users, Calendar, Timer, CheckCircle, Sprout, MapPin, LogOut, Activity, Globe, TrendingUp, ChevronRight, Clock } from 'lucide-react';

export default function OfficerDashboard() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, []);

  const fetchData = async () => {
    try {
      const [kpiRes, centreRes] = await Promise.all([analyticsAPI.getKPIs(), centreAPI.getAll()]);
      setKpis(kpiRes.data.data);
      setCentres(centreRes.data.data || []);
      if (centreRes.data.data.length > 0) {
        const qRes = await queueAPI.getCentreQueue(centreRes.data.data[0].id);
        setQueue(qRes.data.data || []);
      }
    } catch {} finally { setLoading(false); }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-green text-white px-6 py-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t('appName')}</h1>
              <p className="text-green-200 text-xs font-medium">{t('officerDashboard')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block mr-2">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-green-200 text-xs">Procurement Officer</p>
            </div>
            <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all">
              <Globe className="w-4 h-4" />
            </button>
            <button onClick={logout}
              className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6 animate-fadeIn">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger">
          {[
            { label: "Today's Arrivals", value: kpis?.todaysBookings || 0, icon: Calendar, gradient: 'from-blue-500 to-indigo-600' },
            { label: 'In Queue', value: kpis?.activeQueue || 0, icon: Users, gradient: 'from-amber-500 to-orange-600' },
            { label: 'Processing', value: queue.filter(q => q.procurementStatus && !['BOOKED','COMPLETED'].includes(q.procurementStatus)).length, icon: Activity, gradient: 'from-purple-500 to-violet-600' },
            { label: 'Completed', value: kpis?.completedProcurement || 0, icon: CheckCircle, gradient: 'from-emerald-500 to-green-600' },
            { label: 'Avg Wait', value: `${kpis?.avgWaitTime || 0}m`, icon: Timer, gradient: 'from-rose-500 to-red-600' },
          ].map(({ label, value, icon: Icon, gradient }) => (
            <div key={label} className="card hover:shadow-md transition-all duration-300 animate-slideUp">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="stat-value">{value}</p>
                  <p className="stat-label">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Users, label: t('queueManagement'), description: 'Manage live queue and call next', path: '/officer/queue', gradient: 'from-blue-500 to-blue-600' },
            { icon: TrendingUp, label: t('procurementManagement'), description: 'Process procurement stages', path: '/officer/procurement', gradient: 'from-green-500 to-emerald-600' },
            { icon: Users, label: t('farmerManagement'), description: 'View and search farmers', path: '/officer/farmers', gradient: 'from-purple-500 to-violet-600' },
          ].map(({ icon: Icon, label, description, path, gradient }) => (
            <button key={path} onClick={() => navigate(path)}
              className="card-hover text-left py-6 group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md transition-shadow`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-800">{label}</h3>
              <p className="text-xs text-gray-400 mt-1">{description}</p>
              <ChevronRight className="w-4 h-4 text-gray-300 mt-2 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>

        {/* Active Queue */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">{t('liveQueue')}</h2>
              <span className="badge bg-blue-100 text-blue-700 border border-blue-200">{queue.length} active</span>
            </div>
            <button onClick={() => navigate('/officer/queue')} className="text-sm text-green-600 font-semibold flex items-center gap-1 hover:text-green-700">
              Manage <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {queue.length > 0 ? (
            <div className="space-y-2">
              {queue.slice(0, 6).map(q => (
                <div key={q.id} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-sm font-bold text-green-700">#{q.queuePosition}</span>
                  <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{q.farmerName}</p>
                      <p className="text-xs text-gray-400 font-mono">{q.tokenNumber}</p>
                    </div>
                    <p className="text-sm text-gray-500">{q.produce} {q.quantity}</p>
                    <span className={`badge text-[10px] justify-self-center ${q.procurementStatus === 'BOOKED' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>{q.procurementStatus || 'WAITING'}</span>
                    <p className="text-xs text-gray-400 justify-self-end flex items-center gap-1"><Clock className="w-3 h-3" />{q.estimatedTime || '-'}m</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-8">{t('noData')}</p>}
        </div>
      </div>
    </div>
  );
}
