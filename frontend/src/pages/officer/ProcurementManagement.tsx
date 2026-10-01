import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { procurementAPI } from '../../services/api';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, Scale, FlaskConical, CreditCard, Package, LucideIcon } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function ProcurementManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [procs, setProcs] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weighing, setWeighing] = useState({ grossWeight: '', tareWeight: '' });
  const [quality, setQuality] = useState({ moistureContent: '', grade: 'A', accepted: true, remarks: '' });

  useEffect(() => { fetchProcs(); }, []);

  const fetchProcs = async () => {
    try { const res = await procurementAPI.getAll(); setProcs(res.data.data || []); } catch {} finally { setLoading(false); }
  };

  const handleTransition = async (id: string, status: string, data?: Record<string, unknown>) => {
    try { 
      await procurementAPI.updateStatus(id, { status, ...data }); 
      toast.success('Status Updated', `Procurement moved to ${status.replace(/_/g, ' ')}`);
      fetchProcs(); 
      setExpanded(null); 
    } catch (e: any) { 
      toast.error('Transition Failed', e.response?.data?.error || 'Transition failed'); 
    }
  };

  const getNextAction = (status: string, procId: string) => {
    const actions: Record<string, { label: string; next: string; icon: LucideIcon; color: string }> = {
      BOOKED: { label: 'Mark Arrived', next: 'ARRIVED', icon: CheckCircle, color: 'bg-yellow-500' },
      ARRIVED: { label: 'Gate Entry', next: 'GATE_ENTRY', icon: CheckCircle, color: 'bg-orange-500' },
      GATE_ENTRY: { label: 'Start Weighing', next: 'WEIGHING', icon: Scale, color: 'bg-purple-500' },
      WEIGHING: { label: 'Quality Check', next: 'QUALITY_CHECK', icon: FlaskConical, color: 'bg-indigo-500' },
      QUALITY_CHECK: { label: 'Approve', next: 'PROCUREMENT', icon: CheckCircle, color: 'bg-green-500' },
      PROCUREMENT: { label: 'Initiate Payment', next: 'PAYMENT_PENDING', icon: CreditCard, color: 'bg-amber-500' },
      PAYMENT_PENDING: { label: 'Process Payment', next: 'PAYMENT_PROCESSING', icon: CreditCard, color: 'bg-cyan-500' },
      PAYMENT_PROCESSING: { label: 'Complete', next: 'COMPLETED', icon: CheckCircle, color: 'bg-emerald-500' },
    };
    return actions[status];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-green-700 text-white px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/officer')}><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-xl font-bold">Procurement Management</h1>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/officer')}><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl font-bold">Procurement Management</h1>
        </div>
        <button
          onClick={() => navigate('/officer')}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
        >
          Officer Dashboard & Workbench →
        </button>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-3">
        {procs.filter(p => p.status !== 'COMPLETED').length === 0 && (
          <EmptyState
            icon={<Package className="w-8 h-8 text-slate-400" />}
            title="No active procurements found"
            description="When booked lots arrive at the procurement centre, they will appear here for processing."
          />
        )}
        {procs.filter(p => p.status !== 'COMPLETED').map(proc => {
          const action = getNextAction(proc.status, proc.id);
          const isExpanded = expanded === proc.id;
          return (
            <div key={proc.id} className="card">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isExpanded ? null : proc.id)}>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-green-700">{proc.tokenNumber}</span>
                  <span className="font-medium">{proc.farmerName}</span>
                  <span className="text-sm text-gray-500">{proc.produce?.type} - {proc.produce?.quantity} {proc.produce?.unit}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge bg-blue-100 text-blue-800">{(proc.status || 'BOOKED').replace(/_/g, ' ')}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Timeline */}
                  <div className="flex items-center gap-1">{['BOOKED','ARRIVED','GATE_ENTRY','WEIGHING','QUALITY_CHECK','PROCUREMENT','PAYMENT_PENDING','PAYMENT_PROCESSING','COMPLETED'].map((s, i) => {
                    const states = ['BOOKED','ARRIVED','GATE_ENTRY','WEIGHING','QUALITY_CHECK','PROCUREMENT','PAYMENT_PENDING','PAYMENT_PROCESSING','COMPLETED'];
                    const ci = states.indexOf(proc.status);
                    return <div key={s} className={`flex-1 h-2 rounded-full ${i <= ci ? 'bg-green-500' : 'bg-gray-200'}`} />;
                  })}</div>

                  {/* Weighing form */}
                  {proc.status === 'GATE_ENTRY' && (
                    <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-medium text-purple-800">Weighing Data</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="label">Gross Weight (qt)</label><input type="number" className="input-field" value={weighing.grossWeight} onChange={e => setWeighing({ ...weighing, grossWeight: e.target.value })} /></div>
                        <div><label className="label">Tare Weight (qt)</label><input type="number" className="input-field" value={weighing.tareWeight} onChange={e => setWeighing({ ...weighing, tareWeight: e.target.value })} /></div>
                      </div>
                      <p className="text-sm text-purple-600">Net: {(Number(weighing.grossWeight) - Number(weighing.tareWeight)).toFixed(2)} qt</p>
                    </div>
                  )}

                  {/* Quality form */}
                  {proc.status === 'WEIGHING' && (
                    <div className="bg-indigo-50 p-4 rounded-lg space-y-3">
                      <h4 className="font-medium text-indigo-800">Quality Check</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div><label className="label">Moisture %</label><input type="number" className="input-field" value={quality.moistureContent} onChange={e => setQuality({ ...quality, moistureContent: e.target.value })} /></div>
                        <div><label className="label">Grade</label><select className="input-field" value={quality.grade} onChange={e => setQuality({ ...quality, grade: e.target.value })}><option>A</option><option>B</option><option>C</option></select></div>
                        <div><label className="label">Remarks</label><input className="input-field" value={quality.remarks} onChange={e => setQuality({ ...quality, remarks: e.target.value })} /></div>
                      </div>
                    </div>
                  )}

                  {/* Action button */}
                  {action && (
                    <button onClick={() => {
                      let extra: Record<string, unknown> = {};
                      if (proc.status === 'GATE_ENTRY') extra = { weighingData: { grossWeight: Number(weighing.grossWeight) || 12.5, tareWeight: Number(weighing.tareWeight) || 0.5, netWeight: (Number(weighing.grossWeight) || 12.5) - (Number(weighing.tareWeight) || 0.5) } };
                      if (proc.status === 'WEIGHING') extra = { qualityData: { moistureContent: Number(quality.moistureContent) || 11.2, grade: quality.grade, accepted: true, remarks: quality.remarks || 'Good quality', foreignMatter: 0.3 } };
                      handleTransition(proc.id, action.next, extra);
                    }} className={`${action.color} text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 hover:opacity-90`}>
                      <action.icon className="w-4 h-4" />{action.label}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
