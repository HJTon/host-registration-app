import { useNavigate } from 'react-router-dom';
import { hasDraft, clearDraft } from '../utils/storage';

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
      <div className="relative bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col gap-2 opacity-60 select-none">
        <span className="absolute top-3 right-3 text-xs font-semibold text-white bg-gray-400 rounded-full px-2 py-0.5">
          Coming soon
        </span>
        <span className="text-2xl">{icon}</span>
        <p className="font-semibold text-text-primary text-sm">{title}</p>
        <p className="text-xs text-text-secondary leading-snug">{description}</p>
      </div>
    );
  }

  if (info) {
    return (
      <div className="bg-secondary/30 border border-secondary rounded-2xl p-5 flex flex-col gap-2 select-none">
        <span className="text-2xl">{icon}</span>
        <p className="font-semibold text-text-primary text-sm">{title}</p>
        <p className="text-xs text-text-secondary leading-snug">{description}</p>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="text-left bg-white border-2 border-gray-100 rounded-2xl p-5 flex flex-col gap-2 hover:border-primary hover:shadow-md transition-all active:scale-[0.98]"
    >
      <span className="text-2xl">{icon}</span>
      <p className="font-semibold text-text-primary text-sm">{title}</p>
      <p className="text-xs text-text-secondary leading-snug">{description}</p>
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
      {/* Banner */}
      <section className="pt-4">
        <img
          src="https://images.squarespace-cdn.com/content/v1/5995196617bffc7066470431/e5147d35-3e0b-4457-85fe-2e0048850553/Trails+Website+banner.png?format=1500w"
          alt="Sustainable Backyards Taranaki"
          className="w-full rounded-xl"
        />
      </section>

      {/* Heading */}
      <section className="mt-8">
        <h1 className="text-3xl font-bold text-text-primary">
          2026 Host Portal
        </h1>
        <p className="text-text-secondary mt-2 text-base">
          Welcome, host! Everything you need to prepare for the event is right here.
        </p>
        <p className="text-sm text-primary font-medium mt-1">
          Backyards Trail: 30 October – 8 November 2026
        </p>
        <p className="text-sm text-primary font-medium">
          Builds, Lifestyle & Farms: 9 – 15 November 2026
        </p>
      </section>

      {/* Draft resume banner */}
      {draftExists && (
        <section className="mt-6 bg-secondary rounded-2xl p-5">
          <p className="font-semibold text-text-primary mb-1">You have a saved registration draft</p>
          <p className="text-sm text-text-secondary mb-4">
            Would you like to continue where you left off?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleResume}
              className="flex-1 bg-primary text-white rounded-xl px-5 py-3 font-semibold text-base min-h-[48px] hover:bg-primary-dark transition-colors"
            >
              Resume draft
            </button>
            <button
              onClick={handleStartFresh}
              className="flex-1 border-2 border-primary text-primary rounded-xl px-5 py-3 font-semibold text-base min-h-[48px] hover:bg-white transition-colors"
            >
              Start fresh
            </button>
          </div>
        </section>
      )}

      {/* Primary tile — register */}
      <section className="mt-6">
        <button
          onClick={draftExists ? handleResume : handleStartFresh}
          className="w-full text-left bg-primary text-white rounded-2xl px-6 py-5 flex items-center gap-4 hover:bg-primary-dark transition-colors shadow-sm active:scale-[0.98]"
        >
          <span className="text-3xl">📋</span>
          <div>
            <p className="text-xl font-bold">Register your property here</p>
            <p className="text-sm opacity-80 mt-0.5">Register by 15th April 2026 — 10–15 min form, progress saved automatically</p>
          </div>
          <svg className="w-5 h-5 ml-auto shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </section>

      {/* Smaller tiles grid */}
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
      <section className="mt-8 text-center text-sm text-text-secondary space-y-1">
        <p>
          Organised by{' '}
          <span className="text-primary font-medium">Sustainable Taranaki</span>
        </p>
        <p>
          Questions? Contact Suzy Randall:{' '}
          <a href="mailto:suzy.randall@sustainabletaranaki.org.nz" className="text-primary hover:underline">
            suzy.randall@sustainabletaranaki.org.nz
          </a>
        </p>
        <p>
          <a href="tel:+64215661850" className="text-primary hover:underline">021 566 185</a>
        </p>
      </section>
    </div>
  );
}
