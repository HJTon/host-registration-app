// Maps the user's selected propertyType to a Trails brand category
// (one of the three trail types shown on sustainabletrails.org.nz).
// Used to tint the rest of the journey with the category's accent colour.

import { getPropertyCategory } from '../types/form';

export type TrailCategory = 'backyards' | 'builds' | 'farms';

export interface CategoryTheme {
  key: TrailCategory;
  label: string;
  // Raw hex — for inline styles (gradients, SVG fills, etc.)
  accent: string;
  soft: string;
  // Pre-composed Tailwind class bundles for the common patterns
  chipClass: string;     // background + text for small chips/pills
  borderClass: string;   // selected-state border colour
  softBgClass: string;   // soft tint background
  textClass: string;     // accent foreground text
  ringClass: string;     // focus ring / hover ring
}

const THEMES: Record<TrailCategory, CategoryTheme> = {
  backyards: {
    key: 'backyards',
    label: 'Backyards',
    accent: '#4C9A2A',
    soft: '#DCEED0',
    chipClass: 'bg-backyards-soft text-backyards',
    borderClass: 'border-backyards',
    softBgClass: 'bg-backyards-soft',
    textClass: 'text-backyards',
    ringClass: 'ring-backyards',
  },
  builds: {
    key: 'builds',
    label: 'Builds',
    accent: '#B64A2A',
    soft: '#F3D9CC',
    chipClass: 'bg-builds-soft text-builds',
    borderClass: 'border-builds',
    softBgClass: 'bg-builds-soft',
    textClass: 'text-builds',
    ringClass: 'ring-builds',
  },
  farms: {
    key: 'farms',
    label: 'Farms',
    accent: '#C98A1D',
    soft: '#F5E6C9',
    chipClass: 'bg-farms-soft text-farms',
    borderClass: 'border-farms',
    softBgClass: 'bg-farms-soft',
    textClass: 'text-farms',
    ringClass: 'ring-farms',
  },
};

// Neutral/fallback theme — used before the user has picked a property type
// (category accent defaults to the primary bright green).
const NEUTRAL: CategoryTheme = {
  key: 'backyards',
  label: 'Trails',
  accent: '#65B32E',
  soft: '#E9F3DC',
  chipClass: 'bg-brand-green-soft text-brand-green-deep',
  borderClass: 'border-brand-green',
  softBgClass: 'bg-brand-green-soft',
  textClass: 'text-brand-green-deep',
  ringClass: 'ring-brand-green',
};

export function getTrailCategory(propertyType: string): TrailCategory | '' {
  const cat = getPropertyCategory(propertyType);
  if (cat === 'backyard') return 'backyards';
  if (cat === 'build') return 'builds';
  // Lifestyle blocks sit on the Farms Trail per the 2026 brand guide
  if (cat === 'farm' || cat === 'lifestyle-block') return 'farms';
  return '';
}

export function getCategoryTheme(propertyType: string): CategoryTheme {
  const trail = getTrailCategory(propertyType);
  if (!trail) return NEUTRAL;
  return THEMES[trail];
}

export { NEUTRAL as neutralTheme };
