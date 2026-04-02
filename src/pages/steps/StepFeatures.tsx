import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';
import { getPropertyCategory } from '../../types/form';
import VoiceInput from '../../components/VoiceInput';

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
}: {
  group: FeatureGroup;
  selected: string[];
  onChange: (values: string[]) => void;
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
      <p className="text-sm font-semibold text-text-primary mb-2">{group.title}</p>
      <div className="space-y-1.5">
        {group.options.map(({ value, label }) => (
          <label
            key={value}
            className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-surface transition-colors min-h-[44px]"
          >
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => toggle(value)}
              className="w-5 h-5 accent-primary shrink-0"
            />
            <span className="text-sm text-text-primary leading-snug">{label}</span>
          </label>
        ))}
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
        <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="featuresNotes">
          Sustainability features
        </label>
        <div className="text-xs text-text-secondary mb-3 space-y-2">
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
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="briefDescription">
          {briefDesc.label} <span className="text-text-secondary font-normal">(optional)</span>
        </label>
        <p className="text-xs text-text-secondary mb-2">
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

  // Builds, farms, and lifestyle blocks use a text-based flow
  if (category === 'build' || category === 'farm' || category === 'lifestyle-block') {
    return <TourTypeFeatures data={data} onChange={onChange} />;
  }

  // Backyards use checkboxes + clarification notes
  const briefDesc = getBriefDescriptionText(data.propertyType);

  return (
    <div className="space-y-6">
      <p className="text-text-secondary text-sm">
        What features does your property have? Tick everything that applies.
      </p>

      {BACKYARD_FEATURE_GROUPS.map(group => (
        <CheckboxGroup
          key={group.title}
          group={group}
          selected={data.features}
          onChange={values => onChange('features', values)}
        />
      ))}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="featuresNotes">
          Additional details <span className="text-text-secondary font-normal">(optional)</span>
        </label>
        <p className="text-xs text-text-secondary mb-2">
          Provide specifics and additional details for the above features. E.g.
          <br />In-ground worm tunnel.
          <br />Three highline browns, two muscovey ducks.
          <br />DIY / upcycled fish bench, wood storage, outdoor bath, garden shed, garden bed edging.
          <br />Water collection off house roof, gravity feed to dry garden beds.
          <br />Home production of fruit preserves, pickles, preserved eggs and meat.
          <br />Garden beds include hugelkultur, no-dig.
          <br />Permaculture principles throughout.
          <br />Uncommon variety of lime — finger lime — great garnish & flavour.
        </p>
        <textarea
          id="featuresNotes"
          value={data.featuresNotes}
          onChange={e => onChange('featuresNotes', e.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="briefDescription">
          {briefDesc.label} <span className="text-text-secondary font-normal">(optional)</span>
        </label>
        <p className="text-xs text-text-secondary mb-2">
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
