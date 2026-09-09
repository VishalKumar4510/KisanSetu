import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { farmerAPI } from '../../services/api';
import { ArrowLeft, Search, User } from 'lucide-react';

export default function FarmerManagement() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { farmerAPI.getAll().then(res => setFarmers(res.data.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = farmers.filter(f => f.name?.toLowerCase().includes(search.toLowerCase()) || f.phone?.includes(search) || f.farmerId?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/officer')}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold">{t('farmerManagement')}</h1>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input className="input-field pl-10" placeholder="Search by name, phone, or farmer ID..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2 pr-3">Farmer ID</th><th className="pb-2 pr-3">Name</th><th className="pb-2 pr-3">Phone</th><th className="pb-2 pr-3">Village</th><th className="pb-2 pr-3">District</th><th className="pb-2 pr-3">Crops</th><th className="pb-2">Land (acres)</th></tr></thead>
            <tbody>{filtered.slice(0, 50).map(f => (
              <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 pr-3 font-mono text-green-700 text-xs">{f.farmerId}</td>
                <td className="py-2.5 pr-3 font-medium">{f.name}</td>
                <td className="py-2.5 pr-3 text-gray-500">{f.phone}</td>
                <td className="py-2.5 pr-3">{f.village}</td>
                <td className="py-2.5 pr-3">{f.district}</td>
                <td className="py-2.5 pr-3 text-xs">{f.crops?.join(', ')}</td>
                <td className="py-2.5">{f.landArea}</td>
              </tr>
            ))}</tbody>
          </table>
          {filtered.length === 0 && <p className="text-center py-8 text-gray-400">{t('noData')}</p>}
          <p className="text-xs text-gray-400 mt-3">Showing {Math.min(50, filtered.length)} of {filtered.length} farmers</p>
        </div>
      </div>
    </div>
  );
}
