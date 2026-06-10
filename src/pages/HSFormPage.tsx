import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { HSType, HSResponse, HSFieldValue, HazardSection, CheckboxOnlySection } from '../types/healthSafety';
import { getHSSchema, getInitialHSFields, HS_TYPE_LABELS } from '../types/healthSafety';
import { getSubmissionById, saveHSResponse, getHSResponseById, generateSubmissionId } from '../utils/storage';
import { BrandHeader, Card, Btn, Divider, Field, Input, Textarea } from '../components/ui';
import { getCategoryTheme } from '../utils/category';

function isValidHSType(t: string | null): t is HSType {
  return t === 'backyards' || t === 'builds' || t === 'farms';
}

// ── Checkbox group (hazard / checkboxOnly) ───────────────────────────────────
function CheckboxGroup({
  options,
  selected,
  otherText,
  onToggle,
  onOtherChange,
  accent,
}: {
  options: string[];
  selected: string[];
  otherText: string;
  onToggle: (option: string) => void;
  onOtherChange: (value: string) => void;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => {
        const checked = selected.includes(opt);
        return (
          <label
            key={opt}
            className="flex items-start gap-2.5 cursor-pointer text-[14px] text-ink"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(opt)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-line"
              style={{ accentColor: accent }}
            />
            <span className="leading-snug">{opt}</span>
          </label>
        );
      })}
      {selected.includes('Other') && (
        <Input
          value={otherText}
          onChange={e => onOtherChange(e.target.value)}
          placeholder="Please describe…"
          className="mt-1"
        />
      )}
    </div>
  );
}

