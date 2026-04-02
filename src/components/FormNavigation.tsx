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
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border-2 border-primary text-primary rounded-xl px-6 py-4 text-base font-semibold min-h-[52px] hover:bg-secondary transition-colors"
        >
          Back
        </button>
      )}
      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-primary text-white rounded-xl px-6 py-4 text-base font-semibold min-h-[52px] hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Registration'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="flex-1 bg-primary text-white rounded-xl px-6 py-4 text-base font-semibold min-h-[52px] hover:bg-primary-dark transition-colors"
        >
          Next
        </button>
      )}
    </div>
  );
}
