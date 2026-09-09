import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { farmerAPI } from '../../services/api';
import { ArrowLeft, Wheat, Info, CheckCircle } from 'lucide-react';

const PRODUCE_TYPES = ['WHEAT', 'PADDY', 'ONION', 'MAIZE', 'PULSES'] as const;
const UNITS = ['quintal', 'kg', 'ton'] as const;

const MSP_RATES: Record<string, number> = {
  WHEAT: 2275,
  PADDY: 2203,
  MAIZE: 2090,
  PULSES: 6600,
  ONION: 1500,
};

const PRODUCE_LABELS_HI: Record<string, string> = {
  WHEAT: 'गेहूं',
  PADDY: 'धान',
  ONION: 'प्याज',
  MAIZE: 'मक्का',
  PULSES: 'दालें',
};

const UNIT_LABELS_HI: Record<string, string> = {
  quintal: 'क्विंटल',
  kg: 'किलो',
  ton: 'टन',
};

export default function ProduceRegistration() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [produceType, setProduceType] = useState<string>('WHEAT');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('quintal');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mspRate = MSP_RATES[produceType] || 0;

  const getProduceLabel = (type: string) => {
    if (language === 'hi') return PRODUCE_LABELS_HI[type] || type;
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  const getUnitLabel = (u: string) => {
    if (language === 'hi') return UNIT_LABELS_HI[u] || u;
    return u;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) {
      setError(language === 'hi' ? 'कृपया मात्रा दर्ज करें' : 'Please enter a valid quantity');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await farmerAPI.registerProduce({
        type: produceType,
        quantity: parseFloat(quantity),
        unit,
        mspRate,
      });
      setSuccess(true);
      setTimeout(() => navigate('/farmer/centres'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || (language === 'hi' ? 'उपज दर्ज करने में त्रुटि' : 'Failed to register produce'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {language === 'hi' ? 'उपज सफलतापूर्वक दर्ज!' : 'Produce Registered!'}
          </h2>
          <p className="text-gray-500 text-sm mb-2">
            {getProduceLabel(produceType)} — {quantity} {getUnitLabel(unit)}
          </p>
          <p className="text-gray-400 text-xs">
            {language === 'hi' ? 'केंद्र चयन पर ले जा रहे हैं...' : 'Redirecting to centre selection...'}
          </p>
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
            <h1 className="font-bold text-lg">{t('registerProduce')}</h1>
            <p className="text-green-100 text-xs">{language === 'hi' ? 'अपनी फसल की जानकारी दर्ज करें' : 'Enter your crop details'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* MSP Info Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              {t('mspRate')}: ₹{mspRate.toLocaleString('en-IN')}/{language === 'hi' ? 'क्विंटल' : 'quintal'}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              {language === 'hi'
                ? `${getProduceLabel(produceType)} के लिए न्यूनतम समर्थन मूल्य`
                : `Minimum Support Price for ${getProduceLabel(produceType)}`}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
          {/* Produce Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('produceType')}</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {PRODUCE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProduceType(type)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    produceType === type
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Wheat className={`w-5 h-5 ${produceType === type ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium text-center leading-tight">{getProduceLabel(type)}</span>
                  <span className="text-[10px] text-gray-400">₹{MSP_RATES[type]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('quantity')}</label>
            <input
              type="number"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={language === 'hi' ? 'मात्रा दर्ज करें' : 'Enter quantity'}
              min="0"
              step="0.1"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:border-green-500 focus:ring-0 focus:outline-none transition-colors"
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('unit')}</label>
            <div className="flex gap-2">
              {UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    unit === u
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {getUnitLabel(u)}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Value */}
          {quantity && parseFloat(quantity) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-700 font-medium">
                {language === 'hi' ? 'अनुमानित मूल्य' : 'Estimated Value'}
              </p>
              <p className="text-2xl font-bold text-green-800 mt-1">
                ₹{(() => {
                  let qty = parseFloat(quantity);
                  if (unit === 'kg') qty /= 100;
                  else if (unit === 'ton') qty *= 10;
                  return (qty * mspRate).toLocaleString('en-IN', { maximumFractionDigits: 0 });
                })()}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {language === 'hi' ? 'MSP दर पर आधारित' : 'Based on MSP rate'}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !quantity}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting
              ? (language === 'hi' ? 'जमा हो रहा है...' : 'Submitting...')
              : t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
