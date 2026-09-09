import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { slotAPI, centreAPI, farmerAPI } from '../../services/api';
import { ArrowLeft, Clock, Users, Star, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface SlotData {
  id: string;
  centreId: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  maxCapacity: number;
  currentBookings: number;
  status: string;
}

interface RecommendedSlot {
  slot: SlotData;
  centre?: { name: string };
  score: number;
  reason: string;
  reasonHi: string;
}

export default function SlotBooking() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const centreId = searchParams.get('centreId') || '';

  const [centreName, setCentreName] = useState('');
  const [recommended, setRecommended] = useState<RecommendedSlot[]>([]);
  const [available, setAvailable] = useState<SlotData[]>([]);
  const [produceId, setProduceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchData();
  }, [centreId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const promises: Promise<any>[] = [
        slotAPI.getAvailable(centreId),
        slotAPI.getRecommended(user?.farmerId),
      ];
      if (centreId) promises.push(centreAPI.getById(centreId));
      promises.push(farmerAPI.getProduce());

      const results = await Promise.all(promises);

      const availableData = results[0].data.data?.slots || results[0].data.data || [];
      setAvailable(Array.isArray(availableData) ? availableData : []);

      const recData = results[1].data.data?.recommendations || results[1].data.data || [];
      setRecommended(Array.isArray(recData) ? recData : []);

      if (centreId && results[2]) {
        const cData = results[2].data.data?.centre || results[2].data.data;
        if (cData) setCentreName(cData.name);
      }

      const produceData = results[results.length - 1].data.data;
      const produceList = produceData?.produce || produceData;
      if (Array.isArray(produceList) && produceList.length > 0) {
        setProduceId(produceList[produceList.length - 1].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || (language === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      await slotAPI.book({
        centreId: selectedSlot.centreId || centreId,
        slotId: selectedSlot.id,
        produceId: produceId || undefined,
      });
      setShowModal(false);
      navigate('/farmer/token');
    } catch (err: any) {
      setError(err.response?.data?.error || (language === 'hi' ? 'बुकिंग विफल' : 'Booking failed'));
      setShowModal(false);
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [h, m] = time.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    } catch {
      return time;
    }
  };

  const getAvailability = (slot: SlotData) => {
    const remaining = slot.maxCapacity - slot.currentBookings;
    const pct = (slot.currentBookings / slot.maxCapacity) * 100;
    if (pct >= 90) return { color: 'text-red-600', bg: 'bg-red-50', label: language === 'hi' ? 'लगभग भरा' : 'Almost Full' };
    if (pct >= 60) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: `${remaining} ${language === 'hi' ? 'बाकी' : 'left'}` };
    return { color: 'text-green-600', bg: 'bg-green-50', label: `${remaining} ${t('available').toLowerCase()}` };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg">{t('bookSlot')}</h1>
            {centreName && <p className="text-green-100 text-xs">{centreName}</p>}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-red-600 font-semibold underline mt-1">
              {language === 'hi' ? 'ठीक है' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

      <div className="px-4 mt-4 space-y-5">
        {/* Recommended Slots */}
        {recommended.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-500" />
              <h2 className="font-semibold text-gray-800">{t('recommended')}</h2>
            </div>
            <div className="space-y-2">
              {recommended.map((rec, idx) => {
                const slot = rec.slot;
                const avail = getAvailability(slot);
                return (
                  <div
                    key={slot.id || idx}
                    className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {formatTime(slot.timeStart)} – {formatTime(slot.timeEnd)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{slot.date}</p>
                        {rec.centre?.name && (
                          <p className="text-xs text-gray-400 mt-0.5">{rec.centre.name}</p>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${avail.bg} ${avail.color}`}>
                        {avail.label}
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-2 bg-yellow-100 rounded-lg px-2 py-1 inline-block">
                      💡 {language === 'hi' ? rec.reasonHi : rec.reason}
                    </p>
                    <button
                      onClick={() => { setSelectedSlot(slot); setShowModal(true); }}
                      disabled={slot.status === 'FULL'}
                      className="mt-3 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('book')}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Available Slots */}
        <section>
          <h2 className="font-semibold text-gray-800 mb-3">
            {language === 'hi' ? 'उपलब्ध स्लॉट' : 'Available Slots'}
          </h2>
          {available.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{t('noData')}</p>
              <p className="text-gray-400 text-sm mt-1">
                {language === 'hi' ? 'कोई स्लॉट उपलब्ध नहीं' : 'No slots available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {available.map((slot) => {
                const avail = getAvailability(slot);
                const isFull = slot.status === 'FULL';
                return (
                  <div
                    key={slot.id}
                    className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm ${isFull ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {formatTime(slot.timeStart)} – {formatTime(slot.timeEnd)}
                          </p>
                          <p className="text-xs text-gray-500">{slot.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${avail.bg} ${avail.color}`}>
                          {avail.label}
                        </span>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-[11px] text-gray-400">
                            {slot.currentBookings}/{slot.maxCapacity}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Capacity Bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isFull ? 'bg-red-400' :
                          slot.currentBookings / slot.maxCapacity > 0.6 ? 'bg-yellow-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${(slot.currentBookings / slot.maxCapacity) * 100}%` }}
                      />
                    </div>
                    <button
                      onClick={() => { setSelectedSlot(slot); setShowModal(true); }}
                      disabled={isFull}
                      className="mt-3 w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isFull ? (language === 'hi' ? 'भरा हुआ' : 'Full') : t('book')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-800">{t('confirm')} {t('bookSlot')}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{t('slotTime')}</span>
                <span className="font-semibold text-gray-800">
                  {formatTime(selectedSlot.timeStart)} – {formatTime(selectedSlot.timeEnd)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{t('date')}</span>
                <span className="font-semibold text-gray-800">{selectedSlot.date}</span>
              </div>
              {centreName && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t('centre')}</span>
                  <span className="font-semibold text-gray-800">{centreName}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{t('available')}</span>
                <span className="font-semibold text-gray-800">
                  {selectedSlot.maxCapacity - selectedSlot.currentBookings} {language === 'hi' ? 'स्लॉट' : 'slots'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleBook}
                disabled={booking}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {booking ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {t('confirm')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
