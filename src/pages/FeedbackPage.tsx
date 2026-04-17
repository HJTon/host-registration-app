import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput';
import { BrandHeader, Card, Btn, Field, Input } from '../components/ui';

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
      <BrandHeader backTo="/" />

      <div className="mt-2 mb-5">
        <p className="italic text-[12px] text-ink-soft mb-0.5">Kōrero · Your voice</p>
        <h1 className="font-display text-[28px] sm:text-[32px] leading-[1.05] text-brand-green-deep">
          Share feedback
        </h1>
        <p className="text-[13px] text-ink-soft mt-1">
          Ideas, questions, complaints, or compliments
        </p>
      </div>

      {submitted ? (
        <Card className="bg-brand-green-soft border-brand-green-soft text-center">
          <p className="font-display text-[22px] text-brand-green-deep">Ngā mihi · Thanks!</p>
          <p className="text-sm text-ink-soft mt-1 mb-4">
            The team will follow up if needed.
          </p>
          <Btn variant="primary" size="md" onClick={() => navigate('/')}>
            Back to portal
          </Btn>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card className="space-y-5">
            <Field label="Name" htmlFor="fb-name" optional>
              <Input
                id="fb-name"
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Your name"
              />
            </Field>

            <Field label="Property name" htmlFor="fb-property" optional>
              <Input
                id="fb-property"
                type="text"
                value={form.propertyName}
                onChange={e => set('propertyName', e.target.value)}
                placeholder="Your property name"
              />
            </Field>

            <fieldset>
              <legend className="text-[13px] font-semibold text-ink mb-2">
                Type of feedback
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {FEEDBACK_TYPES.map(type => {
                  const selected = form.feedbackType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => set('feedbackType', type)}
                      className={[
                        'flex items-center gap-2 h-11 px-3 rounded-full border text-left transition-colors',
                        selected
                          ? 'border-brand-green bg-brand-green-soft text-brand-green-deep font-semibold'
                          : 'border-line bg-paper text-ink-soft hover:border-brand-green/40',
                      ].join(' ')}
                    >
                      {selected && (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      <span className="text-sm">{type}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <Field label="Message" htmlFor="fb-message">
              <VoiceInput
                id="fb-message"
                value={form.message}
                onChange={v => set('message', v)}
                rows={5}
                fieldHint="feedback from a Sustainable Trails 2026 host"
              />
            </Field>

            {submitError && (
              <div className="bg-danger/10 border border-danger rounded-[10px] p-3">
                <p className="text-danger text-sm font-medium">{submitError}</p>
              </div>
            )}
          </Card>

          <Btn
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            className="mt-4"
          >
            {isSubmitting ? 'Submitting…' : 'Submit feedback'}
          </Btn>
        </form>
      )}
    </div>
  );
}
