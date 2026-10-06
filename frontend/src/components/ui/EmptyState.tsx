import React from 'react';
import { Route, ArrowUpRight } from 'lucide-react';

interface EmptyStateProps {
  onCreateTrip: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateTrip }) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center shadow-xs max-w-2xl mx-auto my-8">
      <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200/60 text-slate-700 flex items-center justify-center mx-auto mb-4">
        <Route className="w-7 h-7 stroke-[1.8] text-blue-600" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 m-0">
        Plan your next trip
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
        Enter your current location, pickup, and dropoff to generate an HOS-compliant route and official 24-hour driver daily logs.
      </p>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onCreateTrip}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition"
        >
          <span>Configure Trip Details</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
