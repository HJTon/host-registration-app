interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onNavigate: (step: number) => void;
}

export default function StepIndicator({ currentStep, totalSteps, onNavigate }: StepIndicatorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-secondary">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-primary">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>
      <div className="flex gap-1.5 justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          return (
            <button
              key={step}
              type="button"
              onClick={() => onNavigate(step)}
              aria-label={`Go to step ${step}`}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                isCompleted
                  ? 'bg-primary/60 hover:bg-primary cursor-pointer'
                  : isCurrent
                  ? 'bg-primary'
                  : 'bg-gray-200 hover:bg-gray-300 cursor-pointer'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
