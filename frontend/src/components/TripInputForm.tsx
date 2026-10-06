import { ArrowRight } from 'lucide-react';
import type { TripPlanRequest } from '../types/trip';

interface TripInputFormProps {
  formData: TripPlanRequest;
  onChange: (field: keyof TripPlanRequest, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onSelectPreset: (preset: { current: string; pickup: string; dropoff: string; cycle: number }) => void;
}

export const TripInputForm: React.FC<TripInputFormProps> = ({
  formData,
  onChange,
  onSubmit,
  isLoading,
  onSelectPreset,
}) => {
  const presets = [
    {
      name: 'Northeast to Midwest',
      route: 'NYC → Philly → Chicago (855 mi)',
      current: 'New York, NY',
      pickup: 'Philadelphia, PA',
      dropoff: 'Chicago, IL',
      cycle: 30,
    },
    {
      name: 'Southwest Long Haul',
      route: 'LA → Phoenix → Dallas (1,440 mi, Fuel stop)',
      current: 'Los Angeles, CA',
      pickup: 'Phoenix, AZ',
      dropoff: 'Dallas, TX',
      cycle: 15,
    },
    {
      name: 'Regional Short Haul',
      route: 'Seattle → Tacoma → Portland (180 mi)',
      current: 'Seattle, WA',
      pickup: 'Tacoma, WA',
      dropoff: 'Portland, OR',
      cycle: 40,
    },
    {
      name: 'Cycle Warning Test',
      route: 'Miami → Atlanta → Nashville (62h cycle used)',
      current: 'Miami, FL',
      pickup: 'Atlanta, GA',
      dropoff: 'Nashville, TN',
      cycle: 62,
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white m-0">Trip Configuration</h2>
          <p className="text-xs text-slate-400 mt-0.5">Enter origin, stop locations, and current cycle hours.</p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Current Location */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Current Location
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.current_location}
                onChange={(e) => onChange('current_location', e.target.value)}
                placeholder="e.g. New York, NY"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Starting point of trip</p>
          </div>

          {/* Pickup Location */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Pickup Location
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.pickup_location}
                onChange={(e) => onChange('pickup_location', e.target.value)}
                placeholder="e.g. Philadelphia, PA"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">1 hour on-duty pickup time</p>
          </div>

          {/* Dropoff Location */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Dropoff Location
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.dropoff_location}
                onChange={(e) => onChange('dropoff_location', e.target.value)}
                placeholder="e.g. Chicago, IL"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">1 hour on-duty dropoff time</p>
          </div>

          {/* Current Cycle Used */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Current Cycle Used (Hours)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max="70"
                required
                value={formData.cycle_used_hours}
                onChange={(e) => onChange('cycle_used_hours', parseFloat(e.target.value) || 0)}
                placeholder="0 - 70"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Hours used towards 70h/8d limit</p>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 shadow-sm"
          >
            {isLoading ? (
              <span>Calculating...</span>
            ) : (
              <>
                <span>Calculate Trip</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
