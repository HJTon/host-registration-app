import { BrandHeader, Card, Divider } from '../components/ui';

interface Deadline {
  date: string;
  description: string;
}

const KEY_DEADLINES: Deadline[] = [
  { date: '15 April 2026', description: 'Registration and property information due' },
  { date: '1 May 2026', description: 'Property photos submitted' },
  { date: 'Mid-September 2026', description: 'Host information pack sent out' },
  { date: 'Early October 2026', description: 'Corflute signs delivered' },
  { date: '30 October 2026', description: 'Backyards Trail opens' },
  { date: '8 November 2026', description: 'Backyards Trail closes' },
  { date: '9 November 2026', description: 'Builds, Lifestyle & Farms Trail opens' },
  { date: '15 November 2026', description: 'Builds, Lifestyle & Farms Trail closes' },
];

export default function DocumentsPage() {
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

      <Card className="bg-cream border-cream">
        <p className="text-[13px] text-ink-soft text-center">
          More documents (information pack, guidelines, resources) will be added here closer to the event.
        </p>
      </Card>
    </div>
  );
}
