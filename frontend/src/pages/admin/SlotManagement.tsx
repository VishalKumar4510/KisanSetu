import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { slotAPI, centreAPI } from '../../services/api';
import { ArrowLeft, Calendar } from 'lucide-react';

export default function SlotManagement() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [centres, setCentres] = useState<any[]>([]);
  const [selectedCentre, setSelectedCentre] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { centreAPI.getAll().then(r => { setCentres(r.data.data || []); if (r.data.data.length > 0) setSelectedCentre(r.data.data[0].id); }).finally(() => setLoading(false)); }, []);
  useEffect(() => { if (selectedCentre) slotAPI.getAvailable(selectedCentre, date).then(r => setSlots(r.data.data || [])); }, [selectedCentre, date]);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" /></div>;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white px-6 py-4 flex items-center gap-4"><button onClick={() => navigate('/admin')}><ArrowLeft className="w-5 h-5" /></button><h1 className="text-xl font-bold">{t('slotManagement')}</h1></header>
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        <div className="flex gap-4">
          <select value={selectedCentre} onChange={e => setSelectedCentre(e.target.value)} className="input-field w-auto">{centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-auto" />
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2 pr-3">Time</th><th className="pb-2 pr-3">Max Capacity</th><th className="pb-2 pr-3">Booked</th><th className="pb-2 pr-3">Available</th><th className="pb-2">Status</th></tr></thead>
            <tbody>{slots.length > 0 ? slots.map(s => (
              <tr key={s.id} className="border-b border-gray-50"><td className="py-2.5 pr-3 font-medium">{s.timeStart} - {s.timeEnd}</td><td className="py-2.5 pr-3">{s.maxCapacity}</td><td className="py-2.5 pr-3">{s.currentBookings}</td><td className="py-2.5 pr-3 font-semibold text-green-600">{s.maxCapacity - s.currentBookings}</td><td className="py-2.5"><span className={`badge ${s.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.status}</span></td></tr>
            )) : <tr><td colSpan={5} className="py-8 text-center text-gray-400">{t('noData')}</td></tr>}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
