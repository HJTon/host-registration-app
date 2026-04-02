import { useState, useEffect } from 'react';
import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';
import { getPropertyCategory, isTourType } from '../../types/form';
import VoiceInput from '../../components/VoiceInput';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
}

const FEATURE_LABELS: Record<string, string> = {
  shade: 'minimal sun/shade', slope: 'sloping terrain',
  'limited-time': 'limited time in garden', 'limited-space': 'limited space',
  'vegs-herbs-fruit': 'vegetables, herbs and fruit trees', 'medicinal-herbs': 'medicinal & culinary herbs',
  orchard: 'an orchard', 'native-planting': 'significant native planting',
  'subtropical-trees': 'subtropical trees', 'food-forest': 'a food forest',
  'hot-compost': 'hot composting', 'cold-compost': 'cold composting', 'worm-farm': 'worm farming',
  'no-dig': 'no-dig beds', chickens: 'chickens', bees: 'bees',
  'animals-other': 'other animals', 'diy-upcycle': 'DIY and upcycle structures',
  'water-systems': 'water collection systems', 'community-wellbeing': 'community and cultural elements',
  'home-production': 'home production', permaculture: 'permaculture/organic methodology',
  'unusual-plants': 'unusual plant species',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  'private-property': 'private backyard',
  'community-garden': 'community garden',
  'school-garden': 'school garden',
  'build': 'sustainable build',
  'farm': 'farm',
  'lifestyle-block': 'lifestyle block',
};

function buildPromptContext(data: FormData): string {
  const propertyLabel = PROPERTY_TYPE_LABELS[data.propertyType] || 'property';
  const host = data.hostNames || 'the host';
  const name = data.propertyName || 'this property';
  const size = data.propertySize || '';
  const suburb = data.suburb || '';
  const since = data.yearEstablished || '';
  const brief = data.briefDescription || '';
  const notes = data.featuresNotes || '';
  const sustainability = data.sustainabilityFeatures || '';

  const featureLabels = data.features
    .map(f => FEATURE_LABELS[f])
    .filter(Boolean);

  return [
    `Property name: ${name}`,
    `Host name: ${host}`,
    `Property type: ${propertyLabel}`,
    size && `Size: ${size}`,
    suburb && `Location: ${suburb}`,
    since && `Established: ${since}`,
    featureLabels.length > 0 && `Features: ${featureLabels.join(', ')}`,
    brief && `Brief description: ${brief}`,
    notes && `Additional notes: ${notes}`,
    sustainability && `Sustainability features: ${sustainability}`,
  ].filter(Boolean).join('\n');
}

async function generateAIDescription(data: FormData): Promise<string | null> {
  const context = buildPromptContext(data);
  const isTour = isTourType(data.propertyType);
  const fieldHint = isTour
    ? 'Generate a concise property description for the Sustainable Trails 2026 event programme. Format: 4-6 one-sentence bullet points outlining the sustainable features of the property. Focus on specifics and avoid generic language. Do not invent details not provided.'
    : 'Generate a concise property description (approx. 70-100 words, max 500 characters) for the Sustainable Trails 2026 event programme. Include the host first name(s), size of property, and challenges or standout features. Do not include property name or suburb. Write in a warm, descriptive style. Do not invent details not provided.';

  try {
    const response = await fetch('/.netlify/functions/tidy-field', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: context, fieldHint }),
    });
    if (response.ok) {
      const result = await response.json() as { tidied: string };
      return result.tidied;
    }
  } catch {
    // Fall through to return null
  }
  return null;
}

