import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Scale, Banknote, HelpCircle, FileText, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function PublicFooter() {
  const { language } = useLanguage();

  return (
    <footer className="bg-[#14532D] text-white pt-16 pb-12 border-t border-green-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-green-800/80">
          {/* Col 1 & 2: Brand & Purpose */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-green-300">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-white">KisanSetu</span>
                <span className="block text-xs text-green-200 font-medium">
                  {language === 'en' ? 'Smart Mandi Procurement Platform' : 'स्मार्ट मंडी खरीद मंच'}
                </span>
              </div>
            </Link>
            <p className="text-sm text-green-100/85 leading-relaxed max-w-sm">
              {language === 'en'
                ? 'Digitizing the entire mandi procurement lifecycle: from capacity-aware slot reservation and live token queuing to digital weighbridge integration, Agmarknet quality inspection, and transparent Direct Benefit Transfer (DBT).'
                : 'मंडी खरीद जीवनचक्र का संपूर्ण डिजिटलीकरण: क्षमता-आधारित स्लॉट बुकिंग, लाइव टोकन कतार, डिजिटल वे-ब्रिज, एग्मार्कनेट गुणवत्ता परीक्षण और पारदर्शी डीबीटी भुगतान।'}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-green-200">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                Agmarknet Aligned
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-green-200">
                <Banknote className="w-3.5 h-3.5 text-green-400" />
                PFMS / DBT Integrated
              </div>
            </div>
          </div>

          {/* Col 3: Public Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-green-300">
              {language === 'en' ? 'Explore Platform' : 'मंच अन्वेषण'}
            </h3>
            <ul className="space-y-2.5 text-sm text-green-100">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  {language === 'en' ? 'Home' : 'होम'}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  {language === 'en' ? 'How It Works' : 'कार्य प्रणाली'}
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-white transition-colors">
                  {language === 'en' ? 'Platform Features' : 'सुविधाएं'}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  {language === 'en' ? 'About Platform' : 'परिचय'}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  {language === 'en' ? 'Frequently Asked Questions' : 'सामान्य प्रश्न'}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  {language === 'en' ? 'Support & Helpdesk' : 'सहायता केंद्र'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Portals */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-green-300">
              {language === 'en' ? 'Portal Access' : 'पोर्टल पहुंच'}
            </h3>
            <ul className="space-y-2.5 text-sm text-green-100">
              <li>
                <Link to="/login" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{language === 'en' ? 'Farmer Sign In' : 'किसान लॉगिन'}</span>
                  <ArrowRight className="w-3 h-3 text-green-400" />
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{language === 'en' ? 'Farmer Registration' : 'किसान पंजीकरण'}</span>
                  <ArrowRight className="w-3 h-3 text-green-400" />
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{language === 'en' ? 'Mandi Officer Console' : 'मंडी अधिकारी कंसोल'}</span>
                  <ArrowRight className="w-3 h-3 text-green-400" />
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{language === 'en' ? 'State Administrator Portal' : 'राज्य व्यवस्थापक पोर्टल'}</span>
                  <ArrowRight className="w-3 h-3 text-green-400" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Helpdesk & Grievance */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-green-300">
              {language === 'en' ? 'Mandi Assistance' : 'मंडी सहायता'}
            </h3>
            <p className="text-xs text-green-200/90 leading-relaxed">
              {language === 'en'
                ? 'Assistance desks operate during standard APMC mandi hours (08:00 AM – 06:00 PM IST).'
                : 'मंडी सहायता केंद्र प्रातः 08:00 से सायं 06:00 बजे तक कार्यरत हैं।'}
            </p>
            <div className="pt-1">
              <span className="block text-xs text-green-300 font-semibold uppercase">Toll-Free Helpline</span>
              <span className="text-base font-bold text-white tracking-wide">1800-180-1551</span>
            </div>
            <div>
              <span className="block text-xs text-green-300 font-semibold uppercase">Email Support</span>
              <span className="text-xs text-green-100 font-mono">support@kisansetu.gov.in</span>
            </div>
          </div>
        </div>

        {/* Bottom Metadata & Legal Citation */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-green-200/80">
          <div>
            <p>© {new Date().getFullYear()} KisanSetu — Smart Agricultural Mandi Procurement Platform.</p>
            <p className="text-green-300/70 mt-0.5">
              Developed for Smart India Hackathon (SIH) 2026. Built with PostgreSQL, Express, React, and TypeScript.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-green-200">
            <Link to="/about" className="hover:text-white transition-colors">
              Operational Architecture
            </Link>
            <span className="text-green-500">•</span>
            <Link to="/faq" className="hover:text-white transition-colors">
              Procurement Guidelines
            </Link>
            <span className="text-green-500">•</span>
            <Link to="/contact" className="hover:text-white transition-colors">
              Grievance Redressal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
