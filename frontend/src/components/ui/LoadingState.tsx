import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    'Validating trip details and locations',
    'Finding route geometry and highway segments',
    'Calculating Hours of Service schedule & rest breaks',
    'Generating 24-hour driver daily logs (RODS)',
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setActiveStep(1), 500);
    const timer2 = setTimeout(() => setActiveStep(2), 1200);
    const timer3 = setTimeout(() => setActiveStep(3), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-8 shadow-xs max-w-lg mx-auto text-center my-6">
      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
        <Loader2 className="w-6 h-6 animate-spin stroke-[2.2]" />
      </div>

      <h3 className="text-base font-bold text-slate-900 m-0">
        Generating HOS Trip Plan
      </h3>
      <p className="text-xs text-slate-500 mt-1 mb-6">
        Calculating compliant highway route, stops, and electronic driver log sheets...
      </p>

      <div className="space-y-3 text-left max-w-xs mx-auto">
        {steps.map((step, idx) => {
          const isDone = activeStep > idx;
          const isCurrent = activeStep === idx;

          return (
            <div key={idx} className="flex items-center space-x-3 text-xs">
              <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center">
                {isDone ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Loader2 className="w-3 h-3 animate-spin stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300" />
                )}
              </div>
              <span
                className={`font-medium ${
                  isDone
                    ? 'text-slate-800'
                    : isCurrent
                    ? 'text-blue-600 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
