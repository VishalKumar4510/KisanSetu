import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { procurementAPI } from '../../services/api';
import { ArrowLeft, CheckCircle, Circle, Scale, FlaskConical, MapPin, Clock } from 'lucide-react';

const FLOW_STEPS = [
  'BOOKED', 'ARRIVED', 'GATE_ENTRY', 'WEIGHING', 'QUALITY_CHECK',
  'PROCUREMENT', 'PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'COMPLETED',
] as const;

const STEP_CONFIG: Record<string, { labelEn: string; labelHi: string; icon: string }> = {
  BOOKED: { labelEn: 'Slot Booked', labelHi: 'स्लॉट बुक', icon: '📅' },
  ARRIVED: { labelEn: 'Arrived at Centre', labelHi: 'केंद्र पर पहुंचे', icon: '🚜' },
  GATE_ENTRY: { labelEn: 'Gate Entry', labelHi: 'गेट प्रवेश', icon: '🚪' },
  WEIGHING: { labelEn: 'Weighing', labelHi: 'तौल', icon: '⚖️' },
  QUALITY_CHECK: { labelEn: 'Quality Check', labelHi: 'गुणवत्ता जांच', icon: '🔬' },
  PROCUREMENT: { labelEn: 'Procurement Done', labelHi: 'खरीद पूर्ण', icon: '✅' },
  PAYMENT_PENDING: { labelEn: 'Payment Pending', labelHi: 'भुगतान लंबित', icon: '⏳' },
  PAYMENT_PROCESSING: { labelEn: 'Payment Processing', labelHi: 'भुगतान प्रक्रिया में', icon: '💳' },
  COMPLETED: { labelEn: 'Completed', labelHi: 'पूर्ण', icon: '🎉' },
};

const TIMESTAMP_KEYS: Record<string, string> = {
  BOOKED: 'bookedAt',
  ARRIVED: 'arrivedAt',
  GATE_ENTRY: 'gateEntryAt',
  WEIGHING: 'weighingAt',
  QUALITY_CHECK: 'qualityCheckAt',
  PROCUREMENT: 'procurementAt',
  PAYMENT_PENDING: 'paymentPendingAt',
  PAYMENT_PROCESSING: 'paymentProcessingAt',
  COMPLETED: 'completedAt',
};

export default function ProcurementProgress() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [procurement, setProcurement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await procurementAPI.getCurrent(user?.farmerId);
      setProcurement(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || (language === 'hi' ? 'डेटा लोड करने में त्रुटि' : 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: string | undefined) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
      });
    } catch {
      return ts;
    }
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

  if (!procurement) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-600 text-white px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">{t('procurementStatus')}</h1>
          </div>
        </div>
        <div className="flex items-center justify-center px-4 mt-20">
          <div className="text-center">
            <Circle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{language === 'hi' ? 'कोई सक्रिय खरीद नहीं' : 'No Active Procurement'}</p>
            <p className="text-gray-400 text-sm mt-2">
              {language === 'hi' ? 'स्लॉट बुक करने के बाद यहां स्थिति दिखेगी' : 'Status will appear after booking a slot'}
            </p>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = FLOW_STEPS.indexOf(procurement.status);
  const weighing = procurement.weighingData || procurement.weighing;
  const quality = procurement.qualityData || procurement.qualityCheck;

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg">{t('procurementStatus')}</h1>
            {procurement.centreName && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-green-200" />
                <p className="text-green-100 text-xs">{procurement.centreName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Status Badge */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
            procurement.status === 'COMPLETED' ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {STEP_CONFIG[procurement.status]?.icon || '📋'}
          </div>
          <div>
            <p className="text-xs text-gray-400">{language === 'hi' ? 'वर्तमान स्थिति' : 'Current Status'}</p>
            <p className="font-bold text-lg text-gray-800">
              {language === 'hi'
                ? STEP_CONFIG[procurement.status]?.labelHi
                : STEP_CONFIG[procurement.status]?.labelEn}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {language === 'hi' ? `चरण ${currentIdx + 1} / ${FLOW_STEPS.length}` : `Step ${currentIdx + 1} of ${FLOW_STEPS.length}`}
            </p>
          </div>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="px-4 mt-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="relative">
            {FLOW_STEPS.map((step, idx) => {
              const isDone = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              const isFuture = idx > currentIdx;
              const config = STEP_CONFIG[step];
              const timestampKey = TIMESTAMP_KEYS[step];
              const timestamp = procurement[timestampKey];
              const isLast = idx === FLOW_STEPS.length - 1;

              return (
                <div key={step} className="flex gap-4">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        isDone
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-green-500 text-white ring-4 ring-green-100'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 min-h-[32px] ${
                        idx < currentIdx ? 'bg-green-400' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-5 flex-1 ${isFuture ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{config.icon}</span>
                      <p className={`font-semibold text-sm ${isDone ? 'text-gray-800' : 'text-gray-400'}`}>
                        {language === 'hi' ? config.labelHi : config.labelEn}
                      </p>
                    </div>
                    {timestamp && (
                      <div className="flex items-center gap-1 mt-1 ml-7">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-[11px] text-gray-400">{formatTimestamp(timestamp)}</p>
                      </div>
                    )}

                    {/* Weighing Data */}
                    {step === 'WEIGHING' && weighing && isDone && (
                      <div className="ml-7 mt-2 bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Scale className="w-3.5 h-3.5 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-700">{t('weight')} {language === 'hi' ? 'विवरण' : 'Details'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-[10px] text-purple-500">{language === 'hi' ? 'सकल' : 'Gross'}</p>
                            <p className="text-sm font-bold text-purple-800">{weighing.grossWeight} kg</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-purple-500">{language === 'hi' ? 'टेयर' : 'Tare'}</p>
                            <p className="text-sm font-bold text-purple-800">{weighing.tareWeight} kg</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-purple-500">{language === 'hi' ? 'शुद्ध' : 'Net'}</p>
                            <p className="text-sm font-bold text-green-700">{weighing.netWeight} kg</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quality Data */}
                    {step === 'QUALITY_CHECK' && quality && isDone && (
                      <div className="ml-7 mt-2 bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-xs font-semibold text-indigo-700">{t('quality')} {language === 'hi' ? 'विवरण' : 'Details'}</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-indigo-500">{t('grade')}</span>
                            <span className={`font-bold ${quality.grade === 'A' ? 'text-green-600' : quality.grade === 'B' ? 'text-yellow-600' : 'text-red-600'}`}>
                              {language === 'hi' ? 'ग्रेड' : 'Grade'} {quality.grade}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-indigo-500">{language === 'hi' ? 'नमी' : 'Moisture'}</span>
                            <span className="font-semibold text-indigo-800">{quality.moistureContent}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-indigo-500">{language === 'hi' ? 'विदेशी पदार्थ' : 'Foreign Matter'}</span>
                            <span className="font-semibold text-indigo-800">{quality.foreignMatter}%</span>
                          </div>
                          {quality.remarks && (
                            <p className="text-[11px] text-indigo-600 mt-1 italic">"{quality.remarks}"</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
