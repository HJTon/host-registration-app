import type { ReactNode } from 'react';
import type { HSResponse, HSSection } from '../types/healthSafety';
import { getHSSchema, HS_TYPE_LABELS } from '../types/healthSafety';
import { Card } from './ui';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

function selectedText(response: HSResponse, section: HSSection & { id: string }): string {
  const sel = (response.fields[section.id] as string[]) ?? [];
  const other = (response.fields[`${section.id}_other`] as string) ?? '';
  const parts = sel.filter(s => s !== 'Other');
  if (sel.includes('Other') && other) parts.push(other);
  return parts.join(', ');
}

function SectionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="hs-block py-3 border-b border-line last:border-b-0">
      <p className="font-display text-[15px] text-brand-green-ink mb-1">{title}</p>
      {children}
    </div>
  );
}

/**
 * Presentational render of a completed H&S plan — the "Property Health & Safety
 * Plan" document. Shared by the host-facing plan page (data from localStorage)
 * and the coordinator dashboard (data fetched from the sheet), so both render
 * identically. Print chrome lives in the wrapping page, not here.
 */
export default function HSPlanDocument({ response }: { response: HSResponse }) {
  const schema = getHSSchema(response.hsType);

  return (
    <>
      <Card hero className="mt-2">
        <p className="eyebrow mb-1">Taranaki Sustainable Trails 2026</p>
        <h1 className="font-display text-[24px] sm:text-[28px] text-brand-green-deep leading-[1.05]">
          Property Health &amp; Safety Plan
        </h1>
        <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[14px]">
          <p><span className="text-ink-muted">Property:</span> <span className="font-medium">{response.propertyName || '—'}</span></p>
          <p><span className="text-ink-muted">Trail:</span> <span className="font-medium">{HS_TYPE_LABELS[response.hsType]}</span></p>
          <p><span className="text-ink-muted">Address:</span> <span className="font-medium">{response.propertyAddress || '—'}</span></p>
          <p><span className="text-ink-muted">Host:</span> <span className="font-medium">{response.name || '—'}</span></p>
          <p><span className="text-ink-muted">Email:</span> <span className="font-medium">{response.email || '—'}</span></p>
          <p><span className="text-ink-muted">Completed:</span> <span className="font-medium">{formatDate(response.submittedAt)}</span></p>
        </div>
      </Card>

      <Card className="mt-4">
        {schema.sections.map(section => {
          if (section.kind === 'info') return null;

          if (section.kind === 'acknowledgement') {
            return (
              <SectionBlock key={section.id} title="Acknowledgement">
                <p className="text-[13px] text-ink-soft mb-2">{section.label}</p>
                <ul className="list-disc pl-5 flex flex-col gap-1 text-[13px] text-ink-soft mb-3">
                  {section.clauses.map((c, i) => <li key={i} className="leading-snug">{c}</li>)}
                </ul>
                <p className="text-[14px] text-ink">
                  {response.acknowledged ? '✔ Acknowledged and signed' : 'Not acknowledged'} by{' '}
                  <span className="font-semibold">{response.signatureName || '—'}</span> on {formatDate(response.signedAt)}.
                </p>
              </SectionBlock>
            );
          }

          if (section.kind === 'hazard') {
            const sel = selectedText(response, section);
            const plan = (response.fields[`${section.id}_plan`] as string) ?? '';
            return (
              <SectionBlock key={section.id} title={section.label}>
                <p className="text-[14px] text-ink"><span className="text-ink-muted">Identified:</span> {sel || 'None noted'}</p>
                {plan && (
                  <p className="text-[14px] text-ink mt-1 whitespace-pre-wrap"><span className="text-ink-muted">Plan:</span> {plan}</p>
                )}
              </SectionBlock>
            );
          }

          if (section.kind === 'checkboxOnly') {
            const sel = selectedText(response, section);
            return (
              <SectionBlock key={section.id} title={section.label}>
                <p className="text-[14px] text-ink">{sel || '—'}</p>
              </SectionBlock>
            );
          }

          // yesno / shortText / paragraph
          const val = (response.fields[section.id] as string) ?? '';
          return (
            <SectionBlock key={section.id} title={section.label}>
              <p className="text-[14px] text-ink whitespace-pre-wrap">{val || '—'}</p>
            </SectionBlock>
          );
        })}
      </Card>
    </>
  );
}
