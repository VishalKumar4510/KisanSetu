import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sprout, Phone, Lock, Users, Shield, UserCheck, ArrowRight, Globe, ArrowLeft } from 'lucide-react';

const demoCredentials = [
  { role: 'Farmer', roleHi: 'किसान', phone: 'farmer1', password: 'farmer1', icon: Users, color: 'from-green-500 to-emerald-600', bg: 'bg-green-50 border-green-200 hover:border-green-400 hover:shadow-green-100' },
  { role: 'Officer', roleHi: 'अधिकारी', phone: 'officer1', password: 'officer1', icon: UserCheck, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:shadow-blue-100' },
  { role: 'Admin', roleHi: 'एडमिन', phone: 'admin1', password: 'admin1', icon: Shield, color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:shadow-purple-100' },
];

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      const user = JSON.parse(localStorage.getItem('kisansetu_user') || '{}');
      if (user.role === 'FARMER') navigate('/farmer');
      else if (user.role === 'OFFICER') navigate('/officer');
      else if (user.role === 'ADMIN') navigate('/admin');
      else navigate('/farmer');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (cred: typeof demoCredentials[0]) => {
    setPhone(cred.phone);
    setPassword(cred.password);
    setError('');
    setLoading(true);
    try {
      await login(cred.phone, cred.password);
      const user = JSON.parse(localStorage.getItem('kisansetu_user') || '{}');
      if (user.role === 'FARMER') navigate('/farmer');
      else if (user.role === 'OFFICER') navigate('/officer');
      else if (user.role === 'ADMIN') navigate('/admin');
      else navigate('/farmer');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-200/20 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />

      {/* Top Bar with Back to Website & Language Toggle */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between relative z-10">
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-xs border border-gray-200 text-xs font-semibold text-gray-700 hover:text-green-700 hover:bg-white transition-all duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Back to Website' : 'मुख्य वेबसाइट'}</span>
        </Link>
        <button
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
        >
          <Globe className="w-4 h-4 text-green-600" />
          {language === 'en' ? 'हिन्दी' : 'English'}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Logo & Branding */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 gradient-green rounded-3xl mb-5 shadow-lg glow-green">
              <Sprout className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{t('appName')}</h1>
            <p className="text-gray-500 mt-2 text-base">{t('tagline')}</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8 animate-slideUp">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{t('login')}</h2>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2 animate-scaleIn">
                <span className="text-red-400 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="label">{t('phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text" value={phone} onChange={e => setPhone(e.target.value)}
                    className="input-field pl-12 h-12"
                    placeholder={language === 'en' ? 'Enter phone or username' : 'फ़ोन या उपयोगकर्ता नाम'} required
                  />
                </div>
              </div>
              <div>
                <label className="label">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="input-field pl-12 h-12"
                    placeholder={language === 'en' ? 'Enter password' : 'पासवर्ड दर्ज करें'} required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-base">
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>{t('login')} <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-gray-500 pt-4 border-t border-gray-100">
              <span>{language === 'en' ? "Don't have an account?" : 'खाता नहीं है?'} </span>
              <Link to="/register" className="font-bold text-[#16A34A] hover:underline">
                {language === 'en' ? 'Register as Farmer' : 'यहाँ पंजीकरण करें'}
              </Link>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-8 animate-slideUp" style={{ animationDelay: '100ms' }}>
            <p className="text-center text-sm text-gray-400 mb-4 uppercase tracking-wider font-medium">
              {language === 'en' ? 'Quick Demo Access' : 'डेमो एक्सेस'}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {demoCredentials.map(cred => (
                <button
                  key={cred.role}
                  type="button"
                  disabled={loading}
                  onClick={() => quickLogin(cred)}
                  className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg disabled:opacity-60 cursor-pointer ${cred.bg}`}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cred.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                    <cred.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {language === 'en' ? cred.role : cred.roleHi}
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">{cred.phone}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center animate-slideUp" style={{ animationDelay: '200ms' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-gray-200/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-gray-400 font-medium">SIH 2026 | Smart India Hackathon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
