import { useState } from 'react';
import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';
import { getPropertyCategory } from '../../types/form';

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

const MAIN_CATEGORIES: { value: string; label: string; description: string; hasSubTypes?: boolean }[] = [
  {
    value: 'backyard',
    label: 'Backyard',
    description: 'Residential backyards, community gardens, and school gardens',
    hasSubTypes: true,
  },
  {
    value: 'build',
    label: 'Build',
    description: 'Home, commercial, or public building',
  },
  {
    value: 'farm',
    label: 'Farm',
    description: 'Farm, commercial orchard, or market garden',
  },
  {
    value: 'lifestyle-block',
    label: 'Lifestyle block',
    description: 'A lifestyle block or homestead (Part of Farms Trail not Backyards Trail)',
  },
];

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
      <p className="text-text-secondary text-sm">
        Which best describes your property? (Fill in each section that applies to you)
      </p>

      <div className="space-y-3">
        {MAIN_CATEGORIES.map(({ value, label, description, hasSubTypes }) => {
          const isSelected = hasSubTypes
            ? currentCategory === value
            : data.propertyType === value;
          const isExpanded = hasSubTypes && expanded === value;

          return (
            <div key={value}>
              <label
                className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors min-h-[64px] ${
                  isSelected
                    ? 'border-primary bg-secondary/30'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleCategoryClick(value, hasSubTypes);
                }}
              >
                <input
                  type="radio"
                  name="propertyCategory"
                  value={value}
                  checked={isSelected}
                  readOnly
                  className="w-5 h-5 accent-primary shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-semibold text-text-primary">{label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{description}</p>
                </div>
                {hasSubTypes && (
                  <svg
                    className={`w-4 h-4 ml-auto shrink-0 mt-1 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
              </label>

              {/* Sub-type options for Backyards */}
              {hasSubTypes && isExpanded && (
                <div className="ml-6 mt-2 space-y-2">
                  {BACKYARD_SUB_TYPES.map((sub) => (
                    <label
                      key={sub.value}
                      className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors min-h-[52px] ${
                        data.propertyType === sub.value
                          ? 'border-primary bg-secondary/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="propertyType"
                        value={sub.value}
                        checked={data.propertyType === sub.value}
                        onChange={() => handleSubTypeClick(sub.value)}
                        className="w-4 h-4 accent-primary shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{sub.label}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{sub.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
