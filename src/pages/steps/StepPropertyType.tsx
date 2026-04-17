import { useState } from 'react';
import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';
import { getPropertyCategory } from '../../types/form';
import { getTrailCategory, type TrailCategory } from '../../utils/category';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
}

interface PropertyOption {
  value: string;
  label: string;
  description: string;
}

const BACKYARD_SUB_TYPES: PropertyOption[] = [
  {
    value: 'private-property',
    label: 'Private backyard',
    description: 'A residential property with a garden or outdoor growing space',
  },
  {
    value: 'community-garden',
    label: 'Community garden',
    description: 'A shared garden space open to the community',
  },
  {
    value: 'school-garden',
    label: 'School garden',
    description: 'A garden based at a school',
  },
];

// Each category mapped to the Trails brand accent it lives under.
// Lifestyle-block sits on the Farms Trail per the 2026 brand guide.
const MAIN_CATEGORIES: {
  value: string;
  label: string;
  description: string;
  hasSubTypes?: boolean;
  trail: TrailCategory;
}[] = [
  {
    value: 'backyard',
    label: 'Backyard',
    description: 'Residential backyards, community gardens, and school gardens',
    hasSubTypes: true,
    trail: 'backyards',
  },
  {
    value: 'build',
    label: 'Build',
    description: 'Home, commercial, or public building',
    trail: 'builds',
  },
  {
    value: 'farm',
    label: 'Farm',
    description: 'Farm, commercial orchard, or market garden',
    trail: 'farms',
  },
  {
    value: 'lifestyle-block',
    label: 'Lifestyle block',
    description: 'A lifestyle block or homestead (part of the Farms Trail)',
    trail: 'farms',
  },
];

const TRAIL_COLOURS: Record<TrailCategory, { accent: string; soft: string }> = {
  backyards: { accent: '#4C9A2A', soft: '#DCEED0' },
  builds: { accent: '#B64A2A', soft: '#F3D9CC' },
  farms: { accent: '#C98A1D', soft: '#F5E6C9' },
};

export default function StepPropertyType({ data, errors: _errors, onChange }: Props) {
  const currentCategory = getPropertyCategory(data.propertyType);
  const [expanded, setExpanded] = useState<string>(currentCategory || '');

  const handleCategoryClick = (categoryValue: string, hasSubTypes?: boolean) => {
    if (hasSubTypes) {
      setExpanded(prev => (prev === categoryValue ? '' : categoryValue));
    } else {
      setExpanded('');
      onChange('propertyType', categoryValue);
    }
  };

  const handleSubTypeClick = (subValue: string) => {
    onChange('propertyType', subValue);
  };

  return (
    <div className="space-y-4">
      <p className="text-ink-soft text-[14px]">
        Which best describes your property? Your pick colours the rest of the
        journey so you know which trail you're on.
      </p>

      <div className="space-y-3">
        {MAIN_CATEGORIES.map(({ value, label, description, hasSubTypes, trail }) => {
          const isSelected = hasSubTypes
            ? currentCategory === value
            : data.propertyType === value;
          const isExpanded = hasSubTypes && expanded === value;
          const { accent, soft } = TRAIL_COLOURS[trail];

          return (
            <div key={value}>
              <button
                type="button"
                onClick={() => handleCategoryClick(value, hasSubTypes)}
                className="w-full text-left flex items-start gap-3 p-4 rounded-[14px] transition-all min-h-[64px] border-[1.5px]"
                style={{
                  borderColor: isSelected ? accent : 'var(--color-line)',
                  backgroundColor: isSelected ? soft : 'var(--color-paper)',
                }}
              >
                <span
                  aria-hidden
                  className="mt-1 shrink-0 w-4 h-4 rounded-full border-[1.5px] relative"
                  style={{ borderColor: isSelected ? accent : 'var(--color-line)' }}
                >
                  {isSelected && (
                    <span
                      className="absolute inset-[3px] rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className="text-[14px] font-semibold"
                      style={{ color: isSelected ? accent : 'var(--color-ink)' }}
                    >
                      {label}
                    </p>
                    <span
                      className="inline-flex items-center h-5 px-2 rounded-full uppercase tracking-[0.14em] text-[10px] font-semibold"
                      style={{ backgroundColor: soft, color: accent }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mr-1"
                        style={{ backgroundColor: accent }}
                        aria-hidden
                      />
                      {trail}
                    </span>
                  </div>
                  <p className="text-[12px] text-ink-soft mt-0.5">{description}</p>
                </div>
                {hasSubTypes && (
                  <svg
                    className={`w-4 h-4 shrink-0 mt-1 text-ink-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                )}
              </button>

              {hasSubTypes && isExpanded && (
                <div className="ml-5 mt-2 space-y-2">
                  {BACKYARD_SUB_TYPES.map((sub) => {
                    const selected = data.propertyType === sub.value;
                    const subTrail = getTrailCategory(sub.value) || 'backyards';
                    const sub_c = TRAIL_COLOURS[subTrail];
                    return (
                      <button
                        type="button"
                        key={sub.value}
                        onClick={() => handleSubTypeClick(sub.value)}
                        className="w-full text-left flex items-start gap-3 p-3 rounded-[12px] transition-all min-h-[52px] border-[1.5px]"
                        style={{
                          borderColor: selected ? sub_c.accent : 'var(--color-line)',
                          backgroundColor: selected ? sub_c.soft : 'var(--color-paper)',
                        }}
                      >
                        <span
                          aria-hidden
                          className="mt-0.5 shrink-0 w-4 h-4 rounded-full border-[1.5px] relative"
                          style={{ borderColor: selected ? sub_c.accent : 'var(--color-line)' }}
                        >
                          {selected && (
                            <span
                              className="absolute inset-[3px] rounded-full"
                              style={{ backgroundColor: sub_c.accent }}
                            />
                          )}
                        </span>
                        <div>
                          <p
                            className="text-[13px] font-semibold"
                            style={{ color: selected ? sub_c.accent : 'var(--color-ink)' }}
                          >
                            {sub.label}
                          </p>
                          <p className="text-[12px] text-ink-soft mt-0.5">{sub.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
