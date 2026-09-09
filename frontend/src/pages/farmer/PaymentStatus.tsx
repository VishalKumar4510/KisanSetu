import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { paymentAPI } from '../../services/api';
import { ArrowLeft, CreditCard, IndianRupee, TrendingDown, Clock, CheckCircle, AlertCircle, Banknote } from 'lucide-react';

interface PaymentData {
  id: string;
  procurementId: string;
  farmerId: string;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  dbtReferenceId?: string;
  processedAt?: string;
  createdAt: string;
  produceSummary?: {
    type: string;
    quantity: number;
    unit: string;
    grade?: string;
    mspRate: number;
    netWeight?: number;
  };
}

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType; labelEn: string; labelHi: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, labelEn: 'Pending', labelHi: 'लंबित' },
  PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CreditCard, labelEn: 'Processing', labelHi: 'प्रक्रिया में' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, labelEn: 'Completed', labelHi: 'पूर्ण' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle, labelEn: 'Failed', labelHi: 'विफल' },
};

export default function PaymentStatus() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayment();
  }, []);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const res = await paymentAPI.getCurrent(user?.farmerId);
      setPayment(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || (language === 'hi' ? 'भुगतान डेटा लोड करने में त्रुटि' : 'Failed to load payment data'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
      });
    } catch {
      return dateStr;
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

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-600 text-white px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg">{t('paymentStatus')}</h1>
          </div>
        </div>
        <div className="flex items-center justify-center px-4 mt-20">
          <div className="text-center">
            <Banknote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{language === 'hi' ? 'कोई भुगतान नहीं' : 'No Payment Yet'}</p>
            <p className="text-gray-400 text-sm mt-2">
              {language === 'hi' ? 'खरीद पूर्ण होने पर भुगतान यहां दिखेगा' : 'Payment details will appear after procurement'}
            </p>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  const status = statusConfig[payment.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">{t('paymentStatus')}</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Net Amount - Highlighted */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">{t('netAmount')}</p>
          <p className="text-4xl font-black text-green-700">{formatCurrency(payment.netAmount)}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {language === 'hi' ? status.labelHi : status.labelEn}
            </span>
          </div>
        </div>

        {/* Produce Summary */}
        {payment.produceSummary && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              {language === 'hi' ? 'उपज विवरण' : 'Produce Summary'}
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{t('produceType')}</span>
                <span className="font-semibold text-gray-800">{payment.produceSummary.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{t('quantity')}</span>
                <span className="font-semibold text-gray-800">
                  {payment.produceSummary.quantity} {payment.produceSummary.unit}
                </span>
              </div>
              {payment.produceSummary.netWeight && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{language === 'hi' ? 'शुद्ध वज़न' : 'Net Weight'}</span>
                  <span className="font-semibold text-gray-800">{payment.produceSummary.netWeight} kg</span>
                </div>
              )}
              {payment.produceSummary.grade && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t('grade')}</span>
                  <span className={`font-semibold ${
                    payment.produceSummary.grade === 'A' ? 'text-green-600' :
                    payment.produceSummary.grade === 'B' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {t('grade')} {payment.produceSummary.grade}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{t('mspRate')}</span>
                <span className="font-semibold text-gray-800">₹{payment.produceSummary.mspRate}/{language === 'hi' ? 'क्विंटल' : 'qt'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Amount Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">
            {language === 'hi' ? 'राशि विवरण' : 'Amount Breakdown'}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{t('grossAmount')}</span>
              </div>
              <span className="font-semibold text-gray-800">{formatCurrency(payment.grossAmount)}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm text-gray-600">{t('deductions')}</span>
              </div>
              <span className="font-semibold text-red-600">- {formatCurrency(payment.deductions)}</span>
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-800">{t('netAmount')}</span>
              <span className="text-xl font-black text-green-700">{formatCurrency(payment.netAmount)}</span>
            </div>
          </div>
        </div>

        {/* DBT Reference */}
        {payment.dbtReferenceId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">{t('dbtReference')}</span>
            </div>
            <p className="text-sm text-blue-700 font-mono ml-6">{payment.dbtReferenceId}</p>
          </div>
        )}

        {/* Payment Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">
            {language === 'hi' ? 'भुगतान समयरेखा' : 'Payment Timeline'}
          </h3>
          <div className="space-y-0">
            {[
              { labelEn: 'Payment Created', labelHi: 'भुगतान बनाया', time: payment.createdAt, done: true },
              { labelEn: 'Processing Started', labelHi: 'प्रक्रिया शुरू', time: payment.status !== 'PENDING' ? payment.processedAt || payment.createdAt : null, done: payment.status !== 'PENDING' },
              { labelEn: 'Payment Completed', labelHi: 'भुगतान पूर्ण', time: payment.status === 'COMPLETED' ? payment.processedAt : null, done: payment.status === 'COMPLETED' },
            ].map((step, idx, arr) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    step.done ? 'bg-green-500' : 'bg-gray-200'
                  }`}>
                    {step.done ? (
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    )}
                  </div>
                  {idx < arr.length - 1 && (
                    <div className={`w-0.5 h-6 ${step.done ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-medium ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>
                    {language === 'hi' ? step.labelHi : step.labelEn}
                  </p>
                  {step.time && (
                    <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(step.time)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
