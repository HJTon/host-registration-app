import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';
import { getPropertyCategory } from '../../types/form';
import VoiceInput from '../../components/VoiceInput';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
}

function sizeLabel(type: string): string {
  const cat = getPropertyCategory(type);
  if (cat === 'build') return 'How many square metres (sqm) is your build?';
  if (cat === 'farm') return 'Size and type of property?';
  if (cat === 'lifestyle-block') return 'Size and type of property?';
  if (type === 'school-garden') return 'How many meters or acres is your school garden/orchard area?';
  // private-property, community-garden
  return 'How many meters or acres is your property?';
}

function sizePlaceholder(type: string): string {
  const cat = getPropertyCategory(type);
  if (cat === 'build') return 'e.g. 120 sqm over one level';
  if (cat === 'farm') return 'e.g. 34ha with stocking rate of 3.1 dairy cows/ha; 7 acres with 500 feijoa trees';
  if (cat === 'lifestyle-block') return 'e.g. 10 acres, mixed use with orchard and market garden';
  if (type === 'school-garden') return 'e.g. 400 sqm raised beds and orchard area';
  return 'e.g. 0.25 acres; 600 sqm';
}

function establishedLabel(type: string): string {
  const cat = getPropertyCategory(type);
  if (cat === 'build') return 'How long have you been in the property?';
  if (cat === 'farm' || cat === 'lifestyle-block') return 'How long have you been working the land?';
  // Backyards (all sub-types)
  return 'Tell us briefly how long have you been developing this garden';
}

function establishedPlaceholder(type: string): string {
  const cat = getPropertyCategory(type);
  if (cat === 'build') return 'e.g. Moved in 2020 and renovated; Built new in 1990; Currently building';
  if (cat === 'farm' || cat === 'lifestyle-block') return "e.g. 5 years; It's been in the family 30 years";
  if (type === 'school-garden') return 'e.g. Started 2018, recently expanded raised beds';
  if (type === 'community-garden') return 'e.g. Founded 2015; new orchard planted 2022';
  return 'e.g. Bare section in 2010; started developing garden in 2022';
}

export default function StepPropertyDetails({ data, errors: _errors, onChange }: Props) {
  const category = getPropertyCategory(data.propertyType);
  const isBuild = category === 'build';
  const isFarmOrLifestyle = category === 'farm' || category === 'lifestyle-block';

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="propertySize">
          {sizeLabel(data.propertyType)}
        </label>
        <input
          id="propertySize"
          type="text"
          value={data.propertySize}
          onChange={e => onChange('propertySize', e.target.value)}
          placeholder={sizePlaceholder(data.propertyType)}
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green min-h-[52px]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="yearEstablished">
          {establishedLabel(data.propertyType)}
        </label>
        <input
          id="yearEstablished"
          type="text"
          value={data.yearEstablished}
          onChange={e => onChange('yearEstablished', e.target.value)}
          placeholder={establishedPlaceholder(data.propertyType)}
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green min-h-[52px]"
        />
      </div>

      {isBuild && (
        <div>
          <label className="block text-sm font-medium text-ink mb-1" htmlFor="buildOrigin">
            Did you build, renovate or purchase as is?
          </label>
          <input
            id="buildOrigin"
            type="text"
            value={data.buildOrigin}
            onChange={e => onChange('buildOrigin', e.target.value)}
            placeholder="e.g. New build completed 2022; Renovated 2019; Purchased as is"
            className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green min-h-[52px]"
          />
        </div>
      )}

      {isFarmOrLifestyle && (
        <div>
          <label className="block text-sm font-medium text-ink mb-1" htmlFor="sustainabilityFeatures">
            Other elements around ownership, management, cultural, or historical significance you'd like to share{' '}
            <span className="text-ink-soft font-normal">(optional)</span>
          </label>
          <p className="text-xs text-ink-soft mb-2">
            E.g. Farm Taranaki is a charitable trust focused on demonstration and education to ensure the viability of dairy farming.
          </p>
          <VoiceInput
            id="sustainabilityFeatures"
            value={data.sustainabilityFeatures}
            onChange={v => onChange('sustainabilityFeatures', v)}
            rows={4}
            fieldHint="cultural, historical, or ownership significance notes for a farm or lifestyle property"
          />
        </div>
      )}
    </div>
  );
}
