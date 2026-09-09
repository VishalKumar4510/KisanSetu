import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { analyticsAPI } from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Analytics() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('7d');
  const [charts, setCharts] = useState<Record<string, any[]>>({});
  const [centreComp, setCentreComp] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCharts(); }, [period]);

  const fetchCharts = async () => {
    setLoading(true);
    try {
      const types = ['registrations', 'bookings', 'waitTime', 'queueLength', 'utilization', 'procurement', 'payments'];
      const results = await Promise.all(types.map(type => analyticsAPI.getChartData(type, period)));
      const data: Record<string, any[]> = {};
      types.forEach((type, i) => { data[type] = results[i].data.data || []; });
      setCharts(data);
      const compRes = await analyticsAPI.getCentreComparison();
      setCentreComp(compRes.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white px-6 py-4 flex items-center gap-4"><button onClick={() => navigate('/admin')}><ArrowLeft className="w-5 h-5" /></button><h1 className="text-xl font-bold">{t('analytics')}</h1></header>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Period Filter */}
        <div className="flex gap-2">{[{ key: 'today', label: t('today') }, { key: '7d', label: t('last7Days') }, { key: '30d', label: t('last30Days') }].map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)} className={`px-4 py-2 rounded-lg text-sm font-medium ${period === p.key ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>{p.label}</button>
        ))}</div>

        {loading ? <div className="text-center py-12 text-gray-400">{t('loading')}</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Registrations */}
            <div className="card"><h3 className="section-title">Farmer Registrations</h3><ResponsiveContainer width="100%" height={250}><LineChart data={charts.registrations}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
            {/* Bookings */}
            <div className="card"><h3 className="section-title">Daily Bookings</h3><ResponsiveContainer width="100%" height={250}><BarChart data={charts.bookings}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            {/* Wait Time */}
            <div className="card"><h3 className="section-title">Average Waiting Time (min)</h3><ResponsiveContainer width="100%" height={250}><LineChart data={charts.waitTime}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
            {/* Queue Length */}
            <div className="card"><h3 className="section-title">Queue Length</h3><ResponsiveContainer width="100%" height={250}><AreaChart data={charts.queueLength}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Area type="monotone" dataKey="value" stroke="#ea580c" fill="#fed7aa" /></AreaChart></ResponsiveContainer></div>
            {/* Centre Utilization */}
            <div className="card"><h3 className="section-title">Centre Utilization (%)</h3><ResponsiveContainer width="100%" height={250}><BarChart data={centreComp}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="centreName" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Bar dataKey="utilization" fill="#16a34a" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            {/* Procurement */}
            <div className="card"><h3 className="section-title">Completed Procurement</h3><ResponsiveContainer width="100%" height={250}><LineChart data={charts.procurement}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
            {/* Payments */}
            <div className="card"><h3 className="section-title">Payment Processing</h3><ResponsiveContainer width="100%" height={250}><BarChart data={charts.payments}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            {/* Centre Comparison Table */}
            <div className="card"><h3 className="section-title">Centre Comparison</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-gray-500 border-b"><th className="pb-2 pr-3">Centre</th><th className="pb-2 pr-3">Queue</th><th className="pb-2 pr-3">Wait</th><th className="pb-2 pr-3">Util %</th><th className="pb-2">Status</th></tr></thead><tbody>{centreComp.map(c => (<tr key={c.centreId} className="border-b border-gray-50"><td className="py-2 pr-3 font-medium">{c.centreName}</td><td className="py-2 pr-3">{c.queueLength}</td><td className="py-2 pr-3">{c.avgWaitTime}m</td><td className="py-2 pr-3">{c.utilization}%</td><td className="py-2"><span className={`badge ${c.congestionLevel === 'GREEN' ? 'bg-green-100 text-green-800' : c.congestionLevel === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{c.congestionLevel}</span></td></tr>))}</tbody></table></div></div>
          </div>
        )}
      </div>
    </div>
  );
}
