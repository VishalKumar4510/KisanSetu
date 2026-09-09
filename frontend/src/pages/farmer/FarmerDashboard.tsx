import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { farmerAPI, queueAPI, notificationAPI } from '../../services/api';
import { LayoutDashboard, Users, Ticket, TrendingUp, User, Calendar, MapPin, Clock, CreditCard, Bell, ChevronRight, Sprout, Package, Globe, LogOut, Zap, CheckCircle2 } from 'lucide-react';

const statusSteps = ['BOOKED','ARRIVED','GATE_ENTRY','WEIGHING','QUALITY_CHECK','PROCUREMENT','PAYMENT_PENDING','PAYMENT_PROCESSING','COMPLETED'];

function getStatusBg(status: string) {
  const m: Record<string, string> = {
    BOOKED: 'bg-blue-100 text-blue-700', ARRIVED: 'bg-amber-100 text-amber-700',
    GATE_ENTRY: 'bg-orange-100 text-orange-700', WEIGHING: 'bg-purple-100 text-purple-700',
    QUALITY_CHECK: 'bg-indigo-100 text-indigo-700', PROCUREMENT: 'bg-green-100 text-green-700',
    PAYMENT_PENDING: 'bg-yellow-100 text-yellow-700', PAYMENT_PROCESSING: 'bg-cyan-100 text-cyan-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
  };
  return m[status] || 'bg-gray-100 text-gray-700';
}

function getStatusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export default function FarmerDashboard() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [queuePos, setQueuePos] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, []);

  const fetchData = async () => {
    try {
      const [profileRes, queueRes, notifRes] = await Promise.all([
        farmerAPI.getProfile(), queueAPI.getPosition(), notificationAPI.getAll()
      ]);
      setProfile(profileRes.data.data);
      setQueuePos(queueRes.data.data);
      setNotifications(notifRes.data.data?.notifications?.slice(0, 3) || []);
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

  const proc = profile?.activeProcurement;
  const token = profile?.activeToken;
  const payment = profile?.latestPayment;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="gradient-green text-white px-5 pt-5 pb-8 rounded-b-[2rem] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">{t('appName')}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center text-xs font-bold hover:bg-white/25 transition-all">
                {language === 'en' ? 'हिं' : 'EN'}
              </button>
              <button onClick={() => navigate('/farmer/notifications')} className="relative w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold ring-2 ring-green-700">{unreadCount}</span>}
              </button>
              <button onClick={logout} className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Welcome */}
          <div className="mt-2">
            <p className="text-green-200 text-sm font-medium">{t('welcome')},</p>
            <p className="font-bold text-2xl mt-0.5">{profile?.name || user?.name}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-green-200 text-xs bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                {profile?.farmerId}
              </span>
              <span className="text-green-200 text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {profile?.village}, {profile?.district}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4 animate-slideUp">
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 stagger">
          {[
            { icon: Calendar, label: t('bookSlot'), path: '/farmer/centres', gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
            { icon: Users, label: t('liveQueue'), path: '/farmer/queue', gradient: 'from-orange-500 to-amber-600', bg: 'bg-orange-50' },
            { icon: Ticket, label: t('myToken'), path: '/farmer/token', gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50' },
            { icon: CreditCard, label: t('payment'), path: '/farmer/payment', gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50' },
          ].map(({ icon: Icon, label, path, gradient, bg }) => (
            <button key={path} onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white shadow-sm border border-gray-100/80 hover:shadow-md hover:border-gray-200 transition-all duration-300 active:scale-95`}>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-gray-600 text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>

        {/* Token & Queue Card */}
        {token && (
          <div onClick={() => navigate('/farmer/token')} className="card-hover animate-scaleIn">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('tokenNumber')}</p>
                <p className="text-3xl font-extrabold text-green-700 mt-1 tracking-tight">{token.tokenNumber}</p>
                <span className="badge bg-green-100 text-green-700 mt-2">● Active</span>
              </div>
              {queuePos && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center pulse-green shadow-lg">
                    <div className="text-white">
                      <p className="text-3xl font-extrabold">{queuePos.position}</p>
                      <p className="text-[9px] font-medium opacity-80 uppercase tracking-wider">Position</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    <Clock className="w-3 h-3 inline mr-0.5" /> ~{queuePos.estimatedTime} min
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Procurement Status */}
        {proc && (
          <div onClick={() => navigate('/farmer/procurement')} className="card-hover">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">{t('procurementStatus')}</h3>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className={`badge ${getStatusBg(proc.status)}`}>
                {getStatusLabel(proc.status)}
              </span>
              {proc.centreName && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {proc.centreName}
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-1">
              {statusSteps.map((s, i) => {
                const currentIdx = statusSteps.indexOf(proc.status);
                const done = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={s} className="flex-1 relative">
                    <div className={`h-2 rounded-full transition-all duration-500 ${done ? 'bg-green-500' : 'bg-gray-200'} ${isCurrent ? 'shadow-sm shadow-green-500/50' : ''}`} />
                    {isCurrent && <div className="absolute -top-0.5 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-gray-400">Booked</span>
              <span className="text-[10px] text-gray-400">Completed</span>
            </div>
          </div>
        )}

        {/* Payment Card */}
        {payment && (
          <div onClick={() => navigate('/farmer/payment')} className="card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{t('payment')}</p>
                <p className="text-2xl font-extrabold text-gray-800 mt-1">₹{payment.netAmount?.toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`badge ${payment.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {payment.status === 'COMPLETED' ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</> : payment.status}
                  </span>
                </div>
              </div>
              {payment.dbtReferenceId && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">DBT Ref</p>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">{payment.dbtReferenceId}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Produce Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-800">{t('registerProduce')}</h3>
            </div>
            <button onClick={() => navigate('/farmer/produce')} className="text-sm text-green-600 font-semibold hover:text-green-700 flex items-center gap-1">
              + Add <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {profile?.produce?.length > 0 ? (
            <div className="space-y-2">
              {profile.produce.slice(0, 3).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50/80 border border-gray-100/50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌾</span>
                    <div>
                      <span className="font-semibold text-gray-700 text-sm">{p.type}</span>
                      <span className="text-xs text-gray-400 ml-2">{p.quantity} {p.unit}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">₹{p.mspRate}/qt</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{t('noData')}</p>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Bell className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-800">{t('notifications')}</h3>
              {unreadCount > 0 && <span className="badge bg-red-100 text-red-700 text-[10px]">{unreadCount} new</span>}
            </div>
            <button onClick={() => navigate('/farmer/notifications')} className="text-sm text-green-600 font-semibold">{t('view')}</button>
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((n: any) => (
                <div key={n.id} className={`flex items-start gap-3 py-2.5 px-3 rounded-xl transition-colors ${!n.read ? 'bg-blue-50/60 border border-blue-100/50' : 'bg-gray-50/50'}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{language === 'hi' ? n.titleHi : n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{language === 'hi' ? n.messageHi : n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">{t('noData')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 flex justify-around py-2 px-2 z-50 safe-bottom">
        {[
          { icon: LayoutDashboard, label: t('home'), path: '/farmer' },
          { icon: Users, label: t('liveQueue'), path: '/farmer/queue' },
          { icon: Ticket, label: t('myToken'), path: '/farmer/token' },
          { icon: TrendingUp, label: t('status'), path: '/farmer/procurement' },
          { icon: User, label: t('profile'), path: '/farmer/profile' },
        ].map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button key={path} onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 min-w-[52px] py-1.5 px-2 rounded-xl transition-all duration-200 ${isActive ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600'}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
