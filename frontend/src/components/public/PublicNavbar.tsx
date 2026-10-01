import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, Menu, X, ArrowRight, Globe, Shield, PhoneCall } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage } = useLanguage();

  const navLinks = [
    { name: 'Home', nameHi: 'होम', path: '/' },
    { name: 'How It Works', nameHi: 'कार्य प्रणाली', path: '/how-it-works' },
    { name: 'Features', nameHi: 'सुविधाएं', path: '/features' },
    { name: 'About', nameHi: 'परिचय', path: '/about' },
    { name: 'FAQ', nameHi: 'सामान्य प्रश्न', path: '/faq' },
    { name: 'Contact', nameHi: 'संपर्क', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
      {/* Top GovTech Announcement / Accessibility Strip */}
      <div className="bg-[#14532D] text-white text-xs py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-medium text-green-100">
              {language === 'en'
                ? 'Smart Mandi Queue & Transparent Procurement System'
                : 'स्मार्ट मंडी कतार एवं पारदर्शी खरीद प्रणाली'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-green-200">
            <div className="hidden sm:flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-green-400" />
              <span>Toll-Free Helpline: 1800-180-1551</span>
            </div>
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#17201A]">
                  KisanSetu
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-800 font-semibold tracking-wide">
                  GovTech
                </span>
              </div>
              <p className="text-[11px] leading-none text-[#64748B] font-medium hidden sm:block mt-0.5">
                {language === 'en' ? 'Smart Mandi Procurement Platform' : 'स्मार्ट मंडी खरीद मंच'}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isActive(link.path)
                    ? 'text-[#16A34A] bg-[#F0FDF4] font-semibold'
                    : 'text-[#64748B] hover:text-[#17201A] hover:bg-gray-50'
                }`}
              >
                {language === 'en' ? link.name : link.nameHi}
              </Link>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-[#17201A] hover:bg-gray-50 transition-colors duration-150"
            >
              <Shield className="w-4 h-4 mr-1.5 text-gray-500" />
              {language === 'en' ? 'Sign In' : 'लॉग इन'}
            </Link>
            <Link
              to="/register"
              className="btn-primary text-sm py-2 px-4.5 rounded-xl shadow-xs"
            >
              {language === 'en' ? 'Register as Farmer' : 'किसान पंजीकरण'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to="/login"
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] rounded-lg border border-green-200 sm:hidden"
            >
              {language === 'en' ? 'Sign In' : 'लॉग इन'}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                isActive(link.path)
                  ? 'text-[#16A34A] bg-[#F0FDF4] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {language === 'en' ? link.name : link.nameHi}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-secondary w-full py-2.5 text-center text-sm"
            >
              {language === 'en' ? 'Sign In to Portal' : 'पोर्टल में लॉग इन करें'}
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary w-full py-2.5 text-center text-sm"
            >
              {language === 'en' ? 'Register New Farmer' : 'नया किसान पंजीकरण'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
