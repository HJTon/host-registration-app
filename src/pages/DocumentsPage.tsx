import { useEffect, useState } from 'react';
import { BrandHeader, Card, Divider, Btn } from '../components/ui';
import { listDocuments, type HostDocument } from '../utils/documentsApi';

interface Deadline {
  date: string;
  description: string;
}

const KEY_DEADLINES: Deadline[] = [
  { date: 'ASAP', description: 'Registration and property information — currently being collated, submit ASAP if not already done' },
  { date: 'ASAP', description: 'Property photos — please submit if not already provided' },
  { date: 'Mid-September 2026', description: 'Host information pack sent out' },
  { date: 'Early October 2026', description: 'Corflute signs delivered' },
  { date: '30 October 2026', description: 'Backyards Trail opens' },
  { date: '8 November 2026', description: 'Backyards Trail closes' },
  { date: '9 November 2026', description: 'Builds, Lifestyle & Farms Trail opens' },
  { date: '15 November 2026', description: 'Builds, Lifestyle & Farms Trail closes' },
];

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<HostDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listDocuments()
      .then(setDocs)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <BrandHeader backTo="/" />

      {/* Heading */}
      <div className="mt-2 mb-5">
        <p className="italic text-[12px] text-ink-soft mb-0.5">Pukapuka · Resources</p>
        <h1 className="font-display text-[28px] sm:text-[32px] leading-[1.05] text-brand-green-deep">
          Host documents
        </h1>
      </div>

      {/* Downloadable documents */}
      <Card className="mb-4">
        <Divider label="Documents & resources" className="mb-4" />
        {loading ? (
          <p className="meta">Loading documents…</p>
        ) : docs.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {docs.map(doc => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-[12px] border border-line bg-paper px-3.5 py-3"
              >
                <div className="flex-1 min-w-0 flex items-start gap-2.5">
                  <span className="shrink-0 text-brand-green-deep" aria-hidden="true">📄</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{doc.title}</p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      PDF{doc.sizeBytes ? ` · ${formatBytes(doc.sizeBytes)}` : ''}
                      {doc.uploadedAt ? ` · added ${formatDate(doc.uploadedAt)}` : ''}
                    </p>
                  </div>
                </div>
                <a href={doc.downloadLink} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Btn size="sm" variant="primary">Download</Btn>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-ink-soft">
            {failed
              ? 'Documents are unavailable right now — please try again shortly.'
              : 'More documents (information pack, guidelines, resources) will be added here closer to the event.'}
          </p>
        )}
      </Card>

      <Card className="mb-4">
        <Divider label="Key deadlines" className="mb-4" />
        <div className="space-y-3">
          {KEY_DEADLINES.map((item, i) => (
            <div key={i} className="flex gap-3 text-[14px]">
              <span className="font-mono text-brand-green-deep font-semibold shrink-0 w-40 tabular-nums">
                {item.date}
              </span>
              <span className="text-ink">{item.description}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
