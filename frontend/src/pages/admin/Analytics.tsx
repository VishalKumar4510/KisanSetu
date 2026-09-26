import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { analyticsAPI } from '../../services/api';
import {
  ArrowLeft,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Calendar,
  Building2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';

export default function Analytics() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('7d');
  const [charts, setCharts] = useState<Record<string, any[]>>({});
  const [centreComp, setCentreComp] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCharts = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const types = ['registrations', 'bookings', 'waitTime', 'queueLength', 'utilization', 'procurement', 'payments'];
      const results = await Promise.all(types.map((type) => analyticsAPI.getChartData(type, period)));
      const data: Record<string, any[]> = {};
      types.forEach((type, i) => {
        data[type] = results[i].data.data || [];
      });
      setCharts(data);
      const compRes = await analyticsAPI.getCentreComparison();
      setCentreComp(compRes.data.data || []);
    } catch (e) {
      console.error('Failed to load chart analytics:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  return (
    <div className="min-h-screen bg-[#F7F9F5] text-slate-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="State Agricultural Analytics"
          description="District-wide Mandi capacity, procurement trends, queue congestion, and DBT velocity"
          badge={<Badge variant="primary">Telemetry Engine</Badge>}
          backButton={{
            label: 'Command Centre',
            onClick: () => navigate('/admin'),
          }}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs">
                {[
                  { key: 'today', label: 'Today' },
                  { key: '7d', label: 'Last 7 Days' },
                  { key: '30d', label: 'Last 30 Days' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPeriod(p.key)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                      period === p.key
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={fetchCharts}
                disabled={refreshing}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          }
        />

        {loading ? (
          <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
            <p className="text-xs font-semibold text-slate-600">Compiling district analytics telemetry...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Farmer Registrations */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Farmer Registrations
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">KYC Cleared</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={charts.registrations || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 2. Daily Bookings */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Daily Slot Bookings
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Mandi Reservations</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={charts.bookings || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 3. Wait Time */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Average Waiting Time (min)
                </h3>
                <span className="text-[10px] text-amber-700 font-bold">Target &lt; 20m</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={charts.waitTime || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 4. Queue Length */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Queue Length & Bay Traffic
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Bays Active</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={charts.queueLength || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="value" stroke="#ea580c" fill="#ffedd5" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* 5. Centre Utilization */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Mandi Facility Utilization (%)
                </h3>
                <span className="text-[10px] text-emerald-700 font-bold">Capacity Load</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={centreComp || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="centreName" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="utilization" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 6. Completed Procurement */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Completed Lots Procured
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Certified Mandi Weighment</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={charts.procurement || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2.5} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 7. Centre Comparison Table (Full Span) */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 md:col-span-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                APMC Mandi Performance Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                      <th className="py-2.5 px-4">Mandi Centre</th>
                      <th className="py-2.5 px-4">Queue Tokens</th>
                      <th className="py-2.5 px-4">Avg Wait</th>
                      <th className="py-2.5 px-4">Capacity Utilization</th>
                      <th className="py-2.5 px-4 text-right">Congestion Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {centreComp.map((c) => (
                      <tr key={c.centreId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">{c.centreName}</td>
                        <td className="py-3 px-4 text-slate-700">{c.queueLength} tokens</td>
                        <td className="py-3 px-4 text-slate-700">{c.avgWaitTime} mins</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 w-10">{c.utilization}%</span>
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                              <div
                                className={`h-2 rounded-full ${
                                  c.utilization > 80 ? 'bg-rose-500' : c.utilization > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, c.utilization)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              c.congestionLevel === 'GREEN'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : c.congestionLevel === 'YELLOW'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {c.congestionLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
