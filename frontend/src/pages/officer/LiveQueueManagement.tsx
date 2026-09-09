import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { queueAPI, centreAPI, procurementAPI } from '../../services/api';
import { ArrowLeft, RefreshCw, UserCheck, Phone } from 'lucide-react';

export default function LiveQueueManagement() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [selectedCentre, setSelectedCentre] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    centreAPI.getAll().then(res => {
      const c = res.data.data || [];
      setCentres(c);
      if (c.length > 0) { setSelectedCentre(c[0].id); fetchQueue(c[0].id); }
    });
  }, []);

  useEffect(() => { if (selectedCentre) fetchQueue(selectedCentre); const i = setInterval(() => { if (selectedCentre) fetchQueue(selectedCentre); }, 10000); return () => clearInterval(i); }, [selectedCentre]);

  const fetchQueue = async (centreId: string) => {
    try { const res = await queueAPI.getCentreQueue(centreId); setQueue(res.data.data || []); } catch {} finally { setLoading(false); }
  };

  const handleCallNext = async () => {
    if (!selectedCentre) return;
    try { await queueAPI.callNext(selectedCentre); fetchQueue(selectedCentre); } catch {}
  };

  const handleUpdateStatus = async (procId: string, status: string, data?: any) => {
    try { await procurementAPI.updateStatus(procId, { status, ...data }); fetchQueue(selectedCentre); } catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
  };

  const filtered = filter === 'all' ? queue : queue.filter(q => filter === 'waiting' ? !q.procurementStatus || q.procurementStatus === 'BOOKED' : q.procurementStatus === filter.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/officer')}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold">{t('queueManagement')}</h1>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <select value={selectedCentre} onChange={e => setSelectedCentre(e.target.value)} className="input-field w-auto">
            {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2">
            {['all', 'waiting', 'ARRIVED', 'WEIGHING'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm ${filter === f ? 'bg-green-600 text-white' : 'bg-white border'}`}>{f === 'all' ? 'All' : f}</button>
            ))}
          </div>
          <button onClick={handleCallNext} className="btn-primary flex items-center gap-2 ml-auto"><Phone className="w-4 h-4" />{t('callNext')}</button>
          <button onClick={() => fetchQueue(selectedCentre)} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card text-center"><p className="text-2xl font-bold text-gray-800">{queue.length}</p><p className="text-xs text-gray-500">Total</p></div>
          <div className="card text-center"><p className="text-2xl font-bold text-orange-600">{queue.filter(q => !q.procurementStatus || q.procurementStatus === 'BOOKED').length}</p><p className="text-xs text-gray-500">Waiting</p></div>
          <div className="card text-center"><p className="text-2xl font-bold text-blue-600">{queue.filter(q => q.procurementStatus && !['BOOKED','COMPLETED'].includes(q.procurementStatus)).length}</p><p className="text-xs text-gray-500">Processing</p></div>
          <div className="card text-center"><p className="text-2xl font-bold text-green-600">{Math.round(queue.length * 15 / Math.max(centres.find(c => c.id === selectedCentre)?.activeBays || 1, 1))}m</p><p className="text-xs text-gray-500">Avg Wait</p></div>
        </div>
        {/* Table */}
        <div className="card overflow-x-auto">
          {loading ? <p className="text-center py-8 text-gray-400">{t('loading')}</p> : filtered.length === 0 ? <p className="text-center py-8 text-gray-400">{t('noData')}</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2 pr-3">Token</th><th className="pb-2 pr-3">Farmer</th><th className="pb-2 pr-3">Produce</th><th className="pb-2 pr-3">Qty</th><th className="pb-2 pr-3">Pos</th><th className="pb-2 pr-3">Status</th><th className="pb-2 pr-3">ETA</th><th className="pb-2">Actions</th></tr></thead>
              <tbody>{filtered.map(q => (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 pr-3 font-medium text-green-700">{q.tokenNumber}</td>
                  <td className="py-2.5 pr-3">{q.farmerName}</td>
                  <td className="py-2.5 pr-3">{q.produce}</td>
                  <td className="py-2.5 pr-3">{q.quantity}</td>
                  <td className="py-2.5 pr-3 font-semibold">#{q.queuePosition}</td>
                  <td className="py-2.5 pr-3"><span className="badge bg-blue-100 text-blue-800 text-xs">{q.procurementStatus || 'WAITING'}</span></td>
                  <td className="py-2.5 pr-3 text-gray-500">{q.estimatedTime || '-'}m</td>
                  <td className="py-2.5"><button onClick={() => navigate('/officer/procurement')} className="text-xs text-green-600 font-medium hover:underline">{t('process')}</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
