import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HSType } from '../types/healthSafety';
import { HS_TYPE_LABELS } from '../types/healthSafety';
import {
  fetchHSList, dashboardLogin, getDashboardKey, clearDashboardKey,
  withdrawHost, restoreHost,
  DashboardAuthError, type DashboardHost, type HSCounts,
} from '../utils/dashboardApi';
import {
  listDocuments, uploadDocument, deleteDocument, type HostDocument, type DocKind,
} from '../utils/documentsApi';
import { BrandHeader, Card, Btn, Divider, Field, Input, CategoryChip } from '../components/ui';

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

// ── Module tabs (H&S + Documents active; the rest are placeholders) ────────────
const TABS: { id: string; label: string; enabled: boolean }[] = [
  { id: 'hs', label: 'Health & Safety', enabled: true },
  { id: 'documents', label: 'Documents', enabled: true },
  { id: 'visitors', label: 'Visitor tally', enabled: false },
  { id: 'talks', label: 'Talks & workshops', enabled: false },
];

type TypeFilter = 'all' | HSType;
type StatusFilter = 'all' | 'done' | 'not-started';

function StatusBadge({ status }: { status: 'done' | 'not-started' }) {
  return status === 'done' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-green-soft text-brand-green-deep">
      ✔ Signed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cream text-[#9A6A1D] border border-line">
      Not started
    </span>
  );
}

