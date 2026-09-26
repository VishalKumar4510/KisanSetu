import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { queueAPI, centreAPI, procurementAPI } from '../../services/api';
import { ArrowLeft, RefreshCw, Phone, Users } from 'lucide-react';

import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/ui/toast';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function LiveQueueManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    try { 
      await queueAPI.callNext(selectedCentre); 
      toast.success('Next Called', 'Next token alerted to report to station.');
      fetchQueue(selectedCentre); 
    } catch (e: any) {
      toast.error('Call Next Failed', e.response?.data?.error || 'Unable to call next farmer');
    }
  };

  const handleUpdateStatus = async (procId: string, status: string, data?: any) => {
    try { 
      await procurementAPI.updateStatus(procId, { status, ...data }); 
      toast.success('Status Updated', `Procurement moved to ${status}`);
      fetchQueue(selectedCentre); 
    } catch (e: any) { 
      toast.error('Update Failed', e.response?.data?.error || 'Failed'); 
    }
  };

  const filtered = filter === 'all' ? queue : queue.filter(q => filter === 'waiting' ? !q.procurementStatus || q.procurementStatus === 'BOOKED' : q.procurementStatus === filter.toUpperCase());

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <PageHeader
        title="Queue Management"
        description="Live farmer waiting queue, call order management, and lane processing"
        showBack
        backUrl="/officer"
      />
      <div className="space-y-4">
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
          <button onClick={handleCallNext} className="btn-primary flex items-center gap-2 ml-auto"><Phone className="w-4 h-4" />Call Next</button>
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
        <div className="card overflow-x-auto p-4" aria-live="polite">
          {loading ? (
            <SkeletonTable rows={5} columns={8} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-slate-400" />}
              title="No farmers currently in queue"
              description="Active waiting farmers will appear here as they arrive and check in."
            />
          ) : (
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
                  <td className="py-2.5"><button onClick={() => navigate('/officer/procurement')} className="text-xs text-green-600 font-medium hover:underline">Process</button></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
