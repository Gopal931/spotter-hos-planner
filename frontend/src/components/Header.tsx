import React from 'react';
import { Truck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-600/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white m-0">Spotter HOS Trip Planner</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Plan compliant truck trips and generate driver logs.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            FMCSA 70hr / 8-Day Cycle
          </span>
        </div>
      </div>
    </header>
  );
};