function HSTab() {
  const navigate = useNavigate();
  const [hosts, setHosts] = useState<DashboardHost[]>([]);
  const [counts, setCounts] = useState<HSCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showHidden, setShowHidden] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchHSList()
      .then(data => { setHosts(data.hosts); setCounts(data.counts); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Hidden (withdrawn) properties are excluded unless "Show hidden" is on.
  const filtered = useMemo(
    () => hosts.filter(h =>
      (showHidden || !h.withdrawn) &&
      (typeFilter === 'all' || h.hsType === typeFilter) &&
      (statusFilter === 'all' || h.status === statusFilter)
    ),
    [hosts, typeFilter, statusFilter, showHidden],
  );

  const toggleWithdrawn = async (h: DashboardHost) => {
    if (!h.regId) return;
    setBusyId(h.regId);
    try {
      if (h.withdrawn) await restoreHost(h.regId);
      else await withdrawHost(h.regId, h.propertyName);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="meta mt-4">Loading hosts…</p>;
  if (error) return (
    <Card className="mt-4">
      <p className="text-danger text-sm mb-3">{error}</p>
      <Btn size="sm" variant="ghost" onClick={load}>Try again</Btn>
    </Card>
  );

  return (
    <div className="mt-4">
      {/* Summary chips */}
      {counts && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="bg-brand-green-soft text-brand-green-ink rounded-full px-3 py-1.5 text-[13px] font-semibold">
            {counts.done} / {counts.total} signed
          </div>
          {(Object.keys(counts.byType) as HSType[])
            .filter(t => counts.byType[t].total > 0)
            .map(t => (
              <div key={t} className="bg-paper border border-line rounded-full px-3 py-1.5 text-[13px] text-ink-soft">
                {HS_TYPE_LABELS[t]}: <span className="font-semibold text-ink">{counts.byType[t].done}/{counts.byType[t].total}</span>
              </div>
            ))}
          {counts.withdrawn > 0 && (
            <button
              onClick={() => setShowHidden(s => !s)}
              className="bg-cream-soft border border-line rounded-full px-3 py-1.5 text-[13px] text-ink-soft hover:border-brand-green transition-colors"
            >
              {showHidden ? 'Hide hidden' : `Show hidden (${counts.withdrawn})`}
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <label className="flex items-center gap-2 text-[13px] text-ink-soft">
          Trail
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as TypeFilter)}
            className="h-9 rounded-[10px] border border-line bg-paper px-2 text-[13px] text-ink"
          >
            <option value="all">All</option>
            <option value="backyards">Backyards</option>
            <option value="builds">Builds</option>
            <option value="farms">Farms</option>
            <option value="lifestyle">Lifestyle Blocks</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13px] text-ink-soft">
          Status
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="h-9 rounded-[10px] border border-line bg-paper px-2 text-[13px] text-ink"
          >
            <option value="all">All</option>
            <option value="done">Signed</option>
            <option value="not-started">Not started</option>
          </select>
        </label>
        <span className="ml-auto self-center meta">{filtered.length} shown</span>
      </div>

      {/* Host rows */}
      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 && <p className="meta">No hosts match these filters.</p>}
        {filtered.map((h, i) => (
          <Card key={`${h.regId || h.email}-${i}`} className={`flex flex-col sm:flex-row sm:items-center gap-3 ${h.withdrawn ? 'opacity-60' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-ink truncate">{h.propertyName || h.hostNames || 'Unnamed property'}</p>
                {h.propertyType && <CategoryChip propertyType={h.propertyType} size="sm" />}
                {h.withdrawn ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-line text-ink-soft">Hidden</span>
                ) : (
                  <StatusBadge status={h.status} />
                )}
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                {h.hostNames}
                {h.status === 'done' && h.signedAt && ` · signed ${formatDate(h.signedAt)}`}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs">
                {h.email && (
                  <a href={`mailto:${h.email}`} className="text-brand-green-deep hover:underline">{h.email}</a>
                )}
                {h.contactNumber && (
                  <a href={`tel:${h.contactNumber.replace(/\s+/g, '')}`} className="text-brand-green-deep hover:underline">{h.contactNumber}</a>
                )}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {!h.withdrawn && h.status === 'done' && h.hsSubmissionId && (
                <Btn size="sm" variant="primary" onClick={() => navigate(`/dashboard/plan?id=${encodeURIComponent(h.hsSubmissionId)}`)}>
                  View plan
                </Btn>
              )}
              {h.regId && (
                <Btn
                  size="sm"
                  variant="ghost"
                  disabled={busyId === h.regId}
                  onClick={() => toggleWithdrawn(h)}
                >
                  {busyId === h.regId ? '…' : h.withdrawn ? 'Restore' : 'Hide'}
                </Btn>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Documents module: upload shared host resources (PDFs) ──────────────────────
// Files go browser → Drive directly, so there's no Netlify size limit; cap is a
// sanity guard against accidental huge uploads.
const MAX_DOC_BYTES = 100 * 1024 * 1024;

function DocumentsTab() {
  const [docs, setDocs] = useState<HostDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<DocKind>('proof');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listDocuments()
      .then(setDocs)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const onPickFile = (f: File | null) => {
    setUploadError(null);
    if (f && f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Please choose a PDF file.');
      setFile(null);
      return;
    }
    if (f && f.size > MAX_DOC_BYTES) {
      setUploadError('That file is larger than 100 MB. Please check it’s the right file.');
      setFile(null);
      return;
    }
    setFile(f);
    if (f && !title.trim()) setTitle(f.name.replace(/\.pdf$/i, ''));
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setUploadError(null);
    try {
      await uploadDocument(file, title.trim() || file.name, kind, f => setProgress(f));
      setFile(null);
      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (doc: HostDocument) => {
    if (!window.confirm(`Remove “${doc.title}”? Hosts will no longer see this document.`)) return;
    setBusyId(doc.id);
    setError(null);
    try {
      await deleteDocument(doc.id);
      setDocs(ds => ds.filter(d => d.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove document');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Upload form */}
      <Card>
        <Divider label="Add a document" className="mb-4" />
        <p className="text-[13px] text-ink-soft mb-4">
          Upload a PDF (info pack, guidelines, map, etc.). It appears straight away for every host on the
          <span className="font-semibold"> Host documents</span> page. Large files are fine — they upload
          directly to Drive.
        </p>
        <form onSubmit={handleUpload} className="flex flex-col gap-3">
          <fieldset>
            <legend className="text-[13px] font-semibold text-ink mb-2">Document type</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                { id: 'proof', label: 'Proof to check', desc: 'Hosts can suggest changes' },
                { id: 'info', label: 'Information', desc: 'View / download only' },
              ] as const).map(opt => {
                const selected = kind === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setKind(opt.id)}
                    className={[
                      'flex flex-col items-start text-left px-3 py-2 rounded-[10px] border transition-colors',
                      selected
                        ? 'border-brand-green bg-brand-green-soft text-brand-green-deep'
                        : 'border-line bg-paper text-ink-soft hover:border-brand-green/40',
                    ].join(' ')}
                  >
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="text-[12px] text-ink-soft">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <Field label="Title" htmlFor="doc-title" hint="Shown to hosts as the document name.">
            <Input
              id="doc-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Host information pack 2026"
            />
          </Field>
          <Field label="PDF file" htmlFor="doc-file" error={uploadError ?? undefined}>
            <input
              ref={fileInputRef}
              id="doc-file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={e => onPickFile(e.target.files?.[0] ?? null)}
              className="block w-full text-[13px] text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-brand-green file:px-4 file:py-2 file:text-white file:font-semibold file:cursor-pointer hover:file:brightness-95"
            />
          </Field>
          {file && !uploading && (
            <p className="meta">Selected: {file.name} · {formatBytes(file.size)}</p>
          )}
          {uploading && (
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
                <div
                  className="h-full bg-brand-green transition-[width] duration-150"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="meta">{Math.round(progress * 100)}% uploaded</p>
            </div>
          )}
          <Btn type="submit" variant="primary" disabled={!file || uploading}>
            {uploading ? 'Uploading…' : 'Upload document'}
          </Btn>
        </form>
      </Card>

      {/* Existing documents */}
      <div>
        <Divider label="Published documents" className="mb-3" />
        {loading ? (
          <p className="meta">Loading documents…</p>
        ) : error ? (
          <Card>
            <p className="text-danger text-sm mb-3">{error}</p>
            <Btn size="sm" variant="ghost" onClick={load}>Try again</Btn>
          </Card>
        ) : docs.length === 0 ? (
          <p className="meta">No documents yet. Upload one above to share it with hosts.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {docs.map(doc => (
              <Card key={doc.id} className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-ink truncate">{doc.title}</p>
                    {doc.kind === 'proof' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-green-soft text-brand-green-deep">Proof</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cream text-brand-green-ink border border-line">Info</span>
                    )}
                  </div>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {doc.uploadedAt && `Added ${formatDate(doc.uploadedAt)}`}
                    {doc.sizeBytes ? ` · ${formatBytes(doc.sizeBytes)}` : ''}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <a href={doc.webViewLink} target="_blank" rel="noopener noreferrer">
                    <Btn size="sm" variant="ghost">View</Btn>
                  </a>
                  <Btn
                    size="sm"
                    variant="danger"
                    disabled={busyId === doc.id}
                    onClick={() => handleDelete(doc)}
                  >
                    {busyId === doc.id ? '…' : 'Remove'}
                  </Btn>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('hs');

  // If a key is already stored this session, validate it silently.
  useEffect(() => {
    if (!getDashboardKey()) { setChecking(false); return; }
    dashboardLogin(getDashboardKey())
      .then(() => setAuthed(true))
      .catch(() => clearDashboardKey())
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    setLoginError(null);
    try {
      await dashboardLogin(password.trim());
      setAuthed(true);
    } catch (err) {
      setLoginError(err instanceof DashboardAuthError ? 'Incorrect password.' : 'Could not sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => { clearDashboardKey(); setAuthed(false); setPassword(''); };

  if (checking) {
    return (
      <div className="max-w-md mx-auto px-4 pt-16 text-center">
        <p className="meta">Checking access…</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-4">
        <BrandHeader backTo="/" />
        <Card className="mt-6">
          <Divider label="Coordinator dashboard" sublabel="Whakahaere" className="mb-4" />
          <p className="text-sm text-ink-soft mb-4">Enter the dashboard password to continue.</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <Field label="Password" htmlFor="dash-pw" error={loginError ?? undefined}>
              <Input
                id="dash-pw"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                invalid={!!loginError}
              />
            </Field>
            <Btn type="submit" variant="primary" size="lg" fullWidth disabled={submitting || !password.trim()}>
              {submitting ? 'Checking…' : 'Enter dashboard'}
            </Btn>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-12">
      <BrandHeader
        backTo="/"
        rightSlot={<Btn size="sm" variant="ghost" onClick={handleLogout}>Sign out</Btn>}
      />

      <div className="mt-2 mb-4">
        <p className="italic text-[12px] text-ink-soft mb-0.5">Whakahaere · Coordinator dashboard</p>
        <h1 className="font-display text-[28px] sm:text-[32px] leading-[1.05] text-brand-green-deep">
          Host dashboard
        </h1>
      </div>

      {/* Module tabs */}
      <div className="flex gap-1 border-b border-line">
        {TABS.map(tab => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              disabled={!tab.enabled}
              onClick={() => tab.enabled && setActiveTab(tab.id)}
              className={[
                'relative px-3 py-2 text-[13px] font-semibold -mb-px border-b-2 transition-colors',
                active ? 'border-brand-green text-brand-green-deep' : 'border-transparent',
                tab.enabled ? 'text-ink-soft hover:text-ink' : 'text-ink-muted cursor-not-allowed',
              ].join(' ')}
            >
              {tab.label}
              {!tab.enabled && <span className="ml-1.5 text-[9px] tracking-[0.12em] uppercase text-ink-muted">soon</span>}
            </button>
          );
        })}
      </div>

      {activeTab === 'hs' ? (
        <HSTab />
      ) : activeTab === 'documents' ? (
        <DocumentsTab />
      ) : (
        <Card className="mt-4 text-center">
          <p className="text-3xl mb-2">🚧</p>
          <p className="font-semibold text-ink">Coming soon</p>
          <p className="text-sm text-ink-soft mt-1">This module will appear here once it’s built.</p>
        </Card>
      )}
    </div>
  );
}
