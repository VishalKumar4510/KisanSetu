import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { farmerAPI } from '../../services/api';
import { ArrowLeft, User, Phone, CreditCard, MapPin, Ruler, Sprout, LogOut, Globe, Shield } from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  phone: string;
  aadhaar?: string;
  farmerId: string;
  village: string;
  district: string;
  state: string;
  landArea: number;
  crops: string[];
  language?: string;
  createdAt?: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await farmerAPI.getProfile();
      setProfile(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || (language === 'hi' ? 'प्रोफ़ाइल लोड करने में त्रुटि' : 'Failed to load profile'));
    } finally {
      setLoading(false);
    }
  };

  const maskAadhaar = (aadhaar?: string) => {
    if (!aadhaar) return '****-****-****';
    const clean = aadhaar.replace(/\D/g, '');
    if (clean.length < 4) return '****-****-****';
    return `****-****-${clean.slice(-4)}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-600 text-white px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">{t('profile')}</h1>
          </div>
        </div>
        <div className="flex items-center justify-center px-4 mt-20">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
            <button onClick={fetchProfile} className="mt-4 text-green-600 font-semibold underline">
              {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const data = profile || { name: user?.name || '', phone: user?.phone || '', farmerId: user?.farmerId || '', aadhaar: '', village: '', district: '', state: '', landArea: 0, crops: [], id: '' };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header with Avatar */}
      <div className="bg-green-600 text-white px-4 pt-4 pb-16">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{t('profile')}</h1>
        </div>
      </div>

      {/* Profile Card - overlapping header */}
      <div className="px-4 -mt-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          {/* Avatar */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto -mt-16 mb-3 border-4 border-white shadow">
            <span className="text-2xl font-bold text-green-700">{getInitials(data.name)}</span>
          </div>

          <h2 className="text-xl font-bold text-gray-800">{data.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('farmer')} ID: {data.farmerId}</p>

          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 rounded-full">
              <Shield className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-green-700">{language === 'hi' ? 'सत्यापित' : 'Verified'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {language === 'hi' ? 'संपर्क जानकारी' : 'Contact Information'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">{t('phone')}</p>
                <p className="text-sm font-semibold text-gray-800">{data.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">{language === 'hi' ? 'आधार नंबर' : 'Aadhaar Number'}</p>
                <p className="text-sm font-semibold text-gray-800 font-mono">{maskAadhaar(data.aadhaar)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {language === 'hi' ? 'स्थान विवरण' : 'Location Details'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">{t('village')}</p>
                <p className="text-sm font-semibold text-gray-800">{data.village || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">{t('district')}, {t('state')}</p>
                <p className="text-sm font-semibold text-gray-800">{data.district || '—'}, {data.state || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Farm Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {language === 'hi' ? 'खेत की जानकारी' : 'Farm Details'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Ruler className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">{t('landArea')}</p>
                <p className="text-sm font-semibold text-gray-800">{data.landArea || '—'} {language === 'hi' ? 'एकड़' : 'acres'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Sprout className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">{t('crops')}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {data.crops && data.crops.length > 0 ? (
                    data.crops.map((crop) => (
                      <span key={crop} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        {crop}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {language === 'hi' ? 'सेटिंग्स' : 'Settings'}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400">{language === 'hi' ? 'भाषा' : 'Language'}</p>
                <p className="text-sm font-semibold text-gray-800">{language === 'hi' ? 'हिंदी' : 'English'}</p>
              </div>
            </div>
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm rounded-xl transition-colors"
            >
              {language === 'en' ? 'हिंदी' : 'English'}
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl border border-red-200 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {t('logout')}
        </button>
      </div>
    </div>
  );
}
