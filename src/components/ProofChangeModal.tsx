import { useState } from 'react';
import type { FormEvent } from 'react';
import { Btn, Field, Input, Textarea } from './ui';
import {
  submitProofChange, resizePhoto, type ProofChangeItem,
} from '../utils/proofApi';

interface Props {
  documentTitle: string;
  onClose: () => void;
}

const emptyItem = (): ProofChangeItem => ({ page: '', current: '', suggested: '' });

export default function ProofChangeModal({ documentTitle, onClose }: Props) {
  const [name, setName] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [email, setEmail] = useState('');
  const [items, setItems] = useState<ProofChangeItem[]>([emptyItem()]);
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<{ data: string; mime: string; name: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const setItem = (i: number, field: keyof ProofChangeItem, value: string) =>
    setItems(prev => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const onPickPhoto = async (file: File | null) => {
    setPhotoError(null);
    if (!file) { setPhoto(null); return; }
    if (!file.type.startsWith('image/')) { setPhotoError('Please choose an image (photo or screenshot).'); return; }
    try {
      const { data, mime } = await resizePhoto(file);
      setPhoto({ data, mime, name: file.name });
    } catch {
      setPhotoError('Could not read that image. Try another.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitProofChange({
        name: name.trim(),
        propertyName: propertyName.trim(),
        email: email.trim(),
        document: documentTitle,
        comment: comment.trim(),
        changes: items
          .filter(it => it.page.trim() || it.current.trim() || it.suggested.trim())
          .map(it => ({ page: it.page.trim(), current: it.current.trim(), suggested: it.suggested.trim() })),
        photoData: photo?.data,
        photoMime: photo?.mime,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface/95 backdrop-blur px-5 py-4 border-b border-line flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="italic text-[12px] text-ink-soft">Suggest a change</p>
            <h2 className="font-display text-[20px] leading-tight text-brand-green-deep truncate">{documentTitle}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="shrink-0 text-ink-soft hover:text-ink text-xl leading-none px-1">×</button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <p className="font-display text-[22px] text-brand-green-deep">Ngā mihi · Thank you!</p>
            <p className="text-sm text-ink-soft mt-1 mb-5">
              Your suggested changes have been sent to the coordinators. They’ll update the proof and follow up if anything’s unclear.
            </p>
            <Btn variant="primary" onClick={onClose}>Close</Btn>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <p className="text-[13px] text-ink-soft">
              Tell us what needs changing on this proof. Add a row for each change — include the page number where you can.
              Prefer pen and paper? Mark up your printed or downloaded copy and attach a photo below.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Your name" htmlFor="pc-name" optional>
                <Input id="pc-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </Field>
              <Field label="Property name" htmlFor="pc-prop" optional>
                <Input id="pc-prop" value={propertyName} onChange={e => setPropertyName(e.target.value)} placeholder="Your property" />
              </Field>
            </div>
            <Field label="Email" htmlFor="pc-email" hint="So we can check with you if needed." optional>
              <Input id="pc-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>

            {/* Repeatable change rows */}
            <div className="flex flex-col gap-3">
              {items.map((it, i) => (
                <div key={i} className="rounded-[12px] border border-line bg-paper p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-ink-soft">Change {i + 1}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-[12px] text-danger hover:underline">Remove</button>
                    )}
                  </div>
                  <Field label="Page" htmlFor={`pc-page-${i}`} optional>
                    <Input id={`pc-page-${i}`} value={it.page} onChange={e => setItem(i, 'page', e.target.value)} placeholder="e.g. 2" />
                  </Field>
                  <Field label="What it currently says" htmlFor={`pc-cur-${i}`} optional>
                    <Textarea id={`pc-cur-${i}`} rows={2} value={it.current} onChange={e => setItem(i, 'current', e.target.value)} placeholder="Paste or describe the current text" />
                  </Field>
                  <Field label="What it should say" htmlFor={`pc-sug-${i}`} optional>
                    <Textarea id={`pc-sug-${i}`} rows={2} value={it.suggested} onChange={e => setItem(i, 'suggested', e.target.value)} placeholder="The correction" />
                  </Field>
                </div>
              ))}
              <Btn type="button" variant="ghost" size="sm" onClick={addItem}>+ Add another change</Btn>
            </div>

            <Field label="Anything else?" htmlFor="pc-comment" optional>
              <Textarea id="pc-comment" rows={2} value={comment} onChange={e => setComment(e.target.value)} placeholder="General comments about this proof" />
            </Field>

            <Field label="Attach a photo of a marked-up page" htmlFor="pc-photo" error={photoError ?? undefined} optional>
              <input
                id="pc-photo"
                type="file"
                accept="image/*"
                onChange={e => onPickPhoto(e.target.files?.[0] ?? null)}
                className="block w-full text-[13px] text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-cream file:px-4 file:py-2 file:text-brand-green-ink file:font-semibold file:cursor-pointer hover:file:brightness-95"
              />
            </Field>
            {photo && <p className="meta -mt-1">Attached: {photo.name}</p>}

            {error && (
              <div className="bg-danger/10 border border-danger rounded-[10px] p-3">
                <p className="text-danger text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Btn type="button" variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Btn>
              <Btn type="submit" variant="primary" fullWidth disabled={submitting}>
                {submitting ? 'Sending…' : 'Send changes'}
              </Btn>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
