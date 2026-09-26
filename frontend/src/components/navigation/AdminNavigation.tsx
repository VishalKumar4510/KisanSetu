import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  Building2,
  Sliders,
  CreditCard,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  Sprout,
  Play,
  Square,
  Shield,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { demoAPI } from '@/services/api';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

export function AdminNavigation({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    return localStorage.getItem('kisansetu_admin_sidebar') === 'true';
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [demoState, setDemoState] = React.useState<any>(null);
  const [togglingDemo, setTogglingDemo] = React.useState(false);

  React.useEffect(() => {
    demoAPI.getState().then((res) => setDemoState(res.data.data)).catch(() => {});
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('kisansetu_admin_sidebar', String(next));
      return next;
    });
  };

  const handleToggleDemo = async () => {
    setTogglingDemo(true);
    try {
      if (demoState?.isRunning) {
        await demoAPI.stop();
      } else {
        await demoAPI.start(1);
      }
      const dR = await demoAPI.getState();
      setDemoState(dR.data.data);
    } catch {}
    finally {
      setTogglingDemo(false);
    }
  };

  const sections = [
    {
      heading: 'Command Overview',
      items: [
        {
          title: t('dashboard'),
          description: 'Executive KPIs & activity',
          path: '/admin',
          icon: Activity,
        },
      ],
    },
    {
      heading: 'Infrastructure & Centres',
      items: [
        {
          title: t('centreMonitoring'),
          description: 'Bay utilization & live congestion',
          path: '/admin/centres',
          icon: Building2,
        },
        {
          title: t('slotManagement'),
          description: 'Daily quotas & time slots',
          path: '/admin/slots',
          icon: Sliders,
        },
      ],
    },
    {
      heading: 'Financials & DBT',
      items: [
        {
          title: t('paymentMonitoring'),
          description: 'Direct Benefit Transfers & ledger',
          path: '/admin/payments',
          icon: CreditCard,
        },
      ],
    },
    {
      heading: 'Intelligence & Audit',
      items: [
        {
          title: t('analytics'),
          description: 'Throughput charts & wait times',
          path: '/admin/analytics',
          icon: BarChart3,
        },
        {
          title: t('reports'),
          description: 'Impact metrics & exports',
          path: '/admin/reports',
          icon: FileText,
        },
      ],
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] text-[#17201A] flex flex-col md:flex-row">
      {/* Mobile Top Header (< md) */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 h-16 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <IconButton
            aria-label="Open admin menu"
            variant="ghost"
            size="sm"
            onClick={() => setMobileDrawerOpen(true)}
          >
            <Menu className="w-5 h-5 text-[#17201A]" />
          </IconButton>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-[#17201A]">KisanSetu</span>
            <Badge variant="deep" size="sm">Admin</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Demo Button Mobile */}
          <button
            type="button"
            onClick={handleToggleDemo}
            disabled={togglingDemo}
            className={cn(
              'px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all',
              demoState?.isRunning
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            )}
          >
            {demoState?.isRunning ? (
              <>
                <Square className="w-3 h-3" /> Stop
              </>
            ) : (
              <>
                <Play className="w-3 h-3" /> Demo
              </>
            )}
          </button>

          <IconButton
            aria-label="Logout"
            variant="ghost"
            size="sm"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 text-[#64748B]" />
          </IconButton>
        </div>
      </header>

      {/* Desktop Command Centre Sidebar (Collapsible with 21st.dev Dashboard Sidebar styling) */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-white/95 backdrop-blur-sm border-r border-slate-200/90 shrink-0 sticky top-0 h-screen transition-all duration-300 z-30 select-none shadow-2xs',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
          {!collapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base text-[#17201A] tracking-tight truncate">
                    KisanSetu
                  </span>
                  <Badge variant="deep" size="sm">
                    Admin
                  </Badge>
                </div>
                <p className="text-[11px] text-[#64748B] font-medium truncate">
                  Command Centre
                </p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
          )}

          <IconButton
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn('shrink-0', collapsed && 'hidden')}
          >
            <ChevronLeft className="w-4 h-4 text-[#64748B]" />
          </IconButton>
        </div>

        {/* Collapsed Expand Toggle */}
        {collapsed && (
          <div className="py-2 text-center border-b border-slate-100">
            <IconButton
              aria-label="Expand sidebar"
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              title="Expand sidebar"
              className="mx-auto"
            >
              <ChevronRight className="w-4 h-4 text-[#64748B]" />
            </IconButton>
          </div>
        )}

        {/* Simulation Demo Pill in Sidebar */}
        <div className="px-3 pt-3">
          {!collapsed ? (
            <button
              type="button"
              onClick={handleToggleDemo}
              disabled={togglingDemo}
              className={cn(
                'w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all duration-200 active:scale-[0.98]',
                demoState?.isRunning
                  ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  : 'bg-[#F0FDF4] text-[#15803D] border-green-200 hover:bg-green-100'
              )}
            >
              <span className="flex items-center gap-1.5">
                <Zap className={cn('w-4 h-4', demoState?.isRunning ? 'text-red-600 animate-pulse' : 'text-green-600')} />
                {demoState?.isRunning ? 'Demo Active' : 'Start Live Demo'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/80 px-1.5 py-0.5 rounded-md">
                {demoState?.isRunning ? 'Stop' : 'Run'}
              </span>
            </button>
          ) : (
            <IconButton
              aria-label={demoState?.isRunning ? 'Stop Demo' : 'Start Demo'}
              variant={demoState?.isRunning ? 'danger' : 'soft'}
              size="sm"
              onClick={handleToggleDemo}
              title={demoState?.isRunning ? 'Stop Demo' : 'Start Demo'}
              className="mx-auto"
            >
              {demoState?.isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </IconButton>
          )}
        </div>

        {/* Categorized Navigation Sections */}
        <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto scrollbar-none">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 block">
                  {section.heading}
                </span>
              )}

              {section.items.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <div key={item.path} className="relative group">
                    <button
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={cn(
                        'relative w-full flex items-center gap-3 rounded-xl transition-all duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40',
                        collapsed ? 'p-3 justify-center' : 'px-3 py-2.5',
                        isActive
                          ? 'bg-[#F0FDF4] text-[#14532D] font-bold shadow-2xs border border-emerald-200/90 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-[#16A34A]'
                          : 'text-[#64748B] hover:text-[#17201A] hover:bg-slate-100/70'
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon
                        className={cn(
                          'w-5 h-5 shrink-0 transition-colors',
                          isActive ? 'text-[#16A34A] stroke-[2.5]' : 'text-slate-400 group-hover:text-slate-700'
                        )}
                      />

                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate leading-tight">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      )}
                    </button>

                    {/* Tooltip for Collapsed Sidebar */}
                    {collapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#17201A] text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                        {item.title}
                        <span className="text-[10px] text-gray-300 block font-normal">
                          {item.description}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Admin Footer Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#17201A] truncate">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    District Command Live
                  </p>
                </div>
              </div>
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
          ) : (
            <div className="flex justify-center">
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
          )}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-x-hidden min-h-screen">
        {children}
      </main>

      {/* Responsive Mobile Drawer (< md) */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        position="left"
        size="sm"
        ariaLabel="Admin Navigation Drawer"
      >
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <DrawerTitle>Admin Command Centre</DrawerTitle>
              <DrawerDescription>KisanSetu Platform Governance</DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-4">
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-2 block">
                  {section.heading}
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
                          'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                          isActive
                            ? 'bg-[#F0FDF4] text-[#15803D] font-bold border border-green-200/80'
                            : 'text-[#17201A] hover:bg-gray-100'
                        )}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="text-xs text-[#64748B]">{item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button
            variant="danger"
            size="md"
            onClick={logout}
            leftIcon={<LogOut className="w-4 h-4" />}
            className="w-full justify-center"
          >
            Logout
          </Button>
        </DrawerFooter>
      </Drawer>
    </div>
  );
}

export default AdminNavigation;
