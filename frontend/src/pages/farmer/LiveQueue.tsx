import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { queueAPI } from '../../services/api';
import { ArrowLeft, Users, Clock, MapPin, Ticket, RefreshCw } from 'lucide-react';

interface QueueData {
  position: number;
  totalInQueue: number;
  estimatedTime: number;
  centreName: string;
  centreId: string;
  tokenNumber: string;
  status?: string;
}

export default function LiveQueue() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [queue, setQueue] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [etaCountdown, setEtaCountdown] = useState(0);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await queueAPI.getPosition(user?.farmerId);
      const data = res.data.data;
      if (data) {
        setQueue(data);
        setEtaCountdown(data.estimatedTime || 0);
        setLastUpdated(new Date());
      }
      setError(null);
    } catch (err: any) {
      if (!queue) {
        setError(err.response?.data?.error || (language === 'hi' ? 'कतार डेटा लोड करने में त्रुटि' : 'Failed to load queue data'));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.farmerId, language]);

  // Auto-refresh every 10s
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
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
    if (h > 0) return `${h}${language === 'hi' ? ' घंटा' : 'h'} ${m}${language === 'hi' ? ' मिनट' : 'm'}`;
    return `${m} ${language === 'hi' ? 'मिनट' : 'min'}`;
  };

  const progressPct = queue ? Math.max(0, Math.min(100, ((queue.totalInQueue - queue.position + 1) / queue.totalInQueue) * 100)) : 0;

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

  if (!queue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-600 text-white px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">{t('liveQueue')}</h1>
          </div>
        </div>
        <div className="flex items-center justify-center px-4 mt-20">
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{language === 'hi' ? 'कतार में नहीं हैं' : 'Not in Queue'}</p>
            <p className="text-gray-400 text-sm mt-2 mb-4">
              {language === 'hi' ? 'पहले स्लॉट बुक करें' : 'Book a slot to join the queue'}
            </p>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              onClick={() => navigate('/farmer/centres')}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              {t('bookSlot')}
            </button>
          </div>
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
            <h1 className="font-bold text-lg">{t('liveQueue')}</h1>
          </div>
          <button onClick={fetchQueue} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Queue Position - Large with pulse animation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-sm text-gray-500 font-medium mb-3">{t('queuePosition')}</p>
          <div className="relative inline-flex items-center justify-center">
            {/* Pulse ring */}
            <div className="absolute w-36 h-36 rounded-full border-4 border-green-200 animate-ping opacity-20" />
            <div className="absolute w-36 h-36 rounded-full border-2 border-green-300 animate-pulse" />
            {/* Position number */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg">
              <div className="text-white">
                <p className="text-5xl font-black">{queue.position}</p>
                <p className="text-xs opacity-80 -mt-1">/ {queue.totalInQueue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ETA Countdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{t('estimatedWait')}</p>
              <p className="text-2xl font-bold text-gray-800">{formatETA(etaCountdown)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{language === 'hi' ? 'प्रगति' : 'Progress'}</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
              <span>{language === 'hi' ? 'कतार में शामिल' : 'Joined'}</span>
              <span>{language === 'hi' ? 'आपकी बारी' : 'Your Turn'}</span>
            </div>
          </div>
        </div>

        {/* Details Cards */}
        <div className="grid grid-cols-2 gap-3">
          {queue.centreName && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">{t('centre')}</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 truncate">{queue.centreName}</p>
            </div>
          )}

          {queue.tokenNumber && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">{t('tokenNumber')}</span>
              </div>
              <p className="text-sm font-semibold text-green-700">{queue.tokenNumber}</p>
            </div>
          )}
        </div>

        {/* Last Updated */}
        <p className="text-center text-xs text-gray-400">
          {language === 'hi' ? 'अंतिम अपडेट' : 'Last updated'}: {lastUpdated.toLocaleTimeString('en-IN')}
          <span className="text-gray-300"> · </span>
          {language === 'hi' ? 'हर 10 सेकंड में अपडेट' : 'Auto-refreshes every 10s'}
        </p>
      </div>
    </div>
  );
}
