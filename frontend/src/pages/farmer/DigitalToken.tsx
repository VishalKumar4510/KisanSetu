import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { farmerAPI } from '../../services/api';
import { ArrowLeft, QrCode, MapPin, Calendar, Clock, Hash, Shield } from 'lucide-react';

interface TokenData {
  id: string;
  tokenNumber: string;
  qrData: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  queuePosition: number;
  estimatedTime: string;
  createdAt: string;
  centreId: string;
  centreName?: string;
  slotDate?: string;
  slotTime?: string;
}

const statusConfig: Record<string, { bg: string; text: string; labelEn: string; labelHi: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', labelEn: 'Active', labelHi: 'सक्रिय' },
  USED: { bg: 'bg-blue-100', text: 'text-blue-800', labelEn: 'Used', labelHi: 'उपयोग हुआ' },
  EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-800', labelEn: 'Expired', labelHi: 'समाप्त' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', labelEn: 'Cancelled', labelHi: 'रद्द' },
};

export default function DigitalToken() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchToken();
  }, []);

  const fetchToken = async () => {
    try {
      setLoading(true);
      const res = await farmerAPI.getProfile();
      const profile = res.data.data;
      const activeToken = profile?.activeToken;
      if (activeToken) {
        setToken({
          ...activeToken,
          centreName: activeToken.centreName || profile?.activeProcurement?.centreName || '',
          slotDate: activeToken.slotDate || activeToken.date || new Date(activeToken.createdAt).toLocaleDateString('en-IN'),
          slotTime: activeToken.slotTime || activeToken.estimatedTime || '',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || (language === 'hi' ? 'टोकन लोड करने में त्रुटि' : 'Failed to load token'));
    } finally {
      setLoading(false);
    }
  };

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

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-600 text-white px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">{t('myToken')}</h1>
          </div>
        </div>
        <div className="flex items-center justify-center px-4 mt-20">
          <div className="text-center">
            <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{language === 'hi' ? 'कोई सक्रिय टोकन नहीं' : 'No Active Token'}</p>
            <p className="text-gray-400 text-sm mt-2 mb-4">
              {language === 'hi' ? 'पहले स्लॉट बुक करें' : 'Book a slot first to get your token'}
            </p>
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

  const status = statusConfig[token.status] || statusConfig.ACTIVE;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-600 to-green-700 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 text-white">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg">{t('myToken')}</h1>
      </div>

      {/* Token Card - Full screen optimized for gate display */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
          {/* Token Header */}
          <div className="bg-green-50 px-6 pt-6 pb-4 text-center border-b border-green-100">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                {t('appName')} — {language === 'hi' ? 'डिजिटल टोकन' : 'Digital Token'}
              </span>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
              {language === 'hi' ? status.labelHi : status.labelEn}
            </span>
          </div>

          {/* Token Number - Large and prominent */}
          <div className="px-6 py-6 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{t('tokenNumber')}</p>
            <p className="text-5xl font-black text-green-700 mt-1 tracking-wide">{token.tokenNumber}</p>
          </div>

          {/* QR Placeholder - Styled grid pattern */}
          <div className="flex justify-center px-6 pb-5">
            <div className="w-40 h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden">
              {/* Grid pattern simulating QR code */}
              <div className="absolute inset-3 grid grid-cols-8 grid-rows-8 gap-[2px]">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-[1px] ${
                      // Create a QR-like pattern
                      (i < 3 || (i >= 5 && i < 8) || (i >= 16 && i < 19) || (i >= 21 && i < 24) ||
                       i === 8 || i === 15 || i === 32 || i === 39 || i === 40 || i === 47 ||
                       (i >= 56 && i < 59) || (i >= 61 && i < 64) || i === 48 || i === 55 ||
                       i === 27 || i === 28 || i === 35 || i === 36)
                        ? 'bg-gray-800'
                        : (i % 3 === 0 ? 'bg-gray-300' : 'bg-gray-100')
                    }`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-green-600 opacity-30" />
              </div>
            </div>
          </div>

          {/* Queue Position */}
          {token.queuePosition > 0 && (
            <div className="mx-6 mb-4 bg-green-50 rounded-xl p-4 text-center">
              <p className="text-xs text-green-600 font-medium">{t('queuePosition')}</p>
              <p className="text-3xl font-bold text-green-700 mt-1">#{token.queuePosition}</p>
            </div>
          )}

          {/* Details */}
          <div className="px-6 pb-6 space-y-3">
            {token.centreName && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">{t('centre')}</p>
                  <p className="text-sm font-semibold text-gray-800">{token.centreName}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">{t('date')}</p>
                <p className="text-sm font-semibold text-gray-800">{token.slotDate}</p>
              </div>
            </div>

            {token.estimatedTime && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">{t('estimatedWait')}</p>
                  <p className="text-sm font-semibold text-gray-800">{token.estimatedTime} {language === 'hi' ? 'मिनट' : 'min'}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Hash className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">ID</p>
                <p className="text-sm font-semibold text-gray-800 font-mono">{token.id?.slice(0, 12)}...</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400">
              {language === 'hi' ? 'गेट पर यह टोकन दिखाएं' : 'Show this token at the gate'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
