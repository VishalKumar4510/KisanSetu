import React from 'react';
import { NavLink } from 'react-router-dom';
import { Layers, LayoutDashboard, Users, Scale, History } from 'lucide-react';

export const OperationsNav: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 ${
      isActive
        ? 'bg-slate-900 text-white shadow-xs'
        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
    }`;

  return (
    <section className="max-w-7xl mx-auto px-6 pt-4" aria-label="Officer Module Navigation">
      <div className="bg-white rounded-xl border border-slate-200/70 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Officer Console Modules" className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Officer Operations:
          </span>
          <NavLink
            to="/officer"
            end
            className={navLinkClass}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </NavLink>
          <NavLink
            to="/officer/queue"
            className={navLinkClass}
          >
            <Users className="w-3.5 h-3.5" />
            Queue Management
          </NavLink>
          <NavLink
            to="/officer/procurement"
            className={navLinkClass}
          >
            <Scale className="w-3.5 h-3.5" />
            Procurement
          </NavLink>
          <NavLink
            to="/officer/farmers"
            className={navLinkClass}
          >
            <History className="w-3.5 h-3.5" />
            Farmer Directory
          </NavLink>
        </nav>

        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700">Console Online</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-mono text-slate-600 text-xs">Demo Payment Workflow Active</span>
        </div>
      </div>
    </section>
  );
};
