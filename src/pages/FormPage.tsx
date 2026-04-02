import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { FormData, TimeSlotKey, SlotState } from '../types/form';
import { getInitialFormData, isTourType } from '../types/form';
import { saveDraft, loadDraft, clearDraft, generateSubmissionId, saveSubmission, getSubmissionById } from '../utils/storage';
import { validateStep } from '../utils/validation';
import StepIndicator from '../components/StepIndicator';
import FormNavigation from '../components/FormNavigation';
import StepEmail from './steps/StepEmail';
import StepContact from './steps/StepContact';
import StepAddress from './steps/StepAddress';
import StepPropertyType from './steps/StepPropertyType';
import StepPropertyDetails from './steps/StepPropertyDetails';
import StepHours from './steps/StepHours';
import StepFeatures from './steps/StepFeatures';
import StepUnique from './steps/StepUnique';
import StepFacilities from './steps/StepFacilities';
import StepActivities from './steps/StepActivities';
import StepReview from './steps/StepReview';

const TOTAL_STEPS = 11;

function getStepTitles(propertyType: string): string[] {
  const isTour = isTourType(propertyType);
  return [
    'Your email',
    'About you',
    'Your location',
    'Property type',
    'Property details',
    'Features',
    isTour ? 'Dates & Times' : 'Open hours',
    'Your description',
    'Visitor access',
    'Activities',
    'Review & submit',
  ];
}

export type ChangeHandler = <K extends keyof FormData>(field: K, value: FormData[K]) => void;

export default function FormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  // Merge loaded draft over initial data so new fields always have defaults
  const [formData, setFormData] = useState<FormData>(() => {
    if (editId) {
      const saved = getSubmissionById(editId);
      if (saved) return { ...getInitialFormData(), ...saved.formData, photos: [], parkingPhotos: [] };
    }
    const draft = loadDraft();
    if (!draft) return getInitialFormData();
    return { ...getInitialFormData(), ...draft };
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState('');
  const [showSaved, setShowSaved] = useState(false);

  // Debounced draft save with "Saved" indicator
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft(formData);
      setShowSaved(true);
      const hideTimer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(hideTimer);
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  const handleChange: ChangeHandler = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTimeSlotChange = useCallback((key: TimeSlotKey, value: SlotState) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: { ...prev.timeSlots, [key]: value },
    }));
  }, []);

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setErrors({});
    setSubmitError(null);
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (step: number) => {
    setErrors({});
    setSubmitError(null);
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const stepErrors = validateStep(TOTAL_STEPS, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitProgress(5);
    setSubmitStatus('Preparing your submission…');
    try {
      const photoUrls: string[] = [];
      const parkingPhotoUrls: string[] = [];
      const allUploads = [
        ...formData.photos.map(f => ({ file: f, isParkingPhoto: false })),
        ...formData.parkingPhotos.map(f => ({ file: f, isParkingPhoto: true })),
      ];
      const totalPhotos = allUploads.length;
      for (let i = 0; i < totalPhotos; i++) {
        const { file, isParkingPhoto } = allUploads[i];
        setSubmitStatus(`Uploading photo ${i + 1} of ${totalPhotos}…`);
        try {
          const url = await uploadPhoto(file, formData.propertyName, isParkingPhoto ? 'parking' : undefined);
          if (url) {
            if (isParkingPhoto) parkingPhotoUrls.push(url);
            else photoUrls.push(url);
          }
        } catch {
          // Don't block submission if a photo upload fails
        }
        setSubmitProgress(5 + Math.round(70 * (i + 1) / totalPhotos));
      }

      setSubmitProgress(80);
      setSubmitStatus('Saving your registration…');

      const { photos: _photos, parkingPhotos: _parkingPhotos, ...submitData } = formData;

      // Determine submission ID — use existing when editing, generate new otherwise
      const submissionId = editId || formData.submissionId || generateSubmissionId();
      const dataToSend = { ...submitData, submissionId, photoUrls, parkingPhotoUrls };

      const endpoint = editId
        ? '/.netlify/functions/update-host-submission'
        : '/.netlify/functions/submit-host-form';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Submission failed. Please try again.');
      }
      setSubmitProgress(100);

      // Persist submission to localStorage so it can be edited later from the same device
      const { photos: _p, parkingPhotos: _pp, ...draftData } = { ...formData, submissionId };
      saveSubmission({
        id: submissionId,
        propertyType: formData.propertyType,
        propertyName: formData.propertyName,
        submittedAt: new Date().toISOString(),
        formData: draftData,
      });

      clearDraft();
      navigate(`/success?type=${encodeURIComponent(formData.propertyType)}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonProps = { data: formData, errors, onChange: handleChange };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-12">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between min-h-[28px]">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-text-secondary hover:text-primary transition-colors"
            aria-label="Back to home"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-text-primary">
            {getStepTitles(formData.propertyType)[currentStep - 1]}
          </h1>
        </div>
        {showSaved && (
          <span className="text-sm text-primary flex items-center gap-1 shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Saved
          </span>
        )}
      </div>

      <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} onNavigate={handleNavigate} />

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {currentStep === 1 && <StepEmail {...commonProps} />}
        {currentStep === 2 && <StepContact {...commonProps} />}
        {currentStep === 3 && <StepAddress {...commonProps} />}
        {currentStep === 4 && <StepPropertyType {...commonProps} />}
        {currentStep === 5 && <StepPropertyDetails {...commonProps} />}
        {currentStep === 6 && <StepFeatures {...commonProps} />}
        {currentStep === 7 && (
          <StepHours
            data={formData}
            errors={errors}
            onChange={handleChange}
            onTimeSlotChange={handleTimeSlotChange}
          />
        )}
        {currentStep === 8 && <StepUnique {...commonProps} />}
        {currentStep === 9 && <StepFacilities {...commonProps} />}
        {currentStep === 10 && <StepActivities {...commonProps} />}
        {currentStep === 11 && (
          <StepReview
            data={formData}
            errors={errors}
            onChange={handleChange}
            submitError={submitError}
          />
        )}
      </div>

      {isSubmitting && (
        <div className="mt-4 px-1">
          <p className="text-sm text-text-secondary mb-2 text-center">{submitStatus}</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${submitProgress}%` }}
            />
          </div>
        </div>
      )}

      <FormNavigation
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// ── Photo upload helpers ────────────────────────────────────────────────────

async function resizeAndEncode(file: File, maxDim = 1600, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadPhoto(file: File, propertyName: string, prefix?: string): Promise<string | null> {
  const mediaData = await resizeAndEncode(file);
  const safeName = (propertyName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '-');
  const timestamp = Date.now().toString(36);
  const filename = prefix
    ? `${safeName}_${prefix}_${timestamp}.jpg`
    : `${safeName}_${timestamp}.jpg`;
  const res = await fetch('/.netlify/functions/host-media-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediaData,
      mimeType: 'image/jpeg',
      filename,
      propertyName,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { webViewLink?: string };
  return data.webViewLink ?? null;
}
