import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { centreAPI } from '../../services/api';
import { ArrowLeft, Search, MapPin, Clock, Users, ChevronRight } from 'lucide-react';

interface CentreData {
  id: string;
  name: string;
  location: string;
  district: string;
  congestionLevel: 'GREEN' | 'YELLOW' | 'RED';
  availableSlots?: number;
  avgWaitTime?: number;
  queueLength?: number;
  capacity: number;
  activeBays: number;
  totalBays: number;
  status: string;
}

const congestionConfig: Record<string, { bg: string; text: string; dot: string; labelEn: string; labelHi: string }> = {
  GREEN: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', labelEn: 'Low', labelHi: 'कम' },
  YELLOW: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', labelEn: 'Moderate', labelHi: 'मध्यम' },
  RED: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', labelEn: 'High', labelHi: 'अधिक' },
};

export default function CentreSelection() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [centres, setCentres] = useState<CentreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    try {
      setLoading(true);
      const res = await centreAPI.getAll();
      setCentres(res.data.data?.centres || res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || (language === 'hi' ? 'केंद्र लोड करने में त्रुटि' : 'Failed to load centres'));
    } finally {
      setLoading(false);
    }
  };

  const filteredCentres = centres.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg">{t('selectCentre')}</h1>
            <p className="text-green-100 text-xs">
              {language === 'hi' ? `${filteredCentres.length} केंद्र उपलब्ध` : `${filteredCentres.length} centres available`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-green-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'hi' ? 'केंद्र खोजें...' : 'Search centres...'}
            className="w-full pl-10 pr-4 py-2.5 bg-white/15 rounded-xl text-white placeholder-green-200 text-sm focus:outline-none focus:bg-white/25 transition-colors"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchCentres} className="text-sm text-red-600 font-semibold mt-1 underline">
            {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
          </button>
        </div>
      )}

      {/* Centre Cards */}
      <div className="px-4 mt-4 space-y-3">
        {filteredCentres.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t('noData')}</p>
            <p className="text-gray-400 text-sm mt-1">
              {language === 'hi' ? 'कोई केंद्र नहीं मिला' : 'No centres found'}
            </p>
          </div>
        ) : (
          filteredCentres.map((centre) => {
            const cong = congestionConfig[centre.congestionLevel] || congestionConfig.GREEN;
            return (
              <button
                key={centre.id}
                onClick={() => navigate(`/farmer/slots?centreId=${centre.id}`)}
                className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition-shadow active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{centre.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-500 truncate">{centre.location}, {centre.district}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 ml-2" />
                </div>

                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {/* Congestion Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cong.bg} ${cong.text}`}>
                    <span className={`w-2 h-2 rounded-full ${cong.dot}`} />
                    {language === 'hi' ? cong.labelHi : cong.labelEn} {t('congestion')}
                  </span>

                  {/* Available Slots */}
                  {centre.availableSlots !== undefined && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      {centre.availableSlots} {language === 'hi' ? 'स्लॉट' : 'slots'}
                    </span>
                  )}

                  {/* Wait Time */}
                  {centre.avgWaitTime !== undefined && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {centre.avgWaitTime} {language === 'hi' ? 'मिनट' : 'min'}
                    </span>
                  )}
                </div>

                {/* Capacity Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                    <span>{language === 'hi' ? 'क्षमता' : 'Capacity'}</span>
                    <span>{centre.queueLength || 0}/{centre.capacity}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        centre.congestionLevel === 'RED' ? 'bg-red-500' :
                        centre.congestionLevel === 'YELLOW' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(((centre.queueLength || 0) / centre.capacity) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
