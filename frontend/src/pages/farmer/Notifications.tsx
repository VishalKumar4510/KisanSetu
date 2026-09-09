import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { notificationAPI } from '../../services/api';
import { ArrowLeft, Bell, Calendar, CreditCard, CheckCircle, AlertTriangle, Truck, Scale, FlaskConical, Ticket, Clock } from 'lucide-react';

interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  SLOT_CONFIRMED: { icon: Calendar, bg: 'bg-blue-100', color: 'text-blue-600' },
  SLOT_REMINDER: { icon: Clock, bg: 'bg-purple-100', color: 'text-purple-600' },
  QUEUE_APPROACHING: { icon: Ticket, bg: 'bg-orange-100', color: 'text-orange-600' },
  QUEUE_DELAY: { icon: AlertTriangle, bg: 'bg-yellow-100', color: 'text-yellow-600' },
  GATE_ENTRY: { icon: Truck, bg: 'bg-teal-100', color: 'text-teal-600' },
  WEIGHING_COMPLETED: { icon: Scale, bg: 'bg-indigo-100', color: 'text-indigo-600' },
  QUALITY_COMPLETED: { icon: FlaskConical, bg: 'bg-violet-100', color: 'text-violet-600' },
  PROCUREMENT_COMPLETED: { icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600' },
  PAYMENT_PROCESSED: { icon: CreditCard, bg: 'bg-emerald-100', color: 'text-emerald-600' },
};

export default function Notifications() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationAPI.getAll();
      const data = res.data.data?.notifications || res.data.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.error || (language === 'hi' ? 'सूचनाएं लोड करने में त्रुटि' : 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent fail
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch {
      // silent fail
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (d.toDateString() === today.toDateString()) {
        return language === 'hi' ? 'आज' : 'Today';
      }
      if (d.toDateString() === yesterday.toDateString()) {
        return language === 'hi' ? 'कल' : 'Yesterday';
      }
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  // Group by date
  const grouped = notifications.reduce<Record<string, NotificationData[]>>((acc, n) => {
    const dateKey = formatDate(n.createdAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(n);
    return acc;
  }, {});

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">{t('notifications')}</h1>
              {unreadCount > 0 && (
                <p className="text-green-100 text-xs">
                  {unreadCount} {language === 'hi' ? 'अपठित' : 'unread'}
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {markingAll ? '...' : t('markAllRead')}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Notifications */}
      <div className="px-4 mt-4">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{language === 'hi' ? 'कोई सूचना नहीं' : 'No Notifications'}</p>
            <p className="text-gray-400 text-sm mt-2">
              {language === 'hi' ? 'आपकी सूचनाएं यहां दिखेंगी' : 'Your notifications will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">{date}</h3>
                <div className="space-y-2">
                  {items.map((n) => {
                    const typeConfig = typeIcons[n.type] || { icon: Bell, bg: 'bg-gray-100', color: 'text-gray-600' };
                    const Icon = typeConfig.icon;

                    return (
                      <button
                        key={n.id}
                        onClick={() => !n.read && handleMarkRead(n.id)}
                        className={`w-full text-left bg-white rounded-xl border p-4 transition-all ${
                          !n.read ? 'border-blue-200 shadow-sm' : 'border-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConfig.bg}`}>
                            <Icon className={`w-4 h-4 ${typeConfig.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-semibold leading-tight ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {language === 'hi' ? n.titleHi : n.title}
                              </p>
                              {/* Blue dot for unread */}
                              {!n.read && (
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {language === 'hi' ? n.messageHi : n.message}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1.5">{formatTime(n.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
