import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';
import { getPropertyCategory } from '../../types/form';
import VoiceInput from '../../components/VoiceInput';
import { Divider, Field, Textarea } from '../../components/ui';
import { getCategoryTheme } from '../../utils/category';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
}

interface FeatureOption {
  value: string;
  label: string;
}

interface FeatureGroup {
  title: string;
  options: FeatureOption[];
}

const BACKYARD_FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: 'Challenges of your property',
    options: [
      { value: 'shade', label: 'Minimal sun / lots of shade' },
      { value: 'slope', label: 'Steep or sloping terrain' },
      { value: 'limited-time', label: 'Limited time in garden' },
      { value: 'limited-space', label: 'Limited space' },
    ],
  },
  {
    title: 'Variety of gardens & produce',
    options: [
      { value: 'vegs-herbs-fruit', label: 'Vegetables, herbs and fruit trees' },
      { value: 'medicinal-herbs', label: 'Wide range of medicinal & culinary herbs' },
      { value: 'orchard', label: 'Orchard (e.g. fruit, nut) — specify below' },
      { value: 'native-planting', label: 'Significant native planting' },
      { value: 'subtropical-trees', label: 'Wide range of subtropical trees' },
      { value: 'food-forest', label: 'Food forest (mixed plantings)' },
    ],
  },
  {
    title: 'Integration, soil & nutrient creation',
    options: [
      { value: 'hot-compost', label: 'Hot composting set-up' },
      { value: 'cold-compost', label: 'Cold compost (add to regularly)' },
      { value: 'worm-farm', label: 'Worm farm (specify set-up below)' },
      { value: 'no-dig', label: 'No dig / lasagna layering / hugelkultur beds (specify below)' },
    ],
  },
  {
    title: 'Animals',
    options: [
      { value: 'chickens', label: 'Chickens' },
      { value: 'bees', label: 'Bees' },
      { value: 'animals-other', label: 'Other — specify below' },
    ],
  },
  {
    title: 'Other features',
    options: [
      { value: 'diy-upcycle', label: 'DIY and upcycle structures — specify below' },
      { value: 'water-systems', label: 'Water collection for garden use (specify system below)' },
      { value: 'community-wellbeing', label: 'Community well-being or cultural components (foodbank, maramataka, education) — please specify' },
      { value: 'home-production', label: 'Home production (preserves, fruit wine, hydrosols, oils, edible weeds, soaps, cleaners, fertilisers, firewood) — specify below' },
      { value: 'permaculture', label: 'Methodologies or approaches e.g. permaculture, companion planting, hugelkultur, agroforestry, organic — specify below' },
      { value: 'unusual-plants', label: 'Uncommon but useful plant species — specify below' },
    ],
  },
];

