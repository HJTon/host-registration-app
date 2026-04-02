import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput';

const FEEDBACK_TYPES = ['Idea', 'Complaint', 'Compliment', 'Question'] as const;
type FeedbackType = typeof FEEDBACK_TYPES[number];

interface FeedbackForm {
  name: string;
  propertyName: string;
  feedbackType: FeedbackType | '';
  message: string;
}

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FeedbackForm>({
    name: '',
    propertyName: '',
    feedbackType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof FeedbackForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) {
      setSubmitError('Please enter a message before submitting.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/.netlify/functions/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Submission failed. Please try again.');
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      {/* Header */}
      <div className="pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-primary hover:text-primary-dark p-1 -ml-1"
          aria-label="Back"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Share feedback</h1>
          <p className="text-sm text-text-secondary mt-0.5">Ideas, questions, complaints, or compliments</p>
        </div>
      </div>

      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mt-4">
          <p className="text-lg font-bold text-green-800">Thanks for your feedback!</p>
          <p className="text-sm text-green-700 mt-1 mb-4">The team will follow up if needed.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-white rounded-xl px-6 py-3 font-semibold text-sm hover:bg-primary-dark transition-colors"
          >
            Back to portal
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="fb-name">
                Name <span className="text-text-secondary font-normal">(optional)</span>
              </label>
              <input
                id="fb-name"
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Your name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[52px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="fb-property">
                Property name <span className="text-text-secondary font-normal">(optional)</span>
              </label>
              <input
                id="fb-property"
                type="text"
                value={form.propertyName}
                onChange={e => set('propertyName', e.target.value)}
                placeholder="Your property name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[52px]"
              />
            </div>

            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-text-primary mb-3">
                  Type of feedback
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {FEEDBACK_TYPES.map(type => (
                    <label
                      key={type}
                      className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors min-h-[48px] ${
                        form.feedbackType === type
                          ? 'border-primary bg-secondary/30'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="feedbackType"
                        value={type}
                        checked={form.feedbackType === type}
                        onChange={() => set('feedbackType', type)}
                        className="w-4 h-4 accent-primary shrink-0"
                      />
                      <span className="text-sm font-medium text-text-primary">{type}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="fb-message">
                Message
              </label>
              <VoiceInput
                id="fb-message"
                value={form.message}
                onChange={v => set('message', v)}
                rows={5}
                fieldHint="feedback from a Sustainable Backyards 2026 host"
              />
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 text-sm font-medium">{submitError}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full bg-primary text-white rounded-2xl px-6 py-4 text-base font-bold min-h-[56px] hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </form>
      )}
    </div>
  );
}
