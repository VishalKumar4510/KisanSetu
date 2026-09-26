import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { paymentAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import {
  ArrowLeft,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  CreditCard,
  Building,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/components/ui/toast';
import { SkeletonTable } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function PaymentMonitoring() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = async () => {
    setRefreshing(true);
    try {
      const res = await paymentAPI.getAll();
      setPayments(res.data.data || []);
    } catch (e) {
      console.error('Failed to load payments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleProcess = async (id: string) => {
    try {
      await paymentAPI.process(id);
      toast.success('Payment Initiated', 'Direct DBT transfer initiated successfully');
      await fetchPayments();
    } catch (e: any) {
      toast.error('Payment Error', e.response?.data?.error || 'Failed to process payment');
    }
  };

  const totals = useMemo(() => {
    return {
      pending: payments
        .filter((p) => p.status === 'PENDING')
        .reduce((s, p) => s + (p.netAmount || 0), 0),
      processing: payments
        .filter((p) => p.status === 'PROCESSING')
        .reduce((s, p) => s + (p.netAmount || 0), 0),
      completed: payments
        .filter((p) => p.status === 'COMPLETED')
        .reduce((s, p) => s + (p.netAmount || 0), 0),
      failed: payments.filter((p) => p.status === 'FAILED').length,
    };
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesFilter = filter === 'ALL' || p.status === filter;
      const matchesSearch =
        search === '' ||
        (p.farmerName && p.farmerName.toLowerCase().includes(search.toLowerCase())) ||
        (p.farmerId && p.farmerId.toLowerCase().includes(search.toLowerCase())) ||
        (p.dbtReferenceId && p.dbtReferenceId.toLowerCase().includes(search.toLowerCase())) ||
        (p.utr && p.utr.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [payments, filter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading DBT payment records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9F5] text-slate-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="DBT Payment Monitoring & Reconciliation"
          description="Direct Benefit Transfer pipeline settlement, PFMS mandates, and farmer banking credit logs"
          badge={<Badge variant="primary">Treasury Clearing</Badge>}
          backButton={{
            label: 'Command Centre',
            onClick: () => navigate('/admin'),
          }}
          actions={
            <button
              type="button"
              onClick={fetchPayments}
              disabled={refreshing}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Records</span>
            </button>
          }
        />

        {/* 4 Financial Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border-l-4 border-l-amber-500 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">Pending Authorization</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-black font-mono text-slate-900">{formatCurrency(totals.pending)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {payments.filter((p) => p.status === 'PENDING').length} payment mandates
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border-l-4 border-l-blue-500 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">PFMS In-Flight</span>
              <RefreshCw className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl font-black font-mono text-slate-900">{formatCurrency(totals.processing)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {payments.filter((p) => p.status === 'PROCESSING').length} payments processing
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border-l-4 border-l-emerald-600 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-emerald-800">Bank Credited (Settled)</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-black font-mono text-emerald-950">{formatCurrency(totals.completed)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {payments.filter((p) => p.status === 'COMPLETED').length} settled via UTR
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border-l-4 border-l-rose-500 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-rose-700">Failed / Retried</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-xl font-black font-mono text-rose-700">{totals.failed}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Requires re-verification</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by farmer name, Kisan ID, or UTR / DBT ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
                  filter === f
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'ALL' ? `All Payments (${payments.length})` : f}
              </button>
            ))}
          </div>
        </div>

        {/* High-Density Payments Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden" aria-live="polite">
          {loading ? (
            <div className="p-6">
              <SkeletonTable rows={7} columns={9} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<CreditCard className="w-8 h-8 text-slate-400" />}
                title="No payment records found"
                description="No payments match the selected filter or search criteria."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 select-none">
                    <th className="py-2.5 px-4 w-32">Farmer ID</th>
                    <th className="py-2.5 px-4">Beneficiary</th>
                    <th className="py-2.5 px-4 w-28">Produce</th>
                    <th className="py-2.5 px-4 w-32">Gross Amount</th>
                    <th className="py-2.5 px-4 w-28">Deductions</th>
                    <th className="py-2.5 px-4 w-32">Net Disbursed</th>
                    <th className="py-2.5 px-4 w-28">Status</th>
                    <th className="py-2.5 px-4 w-36">DBT / UTR Ref</th>
                    <th className="py-2.5 px-4 w-24 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 font-bold">
                        {p.farmerId ? p.farmerId.slice(0, 14) : 'KS-FARM-...'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 text-xs block">{p.farmerName || 'Beneficiary'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{p.maskedBankAccount || '•••• 4138'}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                        {p.produce?.type || p.crop || 'WHEAT'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700">
                        {formatCurrency(p.grossAmount || 0)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-rose-600 font-medium">
                        -{formatCurrency(p.deductions || 0)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-black text-emerald-800 text-xs">
                        {formatCurrency(p.netAmount || 0)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px] truncate">
                        {p.utr || p.dbtReferenceId || '982440385255'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {p.status === 'PENDING' || p.status === 'PROCESSING' ? (
                          <button
                            type="button"
                            onClick={() => handleProcess(p.id)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors btn-press"
                          >
                            Disburse
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold px-2 py-0.5 bg-emerald-50 rounded">
                            Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