function CheckboxGroup({
  group,
  selected,
  onChange,
  accent,
  soft,
}: {
  group: FeatureGroup;
  selected: string[];
  onChange: (values: string[]) => void;
  accent: string;
  soft: string;
}) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value],
    );
  };

  return (
    <div>
      <Divider label={group.title} className="mb-3" />
      <div className="space-y-1.5">
        {group.options.map(({ value, label }) => {
          const checked = selected.includes(value);
          return (
            <label
              key={value}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] cursor-pointer transition-colors min-h-[44px] border"
              style={{
                borderColor: checked ? accent : 'var(--color-line)',
                backgroundColor: checked ? soft : 'var(--color-paper)',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-[6px] transition-colors"
                style={{
                  backgroundColor: checked ? accent : 'transparent',
                  border: checked ? `1.5px solid ${accent}` : '1.5px solid var(--color-line)',
                  color: '#fff',
                }}
              >
                {checked && (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span
                className="text-[14px] leading-snug"
                style={{
                  color: checked ? 'var(--color-brand-green-ink)' : 'var(--color-ink)',
                  fontWeight: checked ? 600 : 400,
                }}
              >
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function getBriefDescriptionText(propertyType: string): { label: string; helpText: string; fieldHint: string } {
  const category = getPropertyCategory(propertyType);
  if (category === 'build') {
    return {
      label: 'How your build is used',
      helpText: "2–3 sentences that capture how your build is used and any other important aspects — historical, cultural, community. E.g. The historic Egmont Chambers was creatively renovated into a home, cafe, roastery and distillery. Industrial features sit alongside a lot of art and plants.",
      fieldHint: '2-3 sentence description of how the build is used for the Sustainable Trails event programme',
    };
  }
  if (category === 'farm') {
    return {
      label: 'How your farm is used',
      helpText: "2–3 sentences that capture how your farm is used and any other important aspects — historical, cultural, community. E.g. Part of a 7-year trial testing diverse pasture systems. Kaitiakitanga and kaupapa Māori drives farm practices.",
      fieldHint: '2-3 sentence description of how the farm is used for the Sustainable Trails event programme',
    };
  }
  if (category === 'lifestyle-block') {
    return {
      label: 'How your land is used',
      helpText: "2–3 sentences that capture how your land is used and any other important aspects — historical, cultural, community. E.g. A multi-generational property involving the family working together. Kids are homeschooled and education integrated into land and home care.",
      fieldHint: '2-3 sentence description of how the lifestyle block is used for the Sustainable Trails event programme',
    };
  }
  return {
    label: 'Brief description of your garden',
    helpText: "1–2 sentences that capture your property's essence. E.g. A small space used creatively to combine aesthetics, natives, and edibles.",
    fieldHint: 'brief 1-2 sentence property description for the Sustainable Backyards event programme',
  };
}

// For builds/farms/lifestyle: show instructional text + large textarea instead of checkboxes
function TourTypeFeatures({ data, onChange }: { data: FormData; onChange: ChangeHandler }) {
  const category = getPropertyCategory(data.propertyType);
  const briefDesc = getBriefDescriptionText(data.propertyType);

  let introText = '';
  let exampleText = '';
  let bulletItems: string[] = [];

  if (category === 'build') {
    introText = 'Consider which of the following are relevant to your build. Note down as many of the specifics as you can. Where possible, note relevant local businesses involved.';
    exampleText = 'E.g. 7kw solar panels and string inverter set-up (Harrisons Solar) / Demolition and build included sorting waste streams (Clelands & Revive recyclers).';
    bulletItems = ['Design & location', 'Construction process', 'Use of particular materials', 'Energy / resource technology'];
  } else if (category === 'farm') {
    introText = 'Consider which of the following are relevant to your farm. Note down as many of the specifics as you can. Where possible, note relevant local businesses involved.';
    exampleText = 'E.g. 42kw solar panels, string inverter & 12kw battery set-up (FarmGen Solar).';
    bulletItems = ['Planting & land', 'Water management', 'Soil', 'Energy', 'Waste', 'Technology (GPS, sensors, smart tech, data-driven decisions, forecasting)'];
  } else {
    introText = 'Consider which of the following are relevant to your block of land. Note down as many of the specifics as you can. Where possible, note relevant local businesses involved.';
    exampleText = 'E.g. 42kw solar panels, string inverter & 12kw battery set-up (SolarOne).';
    bulletItems = ['Planting & land', 'Water management', 'Soil', 'Energy', 'Waste', 'Food production'];
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-ink mb-2" htmlFor="featuresNotes">
          Sustainability features
        </label>
        <div className="text-xs text-ink-soft mb-3 space-y-2">
          <p>{introText}</p>
          <p className="italic">{exampleText}</p>
          <ul className="list-disc list-inside space-y-0.5">
            {bulletItems.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <textarea
          id="featuresNotes"
          value={data.featuresNotes}
          onChange={e => onChange('featuresNotes', e.target.value)}
          rows={8}
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="briefDescription">
          {briefDesc.label} <span className="text-ink-soft font-normal">(optional)</span>
        </label>
        <p className="text-xs text-ink-soft mb-2">
          {briefDesc.helpText}
        </p>
        <VoiceInput
          id="briefDescription"
          value={data.briefDescription}
          onChange={v => onChange('briefDescription', v)}
          rows={3}
          fieldHint={briefDesc.fieldHint}
        />
      </div>
    </div>
  );
}

export default function StepFeatures({ data, errors: _errors, onChange }: Props) {
  const category = getPropertyCategory(data.propertyType);
  const theme = getCategoryTheme(data.propertyType);

  // Builds, farms, and lifestyle blocks use a text-based flow
  if (category === 'build' || category === 'farm' || category === 'lifestyle-block') {
    return <TourTypeFeatures data={data} onChange={onChange} />;
  }

  // Backyards use checkboxes + clarification notes
  const briefDesc = getBriefDescriptionText(data.propertyType);

  return (
    <div className="space-y-6">
      <p className="text-ink-soft text-[14px]">
        What features does your property have? Tick everything that applies.
      </p>

      {BACKYARD_FEATURE_GROUPS.map(group => (
        <CheckboxGroup
          key={group.title}
          group={group}
          selected={data.features}
          onChange={values => onChange('features', values)}
          accent={theme.accent}
          soft={theme.soft}
        />
      ))}

      <Field
        label="Additional details"
        htmlFor="featuresNotes"
        optional
        hint={
          <>
            Provide specifics and additional details for the above features. E.g. in-ground
            worm tunnel, three highline browns, DIY upcycled fish bench, water collection
            off house roof, fruit preserves, hugelkultur beds, finger-lime tree.
          </>
        }
      >
        <Textarea
          id="featuresNotes"
          value={data.featuresNotes}
          onChange={e => onChange('featuresNotes', e.target.value)}
          rows={6}
        />
      </Field>

      <Field
        label={briefDesc.label}
        htmlFor="briefDescription"
        optional
        hint={briefDesc.helpText}
      >
        <VoiceInput
          id="briefDescription"
          value={data.briefDescription}
          onChange={v => onChange('briefDescription', v)}
          rows={3}
          fieldHint={briefDesc.fieldHint}
        />
      </Field>
    </div>
  );
}
