import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { centreAPI } from '@/services/api';
import {
  ArrowLeft,
  Search,
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Activity,
  Scale,
  Calendar,
  AlertCircle,
  X,
  Building2,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';

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

export default function CentreSelection() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [centres, setCentres] = useState<CentreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCongestion, setFilterCongestion] = useState<'ALL' | 'GREEN' | 'YELLOW' | 'RED'>('ALL');

  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await centreAPI.getAll();
      setCentres(res.data.data?.centres || res.data.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          (language === 'hi'
            ? 'केंद्र लोड करने में त्रुटि'
            : 'Failed to load procurement centres')
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredCentres = centres.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCongestion =
      filterCongestion === 'ALL' || c.congestionLevel === filterCongestion;

    return matchesSearch && matchesCongestion;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 animate-fadeIn">
      {/* Header */}
      <PageHeader
        title={t('selectCentre')}
        description={
          language === 'hi'
            ? 'अपनी नजदीकी अधिकृत APMC मंडी या पैक्स खरीद केंद्र का चयन करें'
            : 'Find your nearest authorized APMC mandi or PACS procurement hub'
        }
        backButton={{
          label: t('back'),
          onClick: () => navigate('/farmer'),
        }}
        badge={
          <Badge variant="primary" size="sm">
            {centres.length} {language === 'hi' ? 'केंद्र उपलब्ध' : 'Centres Online'}
          </Badge>
        }
      />

      {/* Search and Filters Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'मंडी केंद्र का नाम, स्थान या जिला खोजें...'
                : 'Search by mandi name, location, or district...'
            }
            className="w-full pl-11 pr-10 py-3 bg-white rounded-2xl border border-gray-200/90 text-sm text-[#17201A] placeholder-[#64748B]/70 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Congestion Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[#64748B] font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            {language === 'hi' ? 'भीड़ स्थिति:' : 'Traffic:'}
          </span>
          {[
            { id: 'ALL', labelEn: 'All Mandis', labelHi: 'सभी केंद्र' },
            { id: 'GREEN', labelEn: '🟢 Low Wait', labelHi: '🟢 कम भीड़' },
            { id: 'YELLOW', labelEn: '🟡 Moderate', labelHi: '🟡 मध्यम' },
            { id: 'RED', labelEn: '🔴 Busy', labelHi: '🔴 अधिक भीड़' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterCongestion(pill.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                filterCongestion === pill.id
                  ? 'bg-[#16A34A] text-white shadow-2xs'
                  : 'bg-white text-[#64748B] border border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              {language === 'hi' ? pill.labelHi : pill.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-3 text-red-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCentres}
            className="text-xs bg-white text-red-700 border-red-200 hover:bg-red-50"
          >
            {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Centre List */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredCentres.length === 0 ? (
          <EmptyState
            bordered
            icon={<Building2 className="w-7 h-7 text-gray-400" />}
            title={language === 'hi' ? 'कोई केंद्र नहीं मिला' : 'No Procurement Centres Found'}
            description={
              searchQuery || filterCongestion !== 'ALL'
                ? language === 'hi'
                  ? 'अपनी खोज या फ़िल्टर बदलकर पुनः प्रयास करें।'
                  : 'Try clearing your search query or selecting "All Mandis" to view available centres.'
                : language === 'hi'
                ? 'फिलहाल कोई केंद्र सक्रिय नहीं है।'
                : 'No procurement centres are currently active in this region.'
            }
            action={
              searchQuery || filterCongestion !== 'ALL'
                ? {
                    label: language === 'hi' ? 'फ़िल्टर हटाएं' : 'Reset Filters',
                    onClick: () => {
                      setSearchQuery('');
                      setFilterCongestion('ALL');
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCentres.map((centre) => {
              const queueLoad = Math.min(
                Math.round(((centre.queueLength || 0) / (centre.capacity || 100)) * 100),
                100
              );

              return (
                <Card
                  key={centre.id}
                  className="p-5 sm:p-6 space-y-4 hover:shadow-md transition-all duration-200 border-gray-200/85 hover:border-green-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Centre Name & Congestion Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-base sm:text-lg text-[#17201A] truncate leading-tight">
                            {centre.name}
                          </h3>
                          <Badge variant="outline" size="sm">
                            {centre.status || 'Active'}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-[#64748B] flex items-center gap-1.5 mt-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                          <span className="truncate">
                            {centre.location}, {centre.district}
                          </span>
                        </p>
                      </div>

                      <StatusBadge
                        status={centre.congestionLevel || 'GREEN'}
                        language={language}
                        size="md"
                        className="shrink-0"
                      />
                    </div>

                    {/* Operational Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2.5 pt-2">
                      {/* Active Bays */}
                      <div className="p-2.5 rounded-xl bg-gray-50/90 border border-gray-100 flex flex-col items-center text-center">
                        <Scale className="w-4 h-4 text-emerald-600 mb-1" />
                        <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-tight">
                          {language === 'hi' ? 'तौल कांटे' : 'Active Bays'}
                        </span>
                        <strong className="text-xs sm:text-sm font-extrabold text-[#17201A] mt-0.5">
                          {centre.activeBays || 0}/{centre.totalBays || 4}
                        </strong>
                      </div>

                      {/* Average Wait Time */}
                      <div className="p-2.5 rounded-xl bg-gray-50/90 border border-gray-100 flex flex-col items-center text-center">
                        <Clock className="w-4 h-4 text-amber-600 mb-1" />
                        <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-tight">
                          {language === 'hi' ? 'औसत प्रतीक्षा' : 'Avg Wait'}
                        </span>
                        <strong className="text-xs sm:text-sm font-extrabold text-[#17201A] mt-0.5">
                          ~{centre.avgWaitTime !== undefined ? centre.avgWaitTime : 20} {language === 'hi' ? 'मिनट' : 'min'}
                        </strong>
                      </div>

                      {/* Available Slots */}
                      <div className="p-2.5 rounded-xl bg-gray-50/90 border border-gray-100 flex flex-col items-center text-center">
                        <Users className="w-4 h-4 text-blue-600 mb-1" />
                        <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-tight">
                          {language === 'hi' ? 'खुले स्लॉट' : 'Open Slots'}
                        </span>
                        <strong className="text-xs sm:text-sm font-extrabold text-emerald-700 mt-0.5">
                          {centre.availableSlots !== undefined ? centre.availableSlots : 24}
                        </strong>
                      </div>
                    </div>

                    {/* Mandi Capacity Meter */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-[#64748B]">
                        <span>
                          {language === 'hi' ? 'दैनिक क्षमता उपयोग' : 'Current Mandi Traffic Load'}
                        </span>
                        <span className="font-semibold text-[#17201A]">
                          {centre.queueLength || 0} / {centre.capacity || 100}
                        </span>
                      </div>
                      <Progress
                        value={queueLoad}
                        variant={
                          centre.congestionLevel === 'RED'
                            ? 'error'
                            : centre.congestionLevel === 'YELLOW'
                            ? 'warning'
                            : 'primary'
                        }
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <div className="pt-4 border-t border-gray-100">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => navigate(`/farmer/slots?centreId=${centre.id}`)}
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                      className="w-full justify-center shadow-xs"
                    >
                      {language === 'hi' ? 'केंद्र चुनें और स्लॉट बुक करें' : 'Select Centre & Book Slot'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
