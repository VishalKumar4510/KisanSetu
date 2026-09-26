import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { slotAPI, centreAPI } from '../../services/api';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Clock,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';

export default function SlotManagement() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [centres, setCentres] = useState<any[]>([]);
  const [selectedCentre, setSelectedCentre] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    centreAPI
      .getAll()
      .then((r) => {
        const cList = r.data.data || [];
        setCentres(cList);
        if (cList.length > 0) setSelectedCentre(cList[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchSlots = async () => {
    if (!selectedCentre) return;
    setRefreshing(true);
    try {
      const res = await slotAPI.getAvailable(selectedCentre, date);
      setSlots(res.data.data || []);
    } catch (e) {
      console.error('Failed to load slots:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedCentre, date]);

  const selectedCentreObj = useMemo(() => {
    return centres.find((c) => c.id === selectedCentre);
  }, [centres, selectedCentre]);

  const totalCapacity = useMemo(() => {
    return slots.reduce((sum, s) => sum + (s.maxCapacity || 0), 0);
  }, [slots]);

  const totalBooked = useMemo(() => {
    return slots.reduce((sum, s) => sum + (s.currentBookings || 0), 0);
  }, [slots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading slot capacity schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F5] text-slate-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="Mandi Slot Capacity & Intake Management"
          description="Configure operating hours, bay throughput quotas, and daily farmer appointment limits"
          badge={<Badge variant="primary">Capacity Allocation</Badge>}
          backButton={{
            label: 'Command Centre',
            onClick: () => navigate('/admin'),
          }}
          actions={
            <button
              type="button"
              onClick={fetchSlots}
              disabled={refreshing}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Schedule</span>
            </button>
          }
        />

        {/* Filter Controls Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Mandi Facility</label>
              <select
                value={selectedCentre}
                onChange={(e) => setSelectedCentre(e.target.value)}
                className="p-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              >
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Schedule Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              >
              </input>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-auto bg-slate-50 p-2.5 px-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-500 font-sans block">Total Slots</span>
              <span className="font-bold text-slate-900">{totalCapacity}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-sans block">Booked</span>
              <span className="font-bold text-blue-700">{totalBooked}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-sans block">Available</span>
              <span className="font-bold text-emerald-700">{totalCapacity - totalBooked}</span>
            </div>
          </div>
        </div>

        {/* High-Density Slot Capacity Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-4 w-44">Time Window</th>
                  <th className="py-2.5 px-4 w-32">Max Capacity</th>
                  <th className="py-2.5 px-4 w-32">Booked Slots</th>
                  <th className="py-2.5 px-4 w-36">Available Remaining</th>
                  <th className="py-2.5 px-4">Capacity Load</th>
                  <th className="py-2.5 px-4 w-28 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slots.length > 0 ? (
                  slots.map((s) => {
                    const available = s.maxCapacity - s.currentBookings;
                    const pct = s.maxCapacity > 0 ? Math.round((s.currentBookings / s.maxCapacity) * 100) : 0;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {s.timeStart} – {s.timeEnd}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {s.maxCapacity} tokens
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                          {s.currentBookings}
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-emerald-800">
                          {available} left
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 max-w-xs">
                            <span className="font-mono text-xs text-slate-600 w-8">{pct}%</span>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${
                                  pct >= 90 ? 'bg-rose-500' : pct >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <StatusBadge status={s.status} size="sm" />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No slot schedules configured for this date and facility
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
