import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HSType } from '../types/healthSafety';
import { HS_TYPE_LABELS } from '../types/healthSafety';
import {
  fetchHSList, dashboardLogin, getDashboardKey, clearDashboardKey,
  DashboardAuthError, type DashboardHost, type HSCounts,
} from '../utils/dashboardApi';
import { BrandHeader, Card, Btn, Divider, Field, Input, CategoryChip } from '../components/ui';

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// ── Module tabs (H&S active; the rest are placeholders for future modules) ─────
const TABS: { id: string; label: string; enabled: boolean }[] = [
  { id: 'hs', label: 'Health & Safety', enabled: true },
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

  const load = () => {
    setLoading(true);
    setError(null);
    fetchHSList()
      .then(data => { setHosts(data.hosts); setCounts(data.counts); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(
    () => hosts.filter(h =>
      (typeFilter === 'all' || h.hsType === typeFilter) &&
      (statusFilter === 'all' || h.status === statusFilter)
    ),
    [hosts, typeFilter, statusFilter],
  );

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
          <Card key={`${h.regId || h.email}-${i}`} className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-ink truncate">{h.propertyName || h.hostNames || 'Unnamed property'}</p>
                {h.propertyType && <CategoryChip propertyType={h.propertyType} size="sm" />}
                <StatusBadge status={h.status} />
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
            <div className="shrink-0">
              {h.status === 'done' && h.hsSubmissionId && (
                <Btn size="sm" variant="primary" onClick={() => navigate(`/dashboard/plan?id=${encodeURIComponent(h.hsSubmissionId)}`)}>
                  View plan
                </Btn>
              )}
            </div>
          </Card>
        ))}
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