export default function HSFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get('id');
  const regId = searchParams.get('reg');
  const typeParam = searchParams.get('type');

  // Resolve the response being edited, if any.
  const existing = useMemo(() => (editId ? getHSResponseById(editId) : null), [editId]);
  const registration = useMemo(() => (regId ? getSubmissionById(regId) : null), [regId]);

  const hsType: HSType = isValidHSType(typeParam)
    ? typeParam
    : existing?.hsType ?? 'backyards';

  const schema = getHSSchema(hsType);
  const theme = getCategoryTheme(registration?.propertyType ?? hsType);

  // ── State ──────────────────────────────────────────────────────────────────
  const [email, setEmail] = useState(existing?.email ?? registration?.formData.email ?? '');
  const [name, setName] = useState(existing?.name ?? registration?.formData.hostNames ?? '');
  const [propertyName, setPropertyName] = useState(
    existing?.propertyName ?? registration?.propertyName ?? '',
  );
  const [propertyAddress, setPropertyAddress] = useState(
    existing?.propertyAddress ?? registration?.formData.address ?? '',
  );
  const [fields, setFields] = useState<Record<string, HSFieldValue>>(
    existing?.fields ?? getInitialHSFields(hsType),
  );
  const [acknowledged, setAcknowledged] = useState(existing?.acknowledged ?? false);
  const [signatureName, setSignatureName] = useState(existing?.signatureName ?? '');

  const [prefilling, setPrefilling] = useState(false);
  const [prefillNote, setPrefillNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Prefill from last year's responses (returning hosts) ─────────────────────
  useEffect(() => {
    // Only prefill new (not-yet-saved) plans where we know the host's email.
    const lookupEmail = (registration?.formData.email ?? '').trim();
    if (existing || !lookupEmail) return;
    let cancelled = false;
    setPrefilling(true);
    fetch(`/.netlify/functions/hs-prefill?type=${hsType}&email=${encodeURIComponent(lookupEmail)}`)
      .then(res => (res.ok ? res.json() : null))
      .then((data: { found?: boolean; fields?: Record<string, HSFieldValue> } | null) => {
        if (cancelled || !data?.found || !data.fields) return;
        setFields(prev => ({ ...prev, ...data.fields }));
        setPrefillNote('We’ve pre-filled your answers from last year — please review and update for any changes this year.');
      })
      .catch(() => {/* degrade gracefully — blank form */})
      .finally(() => { if (!cancelled) setPrefilling(false); });
    return () => { cancelled = true; };
  }, [existing, registration, hsType]);

  // ── Field updates ────────────────────────────────────────────────────────────
  const setField = (id: string, value: HSFieldValue) =>
    setFields(prev => ({ ...prev, [id]: value }));

  const toggleOption = (id: string, option: string) => {
    setFields(prev => {
      const current = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
      const next = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      return { ...prev, [id]: next };
    });
  };

  const canSubmit = acknowledged && signatureName.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!email.trim() || !name.trim()) {
      setError('Please fill in your email and name at the top of the form.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!acknowledged || !signatureName.trim()) {
      setError('Please tick the acknowledgement and type your name to sign the plan.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const submissionId = existing?.submissionId ?? generateSubmissionId();
    const response: HSResponse = {
      submissionId,
      hsType,
      linkedRegistrationId: registration?.id ?? existing?.linkedRegistrationId,
      email: email.trim(),
      name: name.trim(),
      propertyName: propertyName.trim(),
      propertyAddress: propertyAddress.trim(),
      fields,
      acknowledged,
      signatureName: signatureName.trim(),
      signedAt: existing?.signedAt ?? new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    try {
      const endpoint = existing
        ? '/.netlify/functions/update-hs-submission'
        : '/.netlify/functions/submit-hs-form';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Submission failed. Please try again.');
      }
      saveHSResponse(response);
      navigate(`/health-safety/plan?id=${encodeURIComponent(submissionId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <BrandHeader backTo="/health-safety" backLabel="Health & Safety" />

      <div className="mt-2 mb-4">
        <p className="italic text-[12px] text-ink-soft mb-0.5">
          Haumaru · Health &amp; safety · {HS_TYPE_LABELS[hsType]}
        </p>
        <h1 className="font-display text-[26px] sm:text-[30px] leading-[1.05] text-brand-green-deep">
          {schema.title}
        </h1>
        <p className="text-[14px] text-ink-soft mt-2 max-w-prose">{schema.blurb}</p>
      </div>

      {prefilling && (
        <p className="meta mb-3" style={{ color: theme.accent }}>Checking last year’s answers…</p>
      )}
      {prefillNote && (
        <Card className="mb-4 bg-brand-green-soft border-brand-green-soft">
          <p className="text-sm text-brand-green-ink">{prefillNote}</p>
        </Card>
      )}

      {/* Identity */}
      <Card className="mb-4">
        <Divider label="About you" sublabel="Taku whare" className="mb-4" />
        <div className="flex flex-col gap-4">
          <Field label="Email" htmlFor="hs-email">
            <Input id="hs-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Name" htmlFor="hs-name">
            <Input id="hs-name" value={name} onChange={e => setName(e.target.value)} />
          </Field>
          <Field label="Property name" htmlFor="hs-prop">
            <Input id="hs-prop" value={propertyName} onChange={e => setPropertyName(e.target.value)} />
          </Field>
          <Field label="Property address" htmlFor="hs-addr">
            <Input id="hs-addr" value={propertyAddress} onChange={e => setPropertyAddress(e.target.value)} />
          </Field>
        </div>
      </Card>

      {/* Schema-driven sections */}
      {schema.sections.map(section => {
        if (section.kind === 'acknowledgement') {
          return (
            <Card key={section.id} className="mb-4">
              <Divider label="Acknowledgement" sublabel="Te waitohu · Signing" className="mb-3" />
              <p className="text-[14px] font-semibold text-ink mb-2">{section.label}</p>
              {section.intro && (
                <p className="text-[13px] text-ink-soft mb-3 leading-snug">{section.intro}</p>
              )}
              <ul className="list-disc pl-5 flex flex-col gap-1.5 text-[13px] text-ink-soft mb-4">
                {section.clauses.map((c, i) => <li key={i} className="leading-snug">{c}</li>)}
              </ul>
              <label className="flex items-start gap-2.5 cursor-pointer text-[14px] text-ink font-medium mb-4">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={e => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ accentColor: theme.accent }}
                />
                <span>I acknowledge and agree to all of the above.</span>
              </label>
              <Field label="Sign by typing your full name" htmlFor="hs-sign" hint="This acts as your signature on this plan.">
                <Input id="hs-sign" value={signatureName} onChange={e => setSignatureName(e.target.value)} placeholder="Your full name" />
              </Field>
            </Card>
          );
        }

        if (section.kind === 'info') {
          return (
            <Card key={section.id} className="mb-4 bg-cream">
              <p className="text-[14px] font-semibold text-brand-green-ink mb-1">{section.label}</p>
              {section.help && <p className="text-[13px] text-ink-soft leading-snug">{section.help}</p>}
            </Card>
          );
        }

        return (
          <Card key={section.id} className="mb-4">
            <Divider label={section.label} className="mb-3" />
            {section.help && <p className="text-[13px] text-ink-soft mb-3 leading-snug">{section.help}</p>}

            {section.kind === 'yesno' && (
              <div className="flex gap-2">
                {[
                  { v: 'Yes', label: section.yesLabel ?? 'Yes' },
                  { v: 'No', label: section.noLabel ?? 'No' },
                ].map(({ v, label }) => {
                  const active = fields[section.id] === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setField(section.id, v)}
                      className={[
                        'px-4 h-10 rounded-full border text-[14px] font-medium transition-colors',
                        active ? 'text-white border-transparent' : 'bg-paper text-ink border-line hover:bg-cream-soft',
                      ].join(' ')}
                      style={active ? { backgroundColor: theme.accent } : undefined}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {(section.kind === 'shortText') && (
              <Input
                value={(fields[section.id] as string) ?? ''}
                onChange={e => setField(section.id, e.target.value)}
              />
            )}

            {(section.kind === 'paragraph') && (
              <Textarea
                value={(fields[section.id] as string) ?? ''}
                onChange={e => setField(section.id, e.target.value)}
                rows={section.id.includes('tourOutline') ? 8 : 4}
              />
            )}

            {(section.kind === 'checkboxOnly') && (
              <CheckboxGroup
                options={(section as CheckboxOnlySection).options}
                selected={(fields[section.id] as string[]) ?? []}
                otherText={(fields[`${section.id}_other`] as string) ?? ''}
                onToggle={opt => toggleOption(section.id, opt)}
                onOtherChange={v => setField(`${section.id}_other`, v)}
                accent={theme.accent}
              />
            )}

            {section.kind === 'hazard' && (
              <div className="flex flex-col gap-4">
                <CheckboxGroup
                  options={(section as HazardSection).options}
                  selected={(fields[section.id] as string[]) ?? []}
                  otherText={(fields[`${section.id}_other`] as string) ?? ''}
                  onToggle={opt => toggleOption(section.id, opt)}
                  onOtherChange={v => setField(`${section.id}_other`, v)}
                  accent={theme.accent}
                />
                <Field label={(section as HazardSection).planLabel} hint={(section as HazardSection).planHelp}>
                  <Textarea
                    value={(fields[`${section.id}_plan`] as string) ?? ''}
                    onChange={e => setField(`${section.id}_plan`, e.target.value)}
                    rows={3}
                  />
                </Field>
              </div>
            )}
          </Card>
        );
      })}

      {error && <p className="text-[13px] text-danger mb-3">{error}</p>}

      <div className="flex flex-col gap-2">
        <Btn variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Saving…' : existing ? 'Update H&S plan' : 'Sign & submit H&S plan'}
        </Btn>
        {!acknowledged && (
          <p className="meta text-center">Tick the acknowledgement and sign to submit.</p>
        )}
      </div>
    </div>
  );
}
