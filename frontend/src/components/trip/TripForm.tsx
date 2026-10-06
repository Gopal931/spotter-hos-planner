import { Navigation, ArrowRight, Loader2, Sparkles, Building2, Warehouse, Clock } from 'lucide-react';
import type { TripPlanRequest } from '../../types/trip';

interface TripFormProps {
  formData: TripPlanRequest;
  onChange: (field: keyof TripPlanRequest, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onSelectPreset: (preset: { current: string; pickup: string; dropoff: string; cycle: number }) => void;
  onReset?: () => void;
}

export const TripForm: React.FC<TripFormProps> = ({
  formData,
  onChange,
  onSubmit,
  isLoading,
  onSelectPreset,
  onReset,
}) => {
  const presets = [
    {
      label: 'Northeast Corridor',
      desc: 'NYC → Philadelphia → Chicago',
      current: 'New York, NY',
      pickup: 'Philadelphia, PA',
      dropoff: 'Chicago, IL',
      cycle: 30,
    },
    {
      label: 'Long Haul Interstate',
      desc: 'LA → Phoenix → Dallas',
      current: 'Los Angeles, CA',
      pickup: 'Phoenix, AZ',
      dropoff: 'Dallas, TX',
      cycle: 15,
    },
    {
      label: 'Pacific Northwest',
      desc: 'Seattle → Tacoma → Portland',
      current: 'Seattle, WA',
      pickup: 'Tacoma, WA',
      dropoff: 'Portland, OR',
      cycle: 40,
    },
    {
      label: 'High Cycle Hours',
      desc: 'Miami → Atlanta → Nashville (62h used)',
      current: 'Miami, FL',
      pickup: 'Atlanta, GA',
      dropoff: 'Nashville, TN',
      cycle: 62,
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
      {/* Header & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 m-0">
            Trip Details
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter the trip information to generate a compliant driving plan.
          </p>
        </div>

        {/* Quick Route Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Quick Presets:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPreset(p)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 transition cursor-pointer font-medium"
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Location */}
          <div>
            <label 
              htmlFor="current_location"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Current Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Navigation className="w-4 h-4 text-emerald-600" />
              </div>
              <input
                id="current_location"
                type="text"
                required
                value={formData.current_location}
                onChange={(e) => onChange('current_location', e.target.value)}
                placeholder="Search starting city (e.g. New York, NY)"
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Terminal or driver start point
            </p>
          </div>

          {/* Pickup Location */}
          <div>
            <label 
              htmlFor="pickup_location"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Pickup Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <input
                id="pickup_location"
                type="text"
                required
                value={formData.pickup_location}
                onChange={(e) => onChange('pickup_location', e.target.value)}
                placeholder="Search pickup facility (e.g. Philadelphia, PA)"
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Shipper (1 hr on-duty load)
            </p>
          </div>

          {/* Dropoff Location */}
          <div>
            <label 
              htmlFor="dropoff_location"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Dropoff Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Warehouse className="w-4 h-4 text-purple-600" />
              </div>
              <input
                id="dropoff_location"
                type="text"
                required
                value={formData.dropoff_location}
                onChange={(e) => onChange('dropoff_location', e.target.value)}
                placeholder="Search delivery facility (e.g. Chicago, IL)"
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Receiver (1 hr on-duty unload)
            </p>
          </div>

          {/* Current Cycle Used */}
          <div>
            <label 
              htmlFor="cycle_used"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Current Cycle Used (Hours)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <input
                id="cycle_used"
                type="number"
                step="0.5"
                min="0"
                max="70"
                required
                value={formData.cycle_used_hours}
                onChange={(e) => onChange('cycle_used_hours', parseFloat(e.target.value) || 0)}
                placeholder="0 - 70"
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Rolling 70h/8d accumulated duty
            </p>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-2">
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Clear Fields
            </button>
          ) : <div />}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating route & HOS plan...</span>
              </>
            ) : (
              <>
                <span>Generate Trip Plan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
