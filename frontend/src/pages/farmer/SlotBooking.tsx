import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { slotAPI, centreAPI, farmerAPI } from '@/services/api';
import {
  ArrowLeft,
  Clock,
  Users,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Ticket,
  MapPin,
  Scale,
  Package,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';

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

interface BookingSuccessData {
  tokenNumber: string;
  queuePosition: number;
  estimatedTime?: string;
  centreName?: string;
}

function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function SlotBooking() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const centreId = searchParams.get('centreId') || '';

  const todayStr = formatDateToYMD(new Date());
  const tomorrowStr = formatDateToYMD(new Date(Date.now() + 86400000));
  const dayAfterStr = formatDateToYMD(new Date(Date.now() + 172800000));

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [centreInfo, setCentreInfo] = useState<any>(null);
  const [recommended, setRecommended] = useState<RecommendedSlot[]>([]);
  const [available, setAvailable] = useState<SlotData[]>([]);
  const [produceList, setProduceList] = useState<any[]>([]);
  const [produceId, setProduceId] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccessData | null>(null);

  useEffect(() => {
    fetchData();
  }, [centreId, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises: Promise<any>[] = [
        slotAPI.getAvailable(centreId, selectedDate),
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
        if (cData) setCentreInfo(cData);
      }

      const pData = results[results.length - 1].data.data;
      const pList = pData?.produce || pData;
      if (Array.isArray(pList) && pList.length > 0) {
        setProduceList(pList);
        if (!produceId) {
          setProduceId(pList[pList.length - 1].id);
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          (language === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Failed to load slot data')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (booking || !selectedSlot) return;
    setBooking(true);
    setError(null);
    try {
      const res = await slotAPI.book({
        centreId: selectedSlot.centreId || centreId,
        slotId: selectedSlot.id,
        produceId: produceId || undefined,
      });

      const tokenData = res.data?.data?.token;
      if (tokenData) {
        setBookingSuccess({
          tokenNumber: tokenData.tokenNumber,
          queuePosition: tokenData.queuePosition,
          estimatedTime: tokenData.estimatedTime,
          centreName: tokenData.centreName || centreInfo?.name,
        });
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          (language === 'hi' ? 'बुकिंग विफल रही' : 'Slot reservation failed')
      );
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

  const getSlotAvailability = (slot: SlotData) => {
    const remaining = Math.max(0, slot.maxCapacity - slot.currentBookings);
    const pct = (slot.currentBookings / slot.maxCapacity) * 100;

    if (slot.status === 'FULL' || remaining === 0) {
      return {
        variant: 'error' as const,
        label: language === 'hi' ? 'भरा हुआ' : 'Full',
        color: 'text-red-700',
        bg: 'bg-red-50 border-red-200',
        remaining: 0,
        isFull: true,
      };
    }
    if (pct >= 80) {
      return {
        variant: 'warning' as const,
        label: `${remaining} ${language === 'hi' ? 'सीटें शेष' : 'slots left'}`,
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        remaining,
        isFull: false,
      };
    }
    return {
      variant: 'primary' as const,
      label: `${remaining} ${language === 'hi' ? 'उपलब्ध' : 'available'}`,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
      remaining,
      isFull: false,
    };
  };

  const selectedProduceCrop = produceList.find((p) => p.id === produceId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 animate-fadeIn">
      {/* Header */}
      <PageHeader
        title={t('bookSlot')}
        description={
          language === 'hi'
            ? 'अपनी सुविधा अनुसार तारीख और समय चुनें'
            : 'Select preferred arrival date & time window for mandi weighment'
        }
        backButton={{
          label: language === 'hi' ? 'केंद्र सूची' : 'Centres',
          onClick: () => navigate('/farmer/centres'),
        }}
        badge={
          centreInfo?.name ? (
            <Badge variant="primary" size="sm">
              {centreInfo.name}
            </Badge>
          ) : undefined
        }
      />

      {/* Centre Context Card */}
      {centreInfo && (
        <Card className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/70 via-white to-green-50/50 border-green-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#17201A]">
                  {centreInfo.name}
                </h3>
                <StatusBadge
                  status={centreInfo.congestionLevel || 'GREEN'}
                  language={language}
                  size="sm"
                />
              </div>
              <p className="text-xs text-[#64748B] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
                {centreInfo.location}, {centreInfo.district}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#14532D]">
              <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-green-200">
                <Scale className="w-3.5 h-3.5 text-[#16A34A]" />
                {centreInfo.activeBays || 4} {language === 'hi' ? 'तौल कांटे' : 'Bays Active'}
              </span>
              <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-green-200">
                <Clock className="w-3.5 h-3.5 text-[#16A34A]" />
                ~{centreInfo.avgWaitTime || 20} {language === 'hi' ? 'मिनट प्रतीक्षा' : 'min wait'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Date Selector Chips */}
      <section className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {language === 'hi' ? 'आगमन की तारीख चुनें' : 'Select Arrival Date'}
        </label>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {[
            {
              id: todayStr,
              label: language === 'hi' ? 'आज' : 'Today',
              sub: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            },
            {
              id: tomorrowStr,
              label: language === 'hi' ? 'कल' : 'Tomorrow',
              sub: new Date(Date.now() + 86400000).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              }),
            },
            {
              id: dayAfterStr,
              label: language === 'hi' ? 'परसों' : 'Day After',
              sub: new Date(Date.now() + 172800000).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              }),
            },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDate(d.id)}
              className={`p-3 rounded-2xl border text-center transition-all duration-150 active:scale-[0.98] ${
                selectedDate === d.id
                  ? 'bg-[#16A34A] text-white border-[#15803D] shadow-xs'
                  : 'bg-white text-[#17201A] border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              <p className="font-bold text-xs sm:text-sm leading-tight">{d.label}</p>
              <p
                className={`text-[10px] mt-0.5 ${
                  selectedDate === d.id ? 'text-emerald-100' : 'text-[#64748B]'
                }`}
              >
                {d.sub}
              </p>
            </button>
          ))}

          {/* Custom Date Input for Desktop/Flexible Picking */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              min={todayStr}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="w-full h-full p-2.5 text-xs rounded-2xl bg-white border border-gray-200/80 text-[#17201A] font-medium focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] outline-none"
            />
          </div>
        </div>
      </section>

      {/* Produce Selection (If farmer has registered harvests) */}
      {produceList.length > 0 && (
        <section className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            {language === 'hi' ? 'फसल उपज चुनें' : 'Select Produce For Weighment'}
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {produceList.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProduceId(p.id)}
                className={`px-3.5 py-2 rounded-xl font-medium shrink-0 transition-all border flex items-center gap-2 ${
                  produceId === p.id
                    ? 'bg-[#F0FDF4] text-[#15803D] border-[#16A34A] shadow-2xs font-bold'
                    : 'bg-white text-[#64748B] border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>🌾</span>
                <span>{p.type}</span>
                <span className="text-[10px] text-gray-500 font-normal">
                  ({p.quantity} {p.unit || 'Qt'})
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-3 text-red-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="text-xs text-red-700 hover:bg-red-100"
          >
            {language === 'hi' ? 'ठीक है' : 'Dismiss'}
          </Button>
        </div>
      )}

      {/* AI Recommended Slot Banner */}
      {recommended.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>{t('recommended')}</span>
          </div>

          {recommended.slice(0, 1).map((rec, idx) => {
            const slot = rec.slot;
            const avail = getSlotAvailability(slot);

            return (
              <div
                key={slot.id || idx}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white border-2 border-amber-300 p-5 sm:p-6 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-200 text-amber-900">
                        ⚡ {language === 'hi' ? 'सर्वोत्तम समय' : 'AI Optimal Pick'}
                      </span>
                      <span className="text-xs text-[#64748B]">{slot.date}</span>
                    </div>

                    <h4 className="text-xl sm:text-2xl font-black text-[#17201A] tracking-tight">
                      {formatTime(slot.timeStart)} – {formatTime(slot.timeEnd)}
                    </h4>

                    <p className="text-xs text-amber-950 font-medium flex items-center gap-1.5 bg-amber-100/70 px-3 py-1.5 rounded-xl max-w-lg">
                      <span>💡</span>
                      <span>{language === 'hi' ? rec.reasonHi : rec.reason}</span>
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${avail.bg} ${avail.color}`}>
                      {avail.label}
                    </span>
                    <Button
                      variant="primary"
                      size="md"
                      disabled={avail.isFull}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setShowModal(true);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white shadow-xs w-full sm:w-auto"
                    >
                      {language === 'hi' ? 'यह स्लॉट चुनें' : 'Select AI Slot'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Available Slots List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-[#17201A]">
            {language === 'hi' ? 'उपलब्ध समय स्लॉट' : 'Available Time Slots'}
          </h3>
          <span className="text-xs text-[#64748B]">
            {available.length} {language === 'hi' ? 'स्लॉट' : 'slots'} for {selectedDate}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : available.length === 0 ? (
          <EmptyState
            bordered
            icon={<Clock className="w-7 h-7 text-gray-400" />}
            title={language === 'hi' ? 'कोई स्लॉट उपलब्ध नहीं' : 'No Slots Available for this Date'}
            description={
              language === 'hi'
                ? 'इस तारीख के लिए सभी स्लॉट भर चुके हैं या मंडी बंद है। कृपया कोई अन्य तारीख चुनें।'
                : 'All slots for this day are either fully booked or offline. Please choose a different date above.'
            }
            action={{
              label: language === 'hi' ? 'कल के स्लॉट देखें' : 'Check Tomorrow',
              onClick: () => setSelectedDate(tomorrowStr),
            }}
          />
        ) : (
          <div className="space-y-3">
            {available.map((slot) => {
              const avail = getSlotAvailability(slot);
              const isSelected = selectedSlot?.id === slot.id;
              const loadPct = Math.min(
                Math.round((slot.currentBookings / slot.maxCapacity) * 100),
                100
              );

              return (
                <div
                  key={slot.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-white ${
                    avail.isFull
                      ? 'opacity-60 border-gray-200 bg-gray-50'
                      : isSelected
                      ? 'border-[#16A34A] ring-2 ring-[#16A34A]/20 shadow-xs'
                      : 'border-gray-200/90 hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0 shadow-2xs">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base sm:text-lg text-[#17201A]">
                          {formatTime(slot.timeStart)} – {formatTime(slot.timeEnd)}
                        </h4>
                        <p className="text-xs text-[#64748B] flex items-center gap-2 mt-0.5">
                          <span>{slot.date}</span>
                          <span>•</span>
                          <span>
                            {slot.currentBookings} / {slot.maxCapacity} {language === 'hi' ? 'बुक' : 'booked'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${avail.bg} ${avail.color}`}>
                        {avail.label}
                      </span>
                      <Button
                        variant={avail.isFull ? 'outline' : 'primary'}
                        size="md"
                        disabled={avail.isFull}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setShowModal(true);
                        }}
                        className="min-w-[100px]"
                      >
                        {avail.isFull
                          ? language === 'hi'
                            ? 'भरा हुआ'
                            : 'Full'
                          : language === 'hi'
                          ? 'बुक करें'
                          : 'Book'}
                      </Button>
                    </div>
                  </div>

                  {/* Slot Capacity Progress */}
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                    <div className="flex justify-between text-[11px] text-[#64748B]">
                      <span>{language === 'hi' ? 'क्षमता' : 'Capacity Load'}</span>
                      <span>{loadPct}%</span>
                    </div>
                    <Progress
                      value={loadPct}
                      variant={avail.isFull ? 'error' : loadPct > 70 ? 'warning' : 'primary'}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showModal && selectedSlot !== null}
        onClose={() => {
          if (!booking) setShowModal(false);
        }}
        size="md"
        ariaLabel="Confirm Slot Booking"
      >
        <ModalHeader>
          <ModalTitle>
            {language === 'hi' ? 'स्लॉट बुकिंग की पुष्टि करें' : 'Confirm Slot Reservation'}
          </ModalTitle>
          <ModalDescription>
            {language === 'hi'
              ? 'कृपया खरीद केंद्र और आगमन समय विवरण की जांच करें।'
              : 'Please review your arrival window and mandi procurement details.'}
          </ModalDescription>
        </ModalHeader>

        {selectedSlot && (
          <ModalBody>
            <div className="space-y-3 bg-[#F0FDF4] p-4 rounded-2xl border border-green-200/80">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">{t('centre')}:</span>
                <span className="font-bold text-[#17201A]">{centreInfo?.name || 'Mandi Centre'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">{t('date')}:</span>
                <span className="font-bold text-[#17201A]">{selectedSlot.date}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B]">{t('slotTime')}:</span>
                <span className="font-extrabold text-[#16A34A]">
                  {formatTime(selectedSlot.timeStart)} – {formatTime(selectedSlot.timeEnd)}
                </span>
              </div>
              {selectedProduceCrop && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#64748B]">{language === 'hi' ? 'फसल' : 'Harvest Crop'}:</span>
                  <span className="font-bold text-[#17201A]">
                    {selectedProduceCrop.type} ({selectedProduceCrop.quantity} {selectedProduceCrop.unit || 'Qt'})
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200/70 text-xs text-[#64748B]">
              <Info className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>
                {language === 'hi'
                  ? 'पुष्टि के बाद डिजिटल टोकन और क्यूआर कोड तैयार किया जाएगा जिसे मंडी गेट पर दिखाना होगा।'
                  : 'An authenticated digital token pass will be generated. Present the QR code at the weighbridge entrance.'}
              </span>
            </div>
          </ModalBody>
        )}

        <ModalFooter>
          <Button
            variant="ghost"
            size="md"
            disabled={booking}
            onClick={() => setShowModal(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            size="md"
            isLoading={booking}
            onClick={handleBook}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {language === 'hi' ? 'पुष्टि करें और टोकन लें' : 'Confirm & Generate Pass'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={bookingSuccess !== null}
        onClose={() => setBookingSuccess(null)}
        size="md"
        ariaLabel="Booking Confirmed"
      >
        <ModalBody className="text-center pt-3 pb-2 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#16A34A] flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-[#17201A] tracking-tight">
              {language === 'hi' ? 'स्लॉट सफलतापूर्वक आरक्षित हुआ!' : 'Slot Reserved Successfully!'}
            </h3>
            <p className="text-xs text-[#64748B]">
              {language === 'hi'
                ? 'आपका डिजिटल टोकन और कतार क्रमांक तैयार है'
                : 'Your government-authenticated digital pass has been issued'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F0FDF4] to-emerald-50/60 border border-green-200 text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748B] font-medium">{t('tokenNumber')}:</span>
              <span className="text-2xl font-black text-[#14532D] font-mono">
                {bookingSuccess?.tokenNumber}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B]">{language === 'hi' ? 'कतार स्थिति' : 'Live Position'}:</span>
              <span className="font-extrabold text-[#17201A] bg-white px-2 py-0.5 rounded-lg border border-green-200">
                #{bookingSuccess?.queuePosition}
              </span>
            </div>
            {bookingSuccess?.centreName && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">{t('centre')}:</span>
                <span className="font-semibold text-[#17201A] truncate max-w-[200px]">
                  {bookingSuccess.centreName}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setBookingSuccess(null);
                navigate('/farmer/token');
              }}
              leftIcon={<Ticket className="w-4 h-4" />}
              className="w-full justify-center shadow-xs"
            >
              {language === 'hi' ? 'डिजिटल टोकन पास देखें' : 'View Digital QR Pass'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setBookingSuccess(null);
                navigate('/farmer/queue');
              }}
              leftIcon={<Users className="w-4 h-4" />}
              className="w-full justify-center"
            >
              {language === 'hi' ? 'लाइव कतार ट्रैक करें' : 'Track Live Queue'}
            </Button>
            <button
              onClick={() => {
                setBookingSuccess(null);
                navigate('/farmer');
              }}
              className="text-xs text-[#64748B] hover:text-[#17201A] hover:underline pt-1 block mx-auto"
            >
              {language === 'hi' ? 'डैशबोर्ड पर वापस जाएं' : 'Return to Dashboard'}
            </button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
