import { getCategoryTheme } from '../utils/category';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onNavigate: (step: number) => void;
  propertyType?: string;
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  onNavigate,
  propertyType = '',
}: StepIndicatorProps) {
  const theme = getCategoryTheme(propertyType);
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-2">
        <span className="eyebrow text-ink-soft">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="meta font-mono tabular-nums font-semibold" style={{ color: theme.accent }}>
          {percent}%
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
              className="flex-1 h-1.5 rounded-full transition-all cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: isCompleted
                  ? `color-mix(in srgb, ${theme.accent} 60%, transparent)`
                  : isCurrent
                  ? theme.accent
                  : 'var(--color-line)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
