import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { analyticsAPI, centreAPI } from '../../services/api';
import { ArrowLeft, MapPin, Users, Clock, Activity } from 'lucide-react';

export default function CentreMonitoring() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [centres, setCentres] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { Promise.all([centreAPI.getAll(), analyticsAPI.getCentreComparison()]).then(([cR, compR]) => { setCentres(cR.data.data || []); setComparison(compR.data.data || []); }).catch(() => {}).finally(() => setLoading(false)); }, []);

  const cColor = (l: string) => l === 'GREEN' ? 'border-green-400 bg-green-50' : l === 'YELLOW' ? 'border-yellow-400 bg-yellow-50' : 'border-red-400 bg-red-50';
  const cBadge = (l: string) => l === 'GREEN' ? 'bg-green-100 text-green-800' : l === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white px-6 py-4 flex items-center gap-4"><button onClick={() => navigate('/admin')}><ArrowLeft className="w-5 h-5" /></button><h1 className="text-xl font-bold">{t('centreMonitoring')}</h1></header>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centres.map(c => {
            const stats = c.stats || comparison.find((s: any) => s.centreId === c.id) || {};
            return (
              <div key={c.id} className={`rounded-xl border-2 p-5 ${cColor(stats.congestionLevel || c.congestionLevel || 'GREEN')}`}>
                <div className="flex justify-between mb-3"><h3 className="font-bold text-gray-800 text-lg">{c.name}</h3><span className={`badge ${cBadge(stats.congestionLevel || c.congestionLevel || 'GREEN')}`}>{stats.congestionLevel || c.congestionLevel || 'GREEN'}</span></div>
                <p className="text-sm text-gray-600 flex items-center gap-1 mb-4"><MapPin className="w-3 h-3" />{c.location}, {c.district}, {c.state}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center"><Users className="w-5 h-5 text-blue-600 mx-auto mb-1" /><p className="text-xl font-bold">{stats.queueLength || 0}</p><p className="text-xs text-gray-500">Queue</p></div>
                  <div className="bg-white rounded-lg p-3 text-center"><Clock className="w-5 h-5 text-orange-600 mx-auto mb-1" /><p className="text-xl font-bold">{stats.avgWaitTime || 0}m</p><p className="text-xs text-gray-500">Avg Wait</p></div>
                  <div className="bg-white rounded-lg p-3 text-center"><Activity className="w-5 h-5 text-green-600 mx-auto mb-1" /><p className="text-xl font-bold">{c.activeBays}/{c.totalBays || c.activeBays}</p><p className="text-xs text-gray-500">Bays</p></div>
                  <div className="bg-white rounded-lg p-3 text-center"><Activity className="w-5 h-5 text-purple-600 mx-auto mb-1" /><p className="text-xl font-bold">{stats.completedToday || 0}</p><p className="text-xs text-gray-500">Completed</p></div>
                </div>
                <div className="mt-4"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>{t('utilization')}</span><span>{stats.utilization || 0}%</span></div><div className="w-full bg-white rounded-full h-3"><div className={`h-3 rounded-full ${(stats.utilization || 0) > 80 ? 'bg-red-500' : (stats.utilization || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, stats.utilization || 0)}%` }} /></div></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
