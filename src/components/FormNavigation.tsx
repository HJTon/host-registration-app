import { Btn } from './ui';

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function FormNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
}: FormNavigationProps) {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex gap-3 mt-8">
      {currentStep > 1 && (
        <Btn variant="ghost" size="lg" fullWidth onClick={onBack} type="button">
          Back
        </Btn>
      )}
      {isLastStep ? (
        <Btn
          variant="primary"
          size="lg"
          fullWidth
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting…' : 'Submit registration'}
        </Btn>
      ) : (
        <Btn variant="primary" size="lg" fullWidth type="button" onClick={onNext}>
          Continue
        </Btn>
      )}
    </div>
  );
}
