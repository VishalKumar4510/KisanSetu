import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Ticket,
  TrendingUp,
  CreditCard,
  Package,
  Calendar,
  Bell,
  User,
  LogOut,
  Globe,
  Menu,
  ChevronRight,
  Sprout,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { FarmerBottomNavBar } from './FarmerBottomNavBar';
import { cn } from '@/lib/utils';

export function FarmerNavigation({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const bottomNavItems = [
    { icon: LayoutDashboard, label: t('home'), path: '/farmer' },
    { icon: Users, label: t('liveQueue'), path: '/farmer/queue' },
    { icon: Ticket, label: t('myToken'), path: '/farmer/token' },
    { icon: TrendingUp, label: t('status'), path: '/farmer/procurement' },
    { icon: Menu, label: 'Menu', action: () => setDrawerOpen(true), isMenu: true },
  ];

  const drawerSections = [
    {
      title: 'Mandi Services',
      items: [
        { icon: LayoutDashboard, label: t('dashboard'), path: '/farmer', desc: 'Overview & alerts' },
        { icon: Calendar, label: t('bookSlot'), path: '/farmer/centres', desc: 'Find centres & reserve slots' },
        { icon: Users, label: t('liveQueue'), path: '/farmer/queue', desc: 'Real-time wait & ETA' },
        { icon: Ticket, label: t('myToken'), path: '/farmer/token', desc: 'QR pass for gate check-in' },
        { icon: TrendingUp, label: t('procurementStatus'), path: '/farmer/procurement', desc: 'Weighment & quality tracking' },
        { icon: CreditCard, label: t('payment'), path: '/farmer/payment', desc: 'Direct Benefit Transfer (DBT)' },
        { icon: Package, label: t('registerProduce'), path: '/farmer/produce', desc: 'Declare harvest & check MSP' },
      ],
    },
    {
      title: 'Personal & Settings',
      items: [
        { icon: User, label: t('profile'), path: '/farmer/profile', desc: 'Land records & bank details' },
        { icon: Bell, label: t('notifications'), path: '/farmer/notifications', desc: 'Procurement & payment alerts' },
      ],
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] text-[#17201A] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/farmer')}
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40 rounded-xl p-1"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#14532D] text-white flex items-center justify-center shadow-xs">
                <Sprout className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#17201A]">
                    {t('appName')}
                  </span>
                  <Badge variant="primary" size="sm">
                    Kisan
                  </Badge>
                </div>
                <p className="text-[11px] text-[#64748B] hidden sm:block">
                  Smart Mandi Procurement
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: t('dashboard'), path: '/farmer' },
              { label: t('bookSlot'), path: '/farmer/centres' },
              { label: t('liveQueue'), path: '/farmer/queue' },
              { label: t('myToken'), path: '/farmer/token' },
              { label: t('procurementStatus'), path: '/farmer/procurement' },
              { label: t('payment'), path: '/farmer/payment' },
            ].map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-[#F0FDF4] text-[#15803D] border border-green-200/80 shadow-2xs'
                      : 'text-[#64748B] hover:text-[#17201A] hover:bg-gray-100'
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              leftIcon={<Globe className="w-4 h-4 text-[#16A34A]" />}
              className="hidden sm:inline-flex py-1.5 px-3 text-xs"
            >
              {language === 'en' ? 'हिन्दी' : 'English'}
            </Button>

            {/* Notifications */}
            <IconButton
              aria-label="View notifications"
              variant="light"
              size="sm"
              onClick={() => navigate('/farmer/notifications')}
              className="relative"
            >
              <Bell className="w-4 h-4 text-[#64748B]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626] ring-2 ring-white animate-pulse" />
            </IconButton>

            {/* Drawer Menu Button */}
            <IconButton
              aria-label="Open mobile menu"
              variant="light"
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5 text-[#17201A]" />
            </IconButton>

            {/* Profile Avatar / Logout (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/farmer/profile')}
                className="flex items-center gap-2 hover:bg-gray-100 p-1.5 rounded-xl transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#F0FDF4] text-[#15803D] font-bold text-xs flex items-center justify-center border border-green-200">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-[#17201A] leading-tight truncate max-w-[100px]">
                    {user?.name || 'Farmer'}
                  </p>
                  <p className="text-[10px] text-[#64748B]">
                    {user?.phone || 'Verified'}
                  </p>
                </div>
              </button>

              <IconButton
                aria-label="Logout"
                variant="ghost"
                size="sm"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-[#64748B] hover:text-[#DC2626]" />
              </IconButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 pb-20 md:pb-6 overflow-x-hidden min-w-0 max-w-full">{children}</main>

      {/* 21st.dev Animated Mobile Bottom Navigation Bar */}
      <FarmerBottomNavBar
        items={bottomNavItems}
        activePath={location.pathname}
        onNavigate={handleNavigate}
      />

      {/* Responsive Mobile Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        position="right"
        size="md"
        ariaLabel="Farmer Navigation Menu"
      >
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] border border-green-200 text-[#15803D] flex items-center justify-center font-bold text-lg shadow-2xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : '👨‍🌾'}
            </div>
            <div className="min-w-0">
              <DrawerTitle>{user?.name || 'KisanSetu Farmer'}</DrawerTitle>
              <DrawerDescription>
                <span className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="primary" size="sm">
                    {user?.farmerId || 'Farmer Pass'}
                  </Badge>
                  <span className="text-[11px] text-[#64748B]">
                    {user?.phone}
                  </span>
                </span>
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-6">
            {drawerSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] px-2 block">
                  {section.title}
                </span>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => handleNavigate(item.path)}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-150 text-left group',
                          isActive
                            ? 'bg-[#F0FDF4] text-[#15803D] border border-green-200/80 shadow-2xs'
                            : 'hover:bg-gray-100 text-[#17201A]'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                              isActive
                                ? 'bg-[#16A34A] text-white shadow-2xs'
                                : 'bg-gray-100 text-[#64748B] group-hover:bg-white group-hover:text-[#17201A]'
                            )}
                          >
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p
                              className={cn(
                                'text-sm font-semibold truncate',
                                isActive ? 'text-[#15803D]' : 'text-[#17201A]'
                              )}
                            >
                              {item.label}
                            </p>
                            <p className="text-[11px] text-[#64748B] truncate">
                              {item.desc}
                            </p>
                          </div>
                        </div>

                        <ChevronRight
                          className={cn(
                            'w-4 h-4 text-gray-400 group-hover:text-[#17201A] transition-transform group-hover:translate-x-0.5',
                            isActive && 'text-[#16A34A]'
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DrawerBody>

        <DrawerFooter>
          <div className="w-full space-y-2">
            {/* Language Toggle in Drawer */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-200 flex items-center justify-between text-xs font-semibold text-[#17201A] hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#16A34A]" />
                Language / भाषा
              </span>
              <Badge variant="outline" size="sm">
                {language === 'en' ? 'English (EN)' : 'हिन्दी (HI)'}
              </Badge>
            </button>

            {/* Logout Button */}
            <Button
              variant="danger"
              size="md"
              onClick={logout}
              leftIcon={<LogOut className="w-4 h-4" />}
              className="w-full justify-center"
            >
              {t('logout')}
            </Button>
          </div>
        </DrawerFooter>
      </Drawer>
    </div>
  );
}

export default FarmerNavigation;
