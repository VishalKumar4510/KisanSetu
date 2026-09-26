import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { farmerAPI } from '@/services/api';
import {
  ArrowLeft,
  QrCode,
  MapPin,
  Calendar,
  Clock,
  Hash,
  ShieldCheck,
  Printer,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Scale,
  User,
  Phone,
  Share2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';

interface TokenData {
  id: string;
  tokenNumber: string;
  qrData?: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  queuePosition?: number;
  estimatedTime?: string;
  createdAt: string;
  centreId?: string;
  centreName?: string;
  slotDate?: string;
  slotTime?: string;
  bayNumber?: string | number;
}

export default function DigitalToken() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [token, setToken] = useState<TokenData | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchToken();
  }, []);

  const fetchToken = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await farmerAPI.getProfile();
      const profile = res.data.data;
      setFarmerProfile(profile);

      const activeToken = profile?.activeToken;
      if (activeToken) {
        setToken({
          ...activeToken,
          centreName:
            activeToken.centreName ||
            profile?.activeProcurement?.centreName ||
            'APMC Central Mandi Hub',
          slotDate:
            activeToken.slotDate ||
            activeToken.date ||
            new Date(activeToken.createdAt || Date.now()).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
          slotTime: activeToken.slotTime || activeToken.estimatedTime || '09:00 AM – 11:00 AM',
          bayNumber: activeToken.bayNumber || 'Bay 02',
        });
      } else {
        setToken(null);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          (language === 'hi' ? 'टोकन लोड करने में त्रुटि' : 'Failed to load digital token')
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-4 animate-fadeIn">
        <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
        <PageHeader
          title={t('myToken')}
          description={
            language === 'hi'
              ? 'मंडी प्रवेश और वजन कांटे के लिए डिजिटल पास'
              : 'Digital gate pass and weighing verification ticket'
          }
          backButton={{
            label: t('back'),
            onClick: () => navigate('/farmer'),
          }}
        />

        <div className="max-w-md mx-auto py-12">
          <EmptyState
            bordered
            icon={<QrCode className="w-8 h-8 text-[#16A34A]" />}
            title={language === 'hi' ? 'कोई सक्रिय टोकन नहीं मिला' : 'No Active Digital Pass'}
            description={
              language === 'hi'
                ? 'आपके पास वर्तमान में कोई सक्रिय मंडी टोकन नहीं है। पहले एक खरीद स्लॉट बुक करें।'
                : 'You do not have an active mandi entry token. Pre-book an arrival slot to generate your official pass.'
            }
            action={{
              label: language === 'hi' ? 'स्लॉट बुक करें' : 'Book Mandi Slot',
              onClick: () => navigate('/farmer/centres'),
            }}
          />
        </div>
      </div>
    );
  }

  const farmerName = farmerProfile?.name || user?.name || 'Verified Farmer';
  const farmerId = farmerProfile?.farmerId || user?.farmerId || 'KS-FARMER-8421';
  const village = farmerProfile?.village ? `${farmerProfile.village}, ` : '';
  const district = farmerProfile?.district || 'Agricultural Division';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 animate-fadeIn">
      {/* Header (Hidden in Print) */}
      <div className="print:hidden">
        <PageHeader
          title={t('myToken')}
          description={
            language === 'hi'
              ? 'मंडी गेट और तौल कांटे पर यह डिजिटल पास प्रस्तुत करें'
              : 'Present this official digital pass at the APMC Mandi weighbridge gate'
          }
          backButton={{
            label: t('back'),
            onClick: () => navigate('/farmer'),
          }}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
                className="text-xs"
              >
                {language === 'hi' ? 'प्रिंट / सेव' : 'Print Pass'}
              </Button>
            </div>
          }
        />
      </div>

      {/* Main Digital Pass Container (Printable) */}
      <div className="flex justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-200/90 overflow-hidden relative">
          {/* Top Pass Brand Header */}
          <div className="bg-gradient-to-r from-[#14532D] via-[#16A34A] to-[#15803D] text-white p-5 sm:p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-100">
                GOVT. OF INDIA • KISAN SETU
              </span>
            </div>

            <h2 className="text-lg font-black tracking-tight text-white">
              {language === 'hi' ? 'आधिकारिक मंडी डिजिटल टोकन' : 'Mandi Weighment Gate Pass'}
            </h2>
            <p className="text-[11px] text-emerald-100 opacity-90 mt-0.5">
              APMC Electronic Procurement & DBT Authentication
            </p>

            <div className="mt-3 inline-flex items-center">
              <StatusBadge
                status={token.status || 'ACTIVE'}
                language={language}
                size="md"
                className="bg-white/95 text-emerald-950 font-bold shadow-2xs border-0"
              />
            </div>
          </div>

          {/* Token Number Hero Section */}
          <div className="p-6 text-center bg-emerald-50/40 border-b border-gray-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              {t('tokenNumber')}
            </span>
            <p className="text-3xl sm:text-4xl md:text-5xl font-black text-[#14532D] font-mono tracking-wider mt-1 select-all break-all sm:break-normal">
              {token.tokenNumber}
            </p>

            {token.queuePosition !== undefined && token.queuePosition > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-green-200 shadow-2xs text-xs font-semibold text-[#16A34A]">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {language === 'hi'
                    ? `कतार क्रमांक #${token.queuePosition}`
                    : `Queue Position #${token.queuePosition}`}
                </span>
                {token.estimatedTime && (
                  <span className="text-gray-400 font-normal">
                    (~{token.estimatedTime} min)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Perforated Divider Line with Cutout Notches */}
          <div className="relative py-1">
            <div className="border-t-2 border-dashed border-gray-300 w-full" />
            {/* Left Notch */}
            <div className="absolute -left-3.5 -top-3 w-7 h-7 rounded-full bg-[#F7F9F5] border-r border-gray-300" />
            {/* Right Notch */}
            <div className="absolute -right-3.5 -top-3 w-7 h-7 rounded-full bg-[#F7F9F5] border-l border-gray-300" />
          </div>

          {/* QR Code Container */}
          <div className="px-6 py-5 flex flex-col items-center justify-center text-center bg-white">
            <div className="relative p-3.5 rounded-2xl bg-white border-2 border-gray-900 shadow-md">
              {/* Corner Viewfinder Accents */}
              <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-[#16A34A]" />
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-[#16A34A]" />
              <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-[#16A34A]" />
              <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-[#16A34A]" />

              {/* Simulated Authentic High-Density QR Code */}
              <div className="w-44 h-44 bg-white flex items-center justify-center relative overflow-hidden">
                {/* 10x10 Simulated matrix */}
                <div className="grid grid-cols-10 grid-rows-10 gap-1 w-full h-full p-1">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const row = Math.floor(i / 10);
                    const col = i % 10;
                    // Corners
                    const isTopLeft = row < 3 && col < 3;
                    const isTopRight = row < 3 && col >= 7;
                    const isBottomLeft = row >= 7 && col < 3;
                    const isCenter = row >= 4 && row <= 5 && col >= 4 && col <= 5;
                    const isNoise = (i * 7 + 13) % 3 === 0;

                    const isDark = isTopLeft || isTopRight || isBottomLeft || isCenter || isNoise;

                    return (
                      <div
                        key={i}
                        className={`rounded-[1px] ${
                          isDark ? 'bg-[#17201A]' : 'bg-gray-100'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Central QR badge icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-300 shadow-sm flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-[#16A34A]" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs font-bold text-[#17201A] mt-3">
              {language === 'hi'
                ? 'मंडी प्रवेश द्वार पर स्कैन करें'
                : 'Scan at Mandi Entry Barrier / Weighbridge'}
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Automated RFID / QR gate recognition
            </p>
          </div>

          {/* Perforated Divider Line */}
          <div className="relative py-1">
            <div className="border-t-2 border-dashed border-gray-300 w-full" />
            <div className="absolute -left-3.5 -top-3 w-7 h-7 rounded-full bg-[#F7F9F5] border-r border-gray-300" />
            <div className="absolute -right-3.5 -top-3 w-7 h-7 rounded-full bg-[#F7F9F5] border-l border-gray-300" />
          </div>

          {/* Mandi & Farmer Information Grid */}
          <div className="p-6 bg-gray-50/70 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Farmer Info */}
              <div className="p-3 rounded-2xl bg-white border border-gray-200/70 space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-tight flex items-center gap-1">
                  <User className="w-3 h-3 text-[#16A34A]" />
                  {t('farmer')}
                </span>
                <p className="font-extrabold text-[#17201A] text-xs truncate">
                  {farmerName}
                </p>
                <p className="text-[10px] text-[#64748B] font-mono truncate">
                  {farmerId}
                </p>
              </div>

              {/* Mandi Centre */}
              <div className="p-3 rounded-2xl bg-white border border-gray-200/70 space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-tight flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#16A34A]" />
                  {t('centre')}
                </span>
                <p className="font-extrabold text-[#17201A] text-xs truncate">
                  {token.centreName}
                </p>
                <p className="text-[10px] text-emerald-700 font-semibold truncate">
                  {token.bayNumber}
                </p>
              </div>

              {/* Slot Date */}
              <div className="p-3 rounded-2xl bg-white border border-gray-200/70 space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-tight flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#16A34A]" />
                  {t('date')}
                </span>
                <p className="font-extrabold text-[#17201A] text-xs">
                  {token.slotDate}
                </p>
                <p className="text-[10px] text-[#64748B]">Valid on date only</p>
              </div>

              {/* Slot Time Window */}
              <div className="p-3 rounded-2xl bg-white border border-gray-200/70 space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-tight flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#16A34A]" />
                  {t('slotTime')}
                </span>
                <p className="font-extrabold text-[#17201A] text-xs truncate">
                  {token.slotTime}
                </p>
                <p className="text-[10px] text-[#64748B]">Arrival Window</p>
              </div>
            </div>

            {/* Official Security Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {language === 'hi' ? 'सुरक्षा सूचना' : 'Official Security Notice'}
                </span>
              </div>
              <p className="text-[11px] text-amber-950/85 leading-relaxed">
                {language === 'hi'
                  ? 'यह डिजिटल टोकन किसान पहचान और आधार से सुरक्षित रूप से जुड़ा है। यह केवल एक वाहन और एक बार प्रवेश के लिए मान्य है।'
                  : 'This digital pass is securely linked to the registered Farmer ID. Valid for single vehicle entry only at the designated weighment station.'}
              </p>
            </div>
          </div>

          {/* Footer Actions (Hidden in Print) */}
          <div className="p-5 bg-white border-t border-gray-200/80 space-y-2.5 print:hidden">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/farmer/queue')}
              leftIcon={<Users className="w-4 h-4" />}
              className="w-full justify-center shadow-xs"
            >
              {language === 'hi' ? 'लाइव कतार स्थिति ट्रैक करें' : 'Track Live Queue Position'}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
                className="flex-1 text-xs"
              >
                {language === 'hi' ? 'टोकन प्रिंट करें' : 'Print Pass'}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/farmer')}
                className="flex-1 text-xs"
              >
                {language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
