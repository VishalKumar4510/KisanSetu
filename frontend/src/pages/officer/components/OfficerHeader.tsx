import React from 'react';
import {
  Sprout,
  Building,
  Pause,
  Play,
  Bell,
  AlertCircle,
  X,
  LogOut,
  RefreshCw,
} from 'lucide-react';

export interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

import { Centre, User } from '@shared/types';

interface OfficerHeaderProps {
  centres: Centre[];
  selectedCentre: string;
  setSelectedCentre: (id: string) => void;
  isQueuePaused: boolean;
  onPauseQueue: () => void;
  onResumeQueue: () => void;
  currentTimeStr: string;
  alerts: AlertItem[];
  unreadAlertsCount: number;
  showAlertsDropdown: boolean;
  setShowAlertsDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  onMarkAlertRead: (id: string) => void;
  user: User | null;
  refreshing: boolean;
  onRefresh: () => void;
  logout: () => void;
}

export const OfficerHeader: React.FC<OfficerHeaderProps> = ({
  centres,
  selectedCentre,
  setSelectedCentre,
  isQueuePaused,
  onPauseQueue,
  onResumeQueue,
  currentTimeStr,
  alerts,
  unreadAlertsCount,
  showAlertsDropdown,
  setShowAlertsDropdown,
  onMarkAlertRead,
  user,
  refreshing,
  onRefresh,
  logout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 px-6 py-3 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Mandi Hub */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center text-white shadow-xs">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight m-0 inline">KisanSetu</span>
              <h1 className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 m-0 inline">
                Officer Operations Console
              </h1>
              {isQueuePaused && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1 animate-pulse">
                  <Pause className="w-2.5 h-2.5 text-amber-600" /> Queue Paused
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Procurement & Demo Payment Workflow • <span className="font-mono text-slate-700">{currentTimeStr}</span>
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 text-xs">
          {/* Centre Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80 text-slate-700 transition-colors">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedCentre}
              onChange={(e) => setSelectedCentre(e.target.value)}
              className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.district})
                </option>
              ))}
            </select>
          </div>

          {/* Queue Pause / Resume */}
          {isQueuePaused ? (
            <button
              onClick={onResumeQueue}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Play className="w-3 h-3" /> Resume Queue
            </button>
          ) : (
            <button
              onClick={onPauseQueue}
              className="px-3 py-1.5 bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-semibold rounded-lg border border-amber-300 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Pause className="w-3 h-3 text-amber-700" /> Pause Queue
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDropdown((prev) => !prev)}
              className="relative p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors"
              title="Operational Alerts"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Drawer */}
            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200/90 z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Mandi Alerts ({unreadAlertsCount} Unread)
                  </span>
                  <button onClick={() => setShowAlertsDropdown(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-400 p-4 text-center">No alerts at this moment</p>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 text-xs transition-colors flex items-start gap-2.5 ${
                          alert.read ? 'bg-white text-slate-600' : 'bg-amber-50/50 font-medium text-slate-800'
                        }`}
                      >
                        <span
                          className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                              : alert.severity === 'WARNING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-xs">{alert.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5 leading-snug">{alert.message}</p>
                          <span className="text-xs text-slate-400 mt-1 block">
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!alert.read && (
                          <button
                            type="button"
                            onClick={() => onMarkAlertRead(alert.id)}
                            className="px-2.5 py-1 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-md shrink-0 font-semibold transition-colors min-h-[28px]"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Officer Profile */}
          <div className="hidden sm:flex flex-col justify-center border-l border-slate-200 pl-3 text-right">
            <p className="font-bold text-slate-800 text-xs leading-tight">{user?.name || 'Officer Verma'}</p>
            <p className="text-xs text-slate-500 font-mono leading-tight">ID: {user?.id?.slice(0, 8) || 'OFF-001'}</p>
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors disabled:opacity-50"
            title="Refresh console state"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200/80 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
