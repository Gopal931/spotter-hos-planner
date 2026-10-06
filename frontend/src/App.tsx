import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/layout/Header';
import { PageContainer } from './components/layout/PageContainer';
import { TripForm } from './components/trip/TripForm';
import { TripSummary } from './components/trip/TripSummary';
import { RouteMap } from './components/trip/RouteMap';
import { ComplianceCard } from './components/trip/ComplianceCard';
import { TripTimeline } from './components/trip/TripTimeline';
import { DailyLogs } from './components/logs/DailyLogs';
import { LoadingState } from './components/ui/LoadingState';
import { EmptyState } from './components/ui/EmptyState';
import { planTrip } from './services/api';
import type { TripPlanRequest, TripPlanResponse } from './types/trip';
import { AlertCircle, X, Shield } from 'lucide-react';

export function App() {
  const [formData, setFormData] = useState<TripPlanRequest>({
    current_location: 'New York, NY',
    pickup_location: 'Philadelphia, PA',
    dropoff_location: 'Chicago, IL',
    cycle_used_hours: 30,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tripData, setTripData] = useState<TripPlanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'planner' | 'logs'>('planner');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const logsSectionRef = useRef<HTMLDivElement>(null);
  const plannerSectionRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof TripPlanRequest, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectPreset = (preset: { current: string; pickup: string; dropoff: string; cycle: number }) => {
    const updated: TripPlanRequest = {
      current_location: preset.current,
      pickup_location: preset.pickup,
      dropoff_location: preset.dropoff,
      cycle_used_hours: preset.cycle,
    };
    setFormData(updated);
    executeTripPlan(updated);
  };

  const executeTripPlan = async (data: TripPlanRequest) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await planTrip(data);
      setTripData(response);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while planning the trip.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeTripPlan(formData);
  };

  const handleNavigate = (view: 'planner' | 'logs') => {
    setActiveView(view);
    if (view === 'logs' && logsSectionRef.current) {
      logsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'planner' && plannerSectionRef.current) {
      plannerSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Run initial plan on mount
  useEffect(() => {
    executeTripPlan(formData);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        activeView={activeView}
        onNavigate={handleNavigate}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        <PageContainer activeView={activeView} onNavigate={handleNavigate}>
          {/* Trip Input Section */}
          <div ref={plannerSectionRef} className="no-print">
            <TripForm
              formData={formData}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onSelectPreset={handleSelectPreset}
              onReset={() => {
                setFormData({
                  current_location: '',
                  pickup_location: '',
                  dropoff_location: '',
                  cycle_used_hours: 0,
                });
              }}
            />
          </div>

          {/* Error Message Card */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 shadow-xs no-print">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-900 m-0">
                    Unable to calculate route
                  </h4>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 p-1"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Loading Progress State */}
          {isLoading && (
            <div className="no-print">
              <LoadingState />
            </div>
          )}

          {/* Results Sections */}
          {!isLoading && tripData && (
            <div className="space-y-8">
              {/* Trip Summary (5 KPIs) */}
              <section aria-label="Trip Summary" className="no-print">
                <TripSummary summary={tripData.summary} />
              </section>

              {/* Interactive Route Map */}
              <section aria-label="Route Map" className="no-print">
                <RouteMap route={tripData.route} />
              </section>

              {/* HOS Compliance Status Checklist */}
              <section aria-label="HOS Compliance" className="no-print">
                <ComplianceCard compliance={tripData.compliance} />
              </section>

              {/* Trip Schedule Timeline */}
              <section aria-label="Trip Schedule" className="no-print">
                <TripTimeline schedule={tripData.schedule} />
              </section>

              {/* Daily Driver Logs (ELD 24-Hour Graph Sheet) */}
              <section ref={logsSectionRef} aria-label="Daily Driver Logs">
                <DailyLogs dailyLogs={tripData.daily_logs} />
              </section>
            </div>
          )}

          {/* Empty State when no tripData and not loading */}
          {!isLoading && !tripData && !errorMessage && (
            <div className="no-print">
              <EmptyState onCreateTrip={() => executeTripPlan(formData)} />
            </div>
          )}
        </PageContainer>
      </main>

      {/* FMCSA Regulations Documentation Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 m-0">
                  FMCSA Part 395 Hours of Service Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 max-h-96 overflow-y-auto pr-1 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">11-Hour Driving Limit (§ 395.3(a)(3))</strong>
                Drivers may drive a maximum of 11 hours after 10 consecutive hours off duty.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">14-Hour Driving Window (§ 395.3(a)(2))</strong>
                May not drive beyond the 14th consecutive hour after coming on duty following 10 consecutive hours off duty.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">30-Minute Rest Break (§ 395.3(a)(3)(ii))</strong>
                Mandatory consecutive 30-minute break after 8 cumulative hours of driving without at least a 30-minute interruption.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">70-Hour / 8-Day Limit (§ 395.3(b)(2))</strong>
                May not drive after 70 hours on duty in 8 consecutive days. A 34 consecutive hour restart resets this cycle to zero.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">Assessment Assumptions</strong>
                1 hour on-duty pickup, 1 hour on-duty dropoff, and fuel stop at least once every 1,000 miles (30 min on-duty).
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Production Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">Spotter HOS Planner</span>
            <span>—</span>
            <span>Commercial Truck Route & Hours of Service Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
