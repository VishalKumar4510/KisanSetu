import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sprout, Phone, Lock, User, ArrowRight, Globe, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(language === 'en' ? 'Passwords do not match' : 'पासवर्ड मेल नहीं खाते');
      return;
    }

    if (password.length < 6) {
      setError(language === 'en' ? 'Password must be at least 6 characters' : 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        phone,
        password,
        role: 'FARMER',
        language,
      });
      navigate('/farmer');
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.message ||
        (language === 'en' ? 'Registration failed. Phone number may already be in use.' : 'पंजीकरण विफल रहा। यह फ़ोन नंबर पहले से पंजीकृत हो सकता है।')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-200/20 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />

      {/* Top Bar with Language Toggle & Home link */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between relative z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-green flex items-center justify-center text-white shadow-xs">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">KisanSetu</span>
        </Link>
        <button
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 backdrop-blur-sm shadow-xs border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-white transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-green-600" />
          {language === 'en' ? 'हिन्दी' : 'English'}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 border border-green-200 text-green-700 mb-3 shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {language === 'en' ? 'Farmer Registration' : 'किसान पंजीकरण'}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'en'
                  ? 'Create your digital farmer account for smart mandi access'
                  : 'स्मार्ट मंडी पहुंच हेतु अपना किसान खाता बनाएं'}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs flex items-start gap-2 animate-scaleIn">
                <span className="text-red-500 mt-0.5 font-bold">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="label">
                  {language === 'en' ? 'Full Name' : 'पूरा नाम'}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-11 h-11"
                    placeholder={language === 'en' ? 'e.g. Ramesh Kumar' : 'उदा. रमेश कुमार'}
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  {language === 'en' ? 'Mobile Phone Number' : 'मोबाइल नंबर'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field pl-11 h-11"
                    placeholder={language === 'en' ? '10-digit mobile number' : '10 अंकों का मोबाइल नंबर'}
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  {language === 'en' ? 'Create Password' : 'पासवर्ड बनाएं'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11 h-11"
                    placeholder={language === 'en' ? 'Minimum 6 characters' : 'कम से कम 6 अक्षर'}
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  {language === 'en' ? 'Confirm Password' : 'पासवर्ड की पुष्टि करें'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-11 h-11"
                    placeholder={language === 'en' ? 'Re-enter your password' : 'पासवर्ड पुनः दर्ज करें'}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>
                  {language === 'en'
                    ? 'Registration grants instant access to slot reservations and digital tokens.'
                    : 'पंजीकरण से तत्काल स्लॉट बुकिंग और डिजिटल टोकन की सुविधा मिलती है।'}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-11 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl shadow-xs"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>{language === 'en' ? 'Complete Registration' : 'पंजीकरण पूरा करें'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-gray-500">
              <span>{language === 'en' ? 'Already have an account?' : 'क्या आपके पास पहले से खाता है?'} </span>
              <Link to="/login" className="font-bold text-[#16A34A] hover:underline">
                {language === 'en' ? 'Sign In here' : 'यहाँ लॉगिन करें'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
