import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getHSResponseById } from '../utils/storage';
import { BrandHeader, Card, Btn } from '../components/ui';
import HSPlanDocument from '../components/HSPlanDocument';

export default function HSPlanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const response = useMemo(() => (id ? getHSResponseById(id) : null), [id]);

  if (!response) {
    return (
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <BrandHeader backTo="/health-safety" backLabel="Health & Safety" />
        <Card className="mt-4 text-center">
          <p className="text-4xl mb-3">📄</p>
          <h2 className="font-display text-[20px] text-brand-green-deep mb-2">Plan not found on this device</h2>
          <p className="text-sm text-ink-soft mb-4">
            H&amp;S plans are saved on the device they were completed on.
          </p>
          <Btn variant="primary" onClick={() => navigate('/health-safety')}>Back to Health &amp; Safety</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12 hs-plan">
      <div className="no-print">
        <BrandHeader
          backTo="/health-safety"
          backLabel="Health & Safety"
          rightSlot={
            <Btn variant="primary" size="sm" onClick={() => window.print()}>
              Print / Save as PDF
            </Btn>
          }
        />
      </div>

      <HSPlanDocument response={response} />

      <p className="meta text-center mt-4 no-print">
        Keep a copy for your records. Update it any time from the Health &amp; Safety section.
      </p>
    </div>
  );
}
