import { useNavigate } from 'react-router-dom';
import { hasDraft, clearDraft } from '../utils/storage';
import { Btn, Card, BrandHeader } from '../components/ui';

interface TileProps {
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
  comingSoon?: boolean;
  info?: boolean;
}

function Tile({ icon, title, description, onClick, comingSoon, info }: TileProps) {
  if (comingSoon) {
    return (
      <div className="relative bg-cream-soft border border-line rounded-[14px] p-4 flex flex-col gap-2 opacity-70 select-none">
        <span className="absolute top-3 right-3 eyebrow text-[10px] tracking-[0.16em] text-ink-muted">
          Coming soon
        </span>
        <span className="text-2xl">{icon}</span>
        <p className="font-semibold text-ink text-sm">{title}</p>
        <p className="text-xs text-ink-soft leading-snug">{description}</p>
      </div>
    );
  }

  if (info) {
    return (
      <div className="bg-brand-green-soft border border-line rounded-[14px] p-4 flex flex-col gap-2 select-none">
        <span className="text-2xl">{icon}</span>
        <p className="font-semibold text-brand-green-ink text-sm">{title}</p>
        <p className="text-xs text-ink-soft leading-snug">{description}</p>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="text-left bg-paper border border-line rounded-[14px] p-4 flex flex-col gap-2 shadow-card hover:border-brand-green hover:-translate-y-[1px] transition-all active:scale-[0.98]"
    >
      <span className="text-2xl">{icon}</span>
      <p className="font-semibold text-ink text-sm">{title}</p>
      <p className="text-xs text-ink-soft leading-snug">{description}</p>
    </button>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const draftExists = hasDraft();

  const handleStartFresh = () => {
    clearDraft();
    navigate('/form');
  };

  const handleResume = () => {
    navigate('/form');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      <BrandHeader />

      {/* Cream hero header */}
      <section className="bg-cream rounded-[22px] px-5 py-6 sm:px-8 sm:py-8 mt-2">
        <p className="italic text-[13px] text-ink-soft">Nau mai haere mai</p>
        <h1 className="font-display text-[34px] sm:text-[44px] leading-[1.02] text-brand-green-deep mt-1">
          2026 Host Portal
        </h1>
        <p className="text-ink-soft mt-3 text-[14px] sm:text-[15px] max-w-prose">
          Welcome, host — everything you need to prepare for the event is right here.
        </p>
        <div className="mt-4 flex flex-col gap-1 text-[13px]">
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-backyards" aria-hidden />
            <span className="text-brand-green-ink">
              <span className="font-semibold">Backyards Trail:</span>{' '}
              30 October – 8 November 2026
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-builds" aria-hidden />
            <span className="text-brand-green-ink">
              <span className="font-semibold">Builds, Lifestyle &amp; Farms:</span>{' '}
              9 – 15 November 2026
            </span>
          </span>
        </div>
      </section>

      {/* Draft resume banner */}
      {draftExists && (
        <Card className="mt-5 bg-brand-green-soft border-brand-green-soft">
          <p className="font-semibold text-brand-green-ink mb-1">
            You have a saved registration draft
          </p>
          <p className="text-sm text-ink-soft mb-4">
            Would you like to continue where you left off?
          </p>
          <div className="flex gap-3">
            <Btn variant="primary" size="lg" fullWidth onClick={handleResume}>
              Resume draft
            </Btn>
            <Btn variant="ghost" size="lg" fullWidth onClick={handleStartFresh}>
              Start fresh
            </Btn>
          </div>
        </Card>
      )}

      {/* Primary CTA — register */}
      <section className="mt-5">
        <button
          onClick={draftExists ? handleResume : handleStartFresh}
          className="group w-full text-left bg-gradient-to-br from-brand-green-deep to-brand-green text-white rounded-[22px] px-6 py-5 flex items-center gap-4 shadow-hero hover:brightness-[0.97] transition-[filter] active:scale-[0.99]"
        >
          <span className="text-3xl" aria-hidden>📋</span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[22px] sm:text-[26px] leading-tight">
              Register your property
            </p>
            <p className="text-[13px] opacity-85 mt-0.5">
              Register by 15 April 2026 · 10–15 min, progress saved automatically
            </p>
          </div>
          <svg className="w-5 h-5 shrink-0 opacity-80 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </section>

      {/* Tools grid */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        <Tile
          icon="🏡"
          title="Property preparation checklist"
          description="Track what to do before, during, and after the event"
          onClick={() => navigate('/checklist')}
        />
        <Tile
          icon="💬"
          title="Share feedback"
          description="Ideas, questions, or compliments — we'd love to hear from you"
          onClick={() => navigate('/feedback')}
        />
        <Tile
          icon="🎤"
          title="Talks & workshops"
          description="We'll collect details on talks, workshops, and kids activities at a later date"
          comingSoon
        />
        <Tile
          icon="✏️"
          title="Edit property details"
          description="Update or amend your property registration details"
          onClick={() => navigate('/edit-registration')}
        />
        <Tile
          icon="📄"
          title="Host documents"
          description="Key deadlines, information pack, and resources"
          onClick={() => navigate('/documents')}
        />
        <Tile
          icon="👥"
          title="Visitor tally"
          description="Record your daily visitor numbers during the event"
          comingSoon
        />
      </section>

      {/* Footer */}
      <footer className="mt-10 flex flex-col items-center gap-2 text-center text-[13px] text-ink-soft">
        <img
          src="/brand/sustainable-taranaki-logo.jpg"
          alt="Sustainable Taranaki"
          className="h-10 w-auto rounded-md mb-1"
        />
        <p>
          Organised by{' '}
          <span className="text-brand-green-deep font-semibold">Sustainable Taranaki</span>
        </p>
        <p>
          Questions? Contact Suzy Randall:{' '}
          <a href="mailto:suzy.randall@sustainabletaranaki.org.nz" className="text-brand-green-deep hover:underline">
            suzy.randall@sustainabletaranaki.org.nz
          </a>
        </p>
        <p>
          <a href="tel:+64215661850" className="text-brand-green-deep hover:underline">
            021 566 185
          </a>
        </p>
      </footer>
    </div>
  );
}
