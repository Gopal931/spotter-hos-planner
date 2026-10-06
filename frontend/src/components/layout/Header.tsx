import React from 'react';
import { Truck, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeView: 'planner' | 'logs';
  onNavigate: (view: 'planner' | 'logs') => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, onNavigate, onOpenHelp }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => onNavigate('planner')}>
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/20">
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight block leading-none">
                Spotter
              </span>
              <span className="text-[11px] font-medium text-slate-500 tracking-normal block leading-none mt-1">
                HOS Planner
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            <button
              type="button"
              onClick={() => onNavigate('planner')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeView === 'planner'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Trip Planner
            </button>
            <button
              type="button"
              onClick={() => onNavigate('logs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeView === 'logs'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Daily Logs
            </button>
          </nav>
        </div>

        {/* Right: Status Indicator & Help */}
        <div className="flex items-center space-x-3.5">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-700 text-[11px]">System Ready</span>
          </div>

          <button
            type="button"
            onClick={onOpenHelp}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
            title="FMCSA Part 395 Regulations Reference"
            aria-label="Documentation"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
