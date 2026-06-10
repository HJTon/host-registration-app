import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { HSResponse } from '../types/healthSafety';
import { fetchHSRecord, getDashboardKey } from '../utils/dashboardApi';
import { BrandHeader, Card, Btn } from '../components/ui';
import HSPlanDocument from '../components/HSPlanDocument';

export default function DashboardPlanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [response, setResponse] = useState<HSResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getDashboardKey()) { navigate('/dashboard', { replace: true }); return; }
    if (!id) { setError('No plan selected'); setLoading(false); return; }
    fetchHSRecord(id)
      .then(data => {
        if (data.found && data.response) setResponse(data.response);
        else setError('Plan not found');
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load plan'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12 hs-plan">
      <div className="no-print">
        <BrandHeader
          backTo="/dashboard"
          backLabel="Dashboard"
          rightSlot={
            response ? (
              <Btn variant="primary" size="sm" onClick={() => window.print()}>
                Print / Save as PDF
              </Btn>
            ) : undefined
          }
        />
      </div>

      {loading && <p className="meta mt-4">Loading plan…</p>}

      {error && (
        <Card className="mt-4 text-center">
          <p className="text-4xl mb-3">📄</p>
          <h2 className="font-display text-[20px] text-brand-green-deep mb-2">{error}</h2>
          <Btn variant="primary" onClick={() => navigate('/dashboard')}>Back to dashboard</Btn>
        </Card>
      )}

      {response && <HSPlanDocument response={response} />}
    </div>
  );
}
