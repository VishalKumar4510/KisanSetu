import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { analyticsAPI } from '../../services/api';
import { ArrowLeft, FileText, Download, TrendingDown, TrendingUp } from 'lucide-react';

export default function Reports() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { analyticsAPI.getKPIs().then(r => setKpis(r.data.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" /></div>;

  const impactMetrics = [
    { label: 'Waiting Time', value: '42%', direction: 'down', color: 'text-green-600 bg-green-50' },
    { label: 'Queue Congestion', value: '35%', direction: 'down', color: 'text-green-600 bg-green-50' },
    { label: 'Unplanned Visits', value: '50%', direction: 'down', color: 'text-green-600 bg-green-50' },
    { label: 'Slot Utilization', value: '28%', direction: 'up', color: 'text-blue-600 bg-blue-50' },
    { label: 'Digital Bookings', value: '65%', direction: 'up', color: 'text-blue-600 bg-blue-50' },
    { label: 'Payment Visibility', value: '90%', direction: 'up', color: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin')}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold">{t('reports')}</h1>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Summary Reports */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Daily Summary', 'Weekly Summary', 'Monthly Summary'].map(title => (
            <div key={title} className="card">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-800">{title}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Farmers</span><span className="font-medium">{kpis?.farmersRegistered || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Bookings</span><span className="font-medium">{kpis?.todaysBookings || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Procurements</span><span className="font-medium">{kpis?.completedProcurement || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Payments</span><span className="font-medium">{kpis?.paymentsProcessed || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Avg Wait</span><span className="font-medium">{kpis?.avgWaitTime || 0} min</span></div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => alert('Export feature coming soon!')} className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1">
                  <Download className="w-3 h-3" /> PDF
                </button>
                <button onClick={() => alert('Export feature coming soon!')} className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Impact Metrics */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-800 mb-1">{t('impactMetrics')}</h2>
          <p className="text-xs text-gray-400 mb-4 italic">{t('prototypeTargets')}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {impactMetrics.map(m => (
              <div key={m.label} className={`rounded-xl p-4 text-center ${m.color}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  {m.direction === 'down' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                  <span className="text-2xl font-bold">{m.value}</span>
                </div>
                <p className="text-xs font-medium">{m.label}</p>
                <p className="text-[10px] opacity-60">{m.direction === 'down' ? '↓ Reduction' : '↑ Increase'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vision Statement */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-green-800 font-medium text-lg leading-relaxed">
            "Instead of farmers travelling blindly to crowded procurement centres and waiting for hours,
            KisanSetu provides a scheduled slot, digital token, live queue, procurement tracking
            and transparent payment status."
          </p>
          <p className="text-green-600 text-sm mt-3">— KisanSetu Vision | SIH 2026</p>
        </div>
      </div>
    </div>
  );
}
