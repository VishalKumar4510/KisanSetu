import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Scale,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  Building,
  Sprout,
  ShieldCheck,
  Activity,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

export function OfficerNavigation({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    return localStorage.getItem('kisansetu_officer_sidebar') === 'true';
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('kisansetu_officer_sidebar', String(next));
      return next;
    });
  };

  const navItems = [
    {
      title: 'Workbench',
      shortTitle: 'Desk',
      description: 'Active Lot & Stepper',
      path: '/officer',
      icon: LayoutDashboard,
      badge: 'Active',
    },
    {
      title: 'Live Queue Desk',
      shortTitle: 'Queue',
      description: 'Waiting line & calling',
      path: '/officer/queue',
      icon: Users,
    },
    {
      title: 'Procurement Lots',
      shortTitle: 'Lots',
      description: 'Weighment & quality checks',
      path: '/officer/procurement',
      icon: Scale,
    },
    {
      title: 'Farmer Directory',
      shortTitle: 'Farmers',
      description: 'Land records & history',
      path: '/officer/farmers',
      icon: UserCheck,
    },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] text-[#17201A] flex flex-col md:flex-row">
      {/* Mobile Top Header (Visible on < md) */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 h-15 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <IconButton
            aria-label="Open officer menu"
            variant="ghost"
            size="sm"
            onClick={() => setMobileDrawerOpen(true)}
          >
            <Menu className="w-5 h-5 text-[#17201A]" />
          </IconButton>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#14532D] text-white flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-[#17201A]">KisanSetu</span>
            <Badge variant="primary" size="sm">Officer</Badge>
          </div>
        </div>

        <IconButton
          aria-label="Logout"
          variant="ghost"
          size="sm"
          onClick={logout}
          title="Logout"
        >
          <LogOut className="w-4 h-4 text-[#64748B]" />
        </IconButton>
      </header>

      {/* Desktop Sidebar (Collapsible with 21st.dev Dashboard Sidebar styling) */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-white/95 backdrop-blur-sm border-r border-slate-200/90 shrink-0 sticky top-0 h-screen transition-all duration-300 z-30 select-none shadow-2xs',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Brand / Center Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
          {!collapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#14532D] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sprout className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base text-[#17201A] tracking-tight truncate">
                    KisanSetu
                  </span>
                  <Badge variant="primary" size="sm">
                    Ops
                  </Badge>
                </div>
                <p className="text-[11px] text-[#64748B] font-medium truncate">
                  Officer Workbench
                </p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-[#16A34A] to-[#14532D] text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
          )}

          {/* Collapse/Expand Toggle Button */}
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

        {/* Collapsed expand toggle button */}
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

        {/* Navigation Section */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto scrollbar-none">
          {!collapsed && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Operations Menu
            </span>
          )}

          {navItems.map((item) => {
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold truncate">
                          {item.title}
                        </span>
                        {item.badge && isActive && (
                          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  )}
                </button>

                {/* Accessible Tooltip for Collapsed Sidebar */}
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

        {/* Officer Footer Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#17201A] truncate">
                    {user?.name || 'Officer'}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    APMC Console Active
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden min-h-screen">
        {children}
      </main>

      {/* Responsive Mobile Drawer (< md) */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        position="left"
        size="sm"
        ariaLabel="Officer Navigation Drawer"
      >
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#14532D] text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <DrawerTitle>Officer Console</DrawerTitle>
              <DrawerDescription>KisanSetu Mandi Operations</DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-2">
            {navItems.map((item) => {
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

export default OfficerNavigation;
