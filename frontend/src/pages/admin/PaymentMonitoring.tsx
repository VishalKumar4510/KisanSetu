import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { paymentAPI } from '../../services/api';
import { ArrowLeft, IndianRupee, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function PaymentMonitoring() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try { const res = await paymentAPI.getAll(); setPayments(res.data.data || []); } catch {} finally { setLoading(false); }
  };

  const handleProcess = async (id: string) => {
    try { await paymentAPI.process(id); fetchPayments(); } catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
  };

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter.toUpperCase());
  const totals = {
    pending: payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + (p.netAmount || 0), 0),
    processing: payments.filter(p => p.status === 'PROCESSING').reduce((s, p) => s + (p.netAmount || 0), 0),
    completed: payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + (p.netAmount || 0), 0),
    failed: payments.filter(p => p.status === 'FAILED').length,
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin')}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold">{t('paymentMonitoring')}</h1>
        <button onClick={fetchPayments} className="ml-auto"><RefreshCw className="w-5 h-5" /></button>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card border-l-4 border-yellow-400">
            <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-yellow-600" /><span className="text-sm text-gray-500">{t('pending')}</span></div>
            <p className="text-xl font-bold text-gray-800">₹{totals.pending.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400">{payments.filter(p => p.status === 'PENDING').length} payments</p>
          </div>
          <div className="card border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-1"><RefreshCw className="w-4 h-4 text-blue-600" /><span className="text-sm text-gray-500">{t('processing')}</span></div>
            <p className="text-xl font-bold text-gray-800">₹{totals.processing.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400">{payments.filter(p => p.status === 'PROCESSING').length} payments</p>
          </div>
          <div className="card border-l-4 border-green-400">
            <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm text-gray-500">{t('completed')}</span></div>
            <p className="text-xl font-bold text-gray-800">₹{totals.completed.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400">{payments.filter(p => p.status === 'COMPLETED').length} payments</p>
          </div>
          <div className="card border-l-4 border-red-400">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-sm text-gray-500">Failed</span></div>
            <p className="text-xl font-bold text-gray-800">{totals.failed}</p>
            <p className="text-xs text-gray-400">payments</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm ${filter === f ? 'bg-green-600 text-white' : 'bg-white border text-gray-600'}`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-3">Farmer ID</th><th className="pb-2 pr-3">Farmer</th><th className="pb-2 pr-3">Produce</th>
                <th className="pb-2 pr-3">Gross (₹)</th><th className="pb-2 pr-3">Deductions (₹)</th><th className="pb-2 pr-3">Net (₹)</th>
                <th className="pb-2 pr-3">Status</th><th className="pb-2 pr-3">DBT Ref</th><th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 pr-3 font-mono text-xs text-green-700">{p.farmerId?.slice(0, 12) || '-'}</td>
                  <td className="py-2.5 pr-3 font-medium">{p.farmerName || '-'}</td>
                  <td className="py-2.5 pr-3">{p.produce?.type || '-'}</td>
                  <td className="py-2.5 pr-3">₹{(p.grossAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 pr-3 text-red-600">₹{(p.deductions || 0).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 pr-3 font-semibold">₹{(p.netAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`badge ${p.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : p.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{p.status}</span>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-gray-400">{p.dbtReferenceId || '-'}</td>
                  <td className="py-2.5">
                    {(p.status === 'PENDING' || p.status === 'PROCESSING') && (
                      <button onClick={() => handleProcess(p.id)} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">{t('process')}</button>
                    )}
                  </td>
                </tr>
              )) : <tr><td colSpan={9} className="py-8 text-center text-gray-400">{t('noData')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