// Simple fallback draft when AI is unavailable
function buildFallbackDraft(data: FormData): string {
  const propertyLabel = PROPERTY_TYPE_LABELS[data.propertyType] || 'property';
  const host = data.hostNames || data.propertyName || 'Our hosts';
  const name = data.propertyName || 'This property';
  const size = data.propertySize ? ` ${data.propertySize}` : '';
  const suburb = data.suburb ? ` in ${data.suburb}` : '';
  const since = data.yearEstablished ? ` (${data.yearEstablished})` : '';

  const featureLabels = data.features
    .map(f => FEATURE_LABELS[f])
    .filter(Boolean);

  let featureStr = '';
  if (featureLabels.length === 1) {
    featureStr = ` featuring ${featureLabels[0]}`;
  } else if (featureLabels.length > 1) {
    featureStr = ` featuring ${featureLabels.slice(0, -1).join(', ')} and ${featureLabels[featureLabels.length - 1]}`;
  }

  const intro = `${name} is a${size} ${propertyLabel}${suburb}${featureStr}${since}.`;
  const hostLine = host && host !== name ? ` Tended by ${host}.` : '';
  const brief = data.briefDescription ? ` ${data.briefDescription}` : '';

  return (intro + hostLine + brief).trim();
}

function ExpectedFormat({ propertyType }: { propertyType: string }) {
  const isTour = isTourType(propertyType);

  if (isTour) {
    return (
      <div className="bg-surface rounded-xl p-4 text-xs text-text-secondary space-y-1">
        <p className="font-semibold text-text-primary text-sm mb-1">Expected format</p>
        <p><strong>Features:</strong> Consolidate into 4–6 one-sentence bullet points outlining sustainable features.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-4 text-xs text-text-secondary space-y-1">
      <p className="font-semibold text-text-primary text-sm mb-1">Expected format</p>
      <p>Host first name(s), size of property, challenges and/or standout features.</p>
      <p className="font-medium text-text-primary mt-1">Max 500 characters (approx. 70–100 words)</p>
      <p className="mt-2 italic leading-relaxed">
        Example: Jen transformed a grassy 400msq section into a small thriving space. Native planting leads into a productive garden full of vegetables, herbs, and fruit trees—including an uncommon finger lime variety. The property features an in-ground worm tunnel, cold composting, hugelkultur and no-dig beds, Highline Brown chooks and Muscovy ducks. DIY and upcycled structures include a fish bench, wood storage, outdoor bath, garden shed, and gravity-fed water collection.
      </p>
      <p className="mt-2 text-text-secondary italic">Note: Booklet text may vary but a proof will be provided.</p>
    </div>
  );
}

export default function StepUnique({ data, errors: _errors, onChange }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-generate a draft on first visit if the field is empty
  useEffect(() => {
    if (!data.whatMakesUnique) {
      handleGenerate();
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate() {
    setIsGenerating(true);
    const aiResult = await generateAIDescription(data);
    if (aiResult) {
      onChange('whatMakesUnique', aiResult);
    } else {
      onChange('whatMakesUnique', buildFallbackDraft(data));
    }
    setIsGenerating(false);
  }

  const category = getPropertyCategory(data.propertyType);
  const isTour = isTourType(data.propertyType);

  const introText = isTour
    ? "We've generated a description from your answers. Edit where needed. Please check it matches the expected format. Booklet text may vary but a proof will be provided."
    : "We've generated a description from your answers. Edit where needed. Please check it matches the expected format. Booklet text may vary but a proof will be provided.";

  const fieldLabel = isTour
    ? (category === 'build' ? 'Your build description' : category === 'farm' ? 'Your farm description' : 'Your property description')
    : 'Your property description';

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm">
        {introText}
      </p>

      <ExpectedFormat propertyType={data.propertyType} />

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="whatMakesUnique">
          {fieldLabel}
        </label>
        <VoiceInput
          id="whatMakesUnique"
          value={data.whatMakesUnique}
          onChange={v => onChange('whatMakesUnique', v)}
          rows={8}
          fieldHint={
            isTour
              ? "4-6 one-sentence bullet points outlining the sustainable features of the property for the Sustainable Trails 2026 programme"
              : "a concise property description (max 500 characters) for the Sustainable Trails 2026 event programme — include host first name, size, features (no property name or suburb)"
          }
        />
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="text-sm text-primary hover:underline disabled:opacity-50 flex items-center gap-1.5"
      >
        {isGenerating ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Generating description…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Re-generate description from my answers
          </>
        )}
      </button>
    </div>
  );
}
