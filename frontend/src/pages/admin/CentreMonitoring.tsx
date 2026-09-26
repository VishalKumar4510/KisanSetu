import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { analyticsAPI, centreAPI } from '../../services/api';
import {
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  Activity,
  Building2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';

export default function CentreMonitoring() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [centres, setCentres] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [congestionFilter, setCongestionFilter] = useState('ALL');

  const fetchCentres = async () => {
    setRefreshing(true);
    try {
      const [cR, compR] = await Promise.all([
        centreAPI.getAll(),
        analyticsAPI.getCentreComparison(),
      ]);
      setCentres(cR.data.data || []);
      setComparison(compR.data.data || []);
    } catch (e) {
      console.error('Failed to load centres:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCentres();
  }, []);

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

  const filteredCentres = useMemo(() => {
    return centres.filter((c) => {
      const stats = c.stats || comparison.find((s: any) => s.centreId === c.id) || {};
      const cong = (stats.congestionLevel || c.congestionLevel || 'GREEN').toUpperCase();
      const matchesFilter = congestionFilter === 'ALL' || cong === congestionFilter;
      const matchesSearch =
        search === '' ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.location.toLowerCase().includes(search.toLowerCase()) ||
        c.district.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [centres, comparison, congestionFilter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading APMC Mandi telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F5] text-slate-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="APMC Mandi Centre Monitoring"
          description="Real-time facility telemetry, weighbridge bay availability, and queue congestion levels"
          badge={<Badge variant="primary">State Mandi Grid</Badge>}
          backButton={{
            label: 'Command Centre',
            onClick: () => navigate('/admin'),
          }}
          actions={
            <button
              type="button"
              onClick={fetchCentres}
              disabled={refreshing}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          }
        />

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Mandi name, location, or district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { key: 'ALL', label: `All Facilities (${centres.length})` },
              { key: 'GREEN', label: 'Normal Traffic' },
              { key: 'YELLOW', label: 'Moderate Load' },
              { key: 'RED', label: 'Congested' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setCongestionFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
                  congestionFilter === f.key
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Centres Grid */}
        {filteredCentres.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-semibold">No Mandi facilities match your filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCentres.map((c) => {
              const stats = c.stats || comparison.find((s: any) => s.centreId === c.id) || {};
              const cong = congestionBadge(stats.congestionLevel || c.congestionLevel || 'GREEN');
              const util = stats.utilization || 0;

              return (
                <div
                  key={c.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.location}, {c.district}, {c.state || 'Haryana'}</span>
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shrink-0 ${cong.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cong.dot}`} />
                      {cong.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <span className="font-mono font-bold text-slate-900 block text-sm">{stats.queueLength || 0}</span>
                      <span className="text-[10px] text-slate-500">Queue</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                      <span className="font-mono font-bold text-slate-900 block text-sm">{stats.avgWaitTime || 0}m</span>
                      <span className="text-[10px] text-slate-500">Avg Wait</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <Activity className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <span className="font-mono font-bold text-slate-900 block text-sm">{c.activeBays || 2}/{c.totalBays || c.activeBays || 2}</span>
                      <span className="text-[10px] text-slate-500">Bays</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <ShieldCheck className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                      <span className="font-mono font-bold text-slate-900 block text-sm">{stats.completedToday || 0}</span>
                      <span className="text-[10px] text-slate-500">Passed</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-500 font-medium mb-1">
                      <span>Weighbridge Bay Load</span>
                      <span className="font-mono font-bold text-slate-900">{util}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-700 ${
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
        )}
      </div>
    </div>
  );
}
