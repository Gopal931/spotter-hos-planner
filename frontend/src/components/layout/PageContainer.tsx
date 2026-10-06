import React from 'react';
import { ChevronRight } from 'lucide-react';

interface PageContainerProps {
  children: React.ReactNode;
  activeView: 'planner' | 'logs';
  onNavigate: (view: 'planner' | 'logs') => void;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  activeView,
  onNavigate,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Breadcrumb & Hero Header */}
      <div className="no-print">
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-slate-500 mb-2">
          <button 
            type="button" 
            onClick={() => onNavigate('planner')}
            className="hover:text-slate-900 transition font-medium"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900 capitalize">
            {activeView === 'planner' ? 'Trip Planner' : 'Daily Driver Logs'}
          </span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 m-0">
          Plan a safer, compliant trip.
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Build an interstate highway route, calculate FMCSA Hours of Service limits, and generate official 24-hour driver logs in seconds.
        </p>
      </div>

      {children}
    </div>
  );
};
