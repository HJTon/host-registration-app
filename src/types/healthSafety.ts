// Health & Safety form schemas — one declarative schema per trail type.
//
// The three official 2026 H&S Google Forms (Backyards, Builds, Farms) are
// encoded here as data so a single renderer (HSFormPage) can present all of
// them, and so prefill mapping from last year's responses is mechanical.
// Wording and options are transcribed verbatim from the published forms.
//
// Note: Lifestyle Blocks have their own form (a Farms copy with reworded copy)
// per the 2026 coordinator review.

export type HSType = 'backyards' | 'builds' | 'farms' | 'lifestyle';

// Resolve a registration property type to its H&S form. Lifestyle blocks have
// their own form (per the 2026 coordinator review); everything else maps to its
// trail type.
export function hsTypeForProperty(propertyType: string): HSType {
  if (propertyType === 'lifestyle-block') return 'lifestyle';
  if (propertyType === 'build') return 'builds';
  if (propertyType === 'farm') return 'farms';
  return 'backyards'; // private-property, community-garden, school-garden
}

// ── Section model ────────────────────────────────────────────────────────────
//
// A "hazard" section is a checkbox group (with None/Other) paired with a free
// text mitigation "plan". Field ids in HSResponse.fields follow conventions:
//   <id>          → string[]  (checkbox selections, also checkboxOnly)
//   <id>_other    → string    (free text when "Other" is ticked)
//   <id>_plan     → string    (mitigation plan paragraph for hazard sections)
// yesno / shortText / paragraph store a plain string under <id>.

export interface HazardSection {
  kind: 'hazard';
  id: string;
  label: string;
  help?: string;
  options: string[];
  planLabel: string;
  planHelp?: string;
}
export interface YesNoSection {
  kind: 'yesno';
  id: string;
  label: string;
  help?: string;
  yesLabel?: string;
  noLabel?: string;
}
export interface TextSection {
  kind: 'shortText' | 'paragraph';
  id: string;
  label: string;
  help?: string;
}
export interface CheckboxOnlySection {
  kind: 'checkboxOnly';
  id: string;
  label: string;
  help?: string;
  options: string[];
}
export interface InfoSection {
  kind: 'info';
  id: string;
  label: string;
  help?: string;
}
export interface AcknowledgementSection {
  kind: 'acknowledgement';
  id: string;
  label: string;
  intro?: string;
  clauses: string[];
}

export type HSSection =
  | HazardSection
  | YesNoSection
  | TextSection
  | CheckboxOnlySection
  | InfoSection
  | AcknowledgementSection;

export interface HSSchema {
  type: HSType;
  title: string;
  blurb: string;
  sections: HSSection[];
}

// ── Shared snippets ──────────────────────────────────────────────────────────

// Appended to every first-aid question (2026 coordinator review).
const FIRST_AID_NO_NOTE = ' If you choose No, that indicates Sustainable Taranaki will need to provide one.';

const FIRST_AID_HELP =
  "If not, and you're unable to borrow one for the week, please let us know. In the event of a serious injury you will call 111, then contact the Trails Co-coordinator as soon as practical. Contact details will be in your host pack." +
  FIRST_AID_NO_NOTE;

// "Concerns or Questions" free-text — replaces the old site-visit question on
// every form (2026 coordinator review).
const CONCERNS_HELP =
  'If you have any health and safety concerns or questions, let us know here or reach out to Mieke 021 022 39323, Suzy 021 566 185 or Jen 021 125 1727.';

const CONCERNS_SECTION = {
  kind: 'paragraph' as const,
  id: 'concerns',
  label: 'Concerns or Questions',
  help: CONCERNS_HELP,
};

// ── Backyards ────────────────────────────────────────────────────────────────

const BACKYARDS: HSSchema = {
  type: 'backyards',
  title: 'Backyard Host Health & Safety Assessment 2026',
  blurb:
    'This simple risk assessment helps garden hosts keep people safe during garden visits on the Trail. The purpose is to think about potential risks of having visitors on site and how to minimise, isolate or eliminate these. A health and safety sign will be in your host pack — you can write the risks that can’t be eliminated and display them at the front of your property.',
  sections: [
    {
      kind: 'hazard',
      id: 'parking',
      label: 'Parking and Vehicles',
      help: 'Thinking about vehicle movements, children visiting, less able visitors, and locating the property entrance — where will guests park?',
      options: ['On street', 'On highway/main road', 'In a paddock or other area on the property', 'Other'],
      planLabel: 'What is your plan for minimising or avoiding any hazards related to parking and vehicles?',
      planHelp:
        'Example: Parking on the highway — children and less abled visitors can be dropped off up the driveway. A ‘drop-off’ sign will be placed on the fence next to the letterbox.',
    },
    {
      kind: 'hazard',
      id: 'paths',
      label: 'Paths and surfaces',
      help: 'Think about elderly and the very young walking around your property. Are any of the following relevant?',
      options: [
        'Slippery',
        'Uneven surfaces eg no steps on slopes, protruding roots',
        'Holes, such as old post holes etc',
        'Steep gradients without steps',
        'None',
        'Other',
      ],
      planLabel: 'What is your plan for minimising or avoiding each hazard identified above?',
      planHelp:
        'Example: Slippery surface — brush area with a wire brush to remove moss; make a sign to let people know they are entering a slippery area; establish a temporary handrail etc.',
    },
    {
      kind: 'hazard',
      id: 'steps',
      label: 'Steps, handrails and drop offs',
      help: 'Think about elderly and the very young walking around your property. Are any of the following relevant?',
      options: ['Drop off greater than 1m that is not fenced', 'Unexpected drop offs', 'Steep steps without handrails', 'None', 'Other'],
      planLabel: 'What is your plan for minimising or avoiding each hazard identified above?',
      planHelp:
        'Example: No handrail on an area with a greater than 1m drop off — rope off the area; make a ‘beware of drop’ sign; explain the out-of-bounds area on arrival etc.',
    },
    {
      kind: 'hazard',
      id: 'water',
      label: 'Water hazards on the property',
      help: 'Think about children walking around your property. Are any of the following relevant?',
      options: ['Pool - unfenced', 'Lakes and ponds', 'Rivers or streams', 'None', 'Other'],
      planLabel: 'What is the plan for minimising or avoiding for each hazard identified above?',
      planHelp:
        'Example: Pond over 0.5m deep — let people know of the pond when entering and to mind children; make a ‘pond ahead, caution with children’ sign 20m ahead.',
    },
    {
      kind: 'hazard',
      id: 'other',
      label: 'Are there any other potential hazards?',
      options: [
        'Chemicals accessible',
        'Garden tools accessible, particularly with sharp blades.',
        'Animals that may potentially harm people eg dogs, horses, bulls, bees',
        'Low hanging or exposed power lines',
        'Machines in operation',
        'None',
        'Other',
      ],
      planLabel: 'What is the plan for minimising or avoiding for each hazard identified above?',
      planHelp:
        'Example: Bees on site — explain to visitors there are bees and their location on entry; have a ‘Do not walk in front of hive’ sign; keep your phone charged and call an ambulance if required.',
    },
    { kind: 'yesno', id: 'firstAid', label: 'Is there a first aid kit accessible on the property?', help: FIRST_AID_HELP },
    {
      kind: 'yesno',
      id: 'evacPoint',
      label: 'Do you have a designated Emergency Evacuation Point?',
      help: 'If yes, is this identified somehow for guests when entering the property?',
    },
    { kind: 'yesno', id: 'vehicleAccess', label: 'Is Emergency Vehicle access always available?' },
    {
      kind: 'acknowledgement',
      id: 'acknowledgement',
      label: 'By participating in the 2026 Sustainable Backyards Trail I acknowledge:',
      clauses: [
        'I am inviting members of the public onto my property during my nominated opening hours. During this time, I acknowledge that I am jointly responsible for people’s safety.',
        'Sustainable Taranaki does not assume responsibility for any damage to my property as a result of my participation in the 2026 Sustainable Backyards Trail.',
        'Visitors to my property are also responsible for their own safety – for acting with due caution on an unfamiliar property and for notifying me should they become aware of any potential hazards.',
        'I shall endeavour to the best of my ability to identify hazards and minimise risks to visitors.',
        'In the event of an incident occurring on my property, I agree to complete an incident form (to be provided to all hosts) and notify the Taranaki Sustainable Backyards Co-coordinator.',
      ],
    },
    CONCERNS_SECTION,
  ],
};

// ── Builds ───────────────────────────────────────────────────────────────────

const BUILDS: HSSchema = {
  type: 'builds',
  title: 'Builds Trail Health & Safety Assessment 2026',
  blurb:
    'This simple risk assessment helps Builds hosts keep people safe during visits on the Trail. Think about potential risks of having visitors on site and how to minimise, isolate or eliminate them. A health and safety sign will be in your host pack. Mieke, Suzy or an ST representative will aim to visit and walk through the build ahead of the Trail.',
  sections: [
    {
      kind: 'hazard',
      id: 'parking',
      label: 'Parking and Vehicles',
      help: 'Thinking about vehicle movements, children visiting, less able visitors, and locating the property entrance — where will guests park?',
      options: ['On street', 'On highway/main road', 'In a paddock or other area designated for parking', 'Other'],
      planLabel: 'What is your plan for minimising or avoiding any hazards related to parking and vehicles?',
      planHelp:
        'Example: Parking on the highway — children and less-able visitors can be dropped off up the driveway. A ‘drop-off’ sign will be placed on the fence next to the letterbox.',
    },
    {
      kind: 'hazard',
      id: 'paths',
      label: 'Outside paths and surfaces',
      help: 'Think about elderly and the very young walking around and inside your build. Are any of the following relevant?',
      options: [
        'Slippery surfaces',
        'Uneven surfaces eg no steps on slopes, protruding roots',
        'Holes, such as old post holes etc',
        'Steep gradients without steps',
        'None',
        'Other',
      ],
      planLabel: 'What is your plan for minimising or avoiding each hazard identified above?',
      planHelp:
        'Example: Slippery surface — brush area with a wire brush to remove moss; make a sign; establish a temporary handrail etc.',
    },
    {
      kind: 'hazard',
      id: 'steps',
      label: 'Steps, handrails and drop offs',
      help: 'Think about elderly and the very young walking around your property. Are any of the following relevant?',
      options: ['Drop off greater than 1m that is not fenced', 'Unexpected drop offs', 'Steep steps without handrails', 'None', 'Other'],
      planLabel: 'What is your plan for minimising or avoiding each hazard identified above?',
      planHelp:
        'Example: No handrail on an area with a greater than 1m drop off — rope off the area; make a ‘beware of drop’ sign; explain on arrival etc.',
    },
    {
      kind: 'hazard',
      id: 'other',
      label: 'Are there any other potential hazards?',
      options: [
        'Chemicals accessible e.g. bleach under kitchen sink',
        'Tools accessible, particularly with sharp blades.',
        'Animals that may potentially harm people e.g. dogs',
        'Water hazard e.g. unfenced pool',
        'None',
        'Other',
      ],
      planLabel: 'What is the plan for minimising or avoiding for each hazard identified above?',
      planHelp: 'Example: Chemicals under sink — put in a box and store up high for the tour.',
    },
    { kind: 'yesno', id: 'firstAid', label: 'Is there a first aid kit accessible on the property?', help: FIRST_AID_HELP },
    {
      kind: 'yesno',
      id: 'evacPoint',
      label: 'Do you have a designated Emergency Evacuation Point?',
      help: 'If yes, is this identified somehow for guests when entering the property?',
    },
    { kind: 'yesno', id: 'vehicleAccess', label: 'Is Emergency Vehicle access always available?' },
    {
      kind: 'info',
      id: 'publicInHome',
      label: 'Public in your home or property',
      help: 'We’d recommend looking around your home or build to ensure items of high value aren’t easily picked up (particularly by children), and that personal items you don’t want shared publicly (or captured in photos) are put away.',
    },
    {
      kind: 'acknowledgement',
      id: 'acknowledgement',
      label: 'By participating in the 2026 Sustainable Builds Trail I acknowledge:',
      clauses: [
        'I am inviting members of the public onto my property during my nominated opening hours. During this time, I acknowledge that I am jointly responsible for people’s safety.',
        'Sustainable Taranaki does not assume responsibility for any damage to my property as a result of my participation in the 2026 Sustainable Builds Trail.',
        'Visitors to my property are also responsible for their own safety – for acting with due caution on an unfamiliar property and for notifying me should they become aware of any potential hazards.',
        'I shall endeavour to the best of my ability to identify hazards and minimise risks to visitors.',
        'In the event of an incident occurring on my property, I agree to complete an incident form (to be provided to all hosts) and notify the Sustainable Trails Co-coordinator.',
        'Sustainable Taranaki has offered to assist me, the property owner, to identify hazards and mitigate risks to the public.',
      ],
    },
    CONCERNS_SECTION,
  ],
};

// ── Farms ────────────────────────────────────────────────────────────────────

const FARMS: HSSchema = {
  type: 'farms',
  title: 'Farm Host Health & Safety Assessment 2026',
  blurb:
    'This risk assessment supports FARM HOSTS to keep visitors safe during their visit to your farm or commercial growing facility. The purpose is to identify hazards and risks of touring visitors, assess how likely each risk is and how severe the harm would be, and implement reasonably practical measures to manage risk.',
  sections: [
    {
      kind: 'checkboxOnly',
      id: 'parking',
      label: 'Parking and capacity',
      help: 'Where will visitors park?',
      options: ['On street', 'On highway/main road', 'In a paddock or other area on the property', 'Other'],
    },
    { kind: 'shortText', id: 'vehicleCapacity', label: 'What is the approximate capacity for vehicles?' },
    {
      kind: 'paragraph',
      id: 'parkingToTour',
      label: 'Parking to start/end of tour',
      help: 'Basic instructions can be sent in a ‘Before you visit’ email, but signage or a volunteer may be necessary. What is your plan for managing risk for people moving between parking and the start/end of the tour?',
    },
    {
      kind: 'checkboxOnly',
      id: 'ageSuitability',
      label: 'Suitability for age groups',
      help: 'Farm and commercial growing tours will not necessarily be suitable for all age groups. Is your tour/activity suitable for the below?',
      options: [
        'Young children are suitable visitors',
        'Older children are suitable visitors',
        'Elderly or mobility challenges are suitable visitors',
        'Adults with reasonable mobility are suitable visitors',
        'Other',
      ],
    },
    {
      kind: 'paragraph',
      id: 'clothingFootwear',
      label: 'Appropriate clothing & footwear — please list what footwear and clothing is required for visitors',
      help: 'e.g. sneakers, or gumboots or tramping boots with tread. Warm jumper and wind/rain jacket.',
    },
    {
      kind: 'hazard',
      id: 'trails',
      label: 'Trails, paths and surfaces',
      help: 'Think about pathways between and at tour locations. Are any of the following relevant to your tour/s?',
      options: [
        'Slippery surfaces',
        'Uneven surfaces eg paddocks, no steps on slopes, protruding roots',
        'Hidden holes e.g. from rabbits or old post holes etc',
        'Steep gradients without steps',
        'None',
        'Other',
      ],
      planLabel: 'What is your plan for minimising or avoiding each hazard identified above?',
      planHelp:
        'e.g. Paddock trail — warn visitors to be careful of footing; point out major hazards; take a walking pole for use if needed.',
    },
    {
      kind: 'hazard',
      id: 'steepSteps',
      label: 'Steep steps, slopes and drop-offs',
      help: 'Think about pathways between and at tour locations. Are any of the following relevant?',
      options: ['Drop off greater than 1m that is not fenced', 'Unexpected drop-offs', 'Steep steps without handrails', 'None', 'Other'],
      planLabel: 'What is your plan for minimising or avoiding each hazard identified above?',
      planHelp: 'e.g. No handrail next to a steep drop off — rope off the area; make a ‘beware of drop’ sign; explain on arrival.',
    },
    {
      kind: 'hazard',
      id: 'water',
      label: 'Water hazards',
      help: 'Think about pathways between and at tour locations. Are any of the following relevant?',
      options: ['Accessible lakes or ponds', 'Accessible rivers or streams', 'None', 'Other'],
      planLabel: 'What is the plan for minimising or avoiding for each hazard identified above?',
      planHelp:
        'e.g. Waterway — collect water samples for those without suitable footwear; point out safe areas; avoid after heavy rain or flooding.',
    },
    {
      kind: 'hazard',
      id: 'animals',
      label: 'Animals, livestock & animal related equipment',
      help: 'Think about pathways between and at tour locations. Are any of the following relevant?',
      options: [
        'Animals roaming',
        'Accessible platforms or equipment used with animals',
        'Disease passed from touching of animals',
        'None',
        'Other',
      ],
      planLabel: 'What is the plan for minimising or avoiding for each hazard identified above?',
      planHelp:
        'e.g. Cows — ask people to refrain from quick movements or loud noises; keep animals behind electric fence or gates. Provide hand sanitiser after touching animals.',
    },
    {
      kind: 'hazard',
      id: 'machinery',
      label: 'Machinery and chemicals',
      help: 'Think about pathways between and at tour locations. Are any of the following relevant?',
      options: [
        'Machinery in operation',
        'Crushing hazards',
        'Chemicals accessible',
        'Agricultural tools accessible, particularly with sharp blades.',
        'None',
        'Other',
      ],
      planLabel: 'What is the plan for minimising or avoiding for each hazard identified above?',
      planHelp:
        'e.g. Clearly mark demonstration areas to keep visitors away from moving machinery; make static displays safe; triple-check keys aren’t in vehicles.',
    },
    {
      kind: 'hazard',
      id: 'biosecurity',
      label: 'Biosecurity',
      help: 'Think about entry onto the property and between locations. Are any of the following relevant?',
      options: [
        'Risk of disease or invasive species from outside farm transferred to livestock',
        'Risk of disease or invasive species from outside farm transferred to plant species',
        'None',
        'Other',
      ],
      planLabel: 'What is the plan for minimising or avoiding each BIOSECURITY hazard identified above?',
      planHelp:
        'e.g. Have one clear entry point into the property; use a footbath for all visitors; request that food not be brought onsite.',
    },
    {
      kind: 'hazard',
      id: 'other',
      label: 'Are there any OTHER potential hazards?',
      help: 'Think about pathways between and at tour locations. Are any of the following relevant?',
      options: ['Low hanging or exposed power lines', 'Accessible farm rubbish', 'None', 'Other'],
      planLabel: 'What is the plan for minimising or avoiding for each hazard identified above?',
      planHelp: 'e.g. Rubbish and equipment stored away.',
    },
    {
      kind: 'yesno',
      id: 'firstAid',
      label: 'Is there a first aid kit accessible on the property?',
      help: "If not, and you're unable to borrow one for the tour, please let us know — you will need to arrange pick up. In the event of a serious injury you will call 111, then contact the Sustainable Trails Co-coordinator as soon as practical." + FIRST_AID_NO_NOTE,
      yesLabel: 'Yes',
      noLabel: 'No, I will arrange to pick up from Sustainable Taranaki.',
    },
    {
      kind: 'paragraph',
      id: 'emergencyPlan',
      label: 'Emergency plan',
      help: 'Ensure you know: where the closest mobile or landline coverage is along the tour; where the closest hospital or emergency service is; where an emergency vehicle can reach and how to transport a visitor there; and the plan should there be a fire or natural disaster during the tour.',
    },
    {
      kind: 'acknowledgement',
      id: 'acknowledgement',
      label: 'By participating in the 2026 Sustainable Farms Trail I acknowledge:',
      intro:
        'Farmers must ensure that work areas on the farm are safe and don’t pose a risk to the health and safety of any person. People visiting a farm have a responsibility to take reasonable care that their actions (or lack of action) do not put themselves or others at risk, and must comply with any reasonable instruction given by the farmer (Worksafe guide: Farm visitors & events).',
      clauses: [
        'I am jointly responsible for people’s safety.',
        'Visitors to my property are also responsible for their own safety.',
        'I have taken reasonably practicable steps to make my property safe for visitors.',
        'In the event of an incident occurring on my property, I agree to complete an incident form (to be provided to all hosts) and notify the Sustainable Trails Co-coordinator.',
        'Sustainable Taranaki does not assume responsibility for any damage to my property as a result of my participation in the Sustainable Farms Trail.',
        'Sustainable Taranaki has offered to assist me, the property owner, to identify hazards and mitigate risks to the public.',
        'Public liability insurance is not required but recommended.',
      ],
    },
    CONCERNS_SECTION,
  ],
};

// ── Lifestyle Blocks ─────────────────────────────────────────────────────────
// Its own form (2026 coordinator review): the Farms schema with "Farm" copy
// reworded to "Lifestyle Block". Field ids stay identical to Farms so the
// renderer, prefill and sheet columns reuse the same structure.

function lifestyleSection(section: HSSection): HSSection {
  if (section.kind === 'checkboxOnly' && section.id === 'ageSuitability') {
    return {
      ...section,
      help: 'Lifestyle Block tours will not necessarily be suitable for all age groups. Is your tour/activity suitable for the below?',
    };
  }
  if (section.kind === 'acknowledgement') {
    return {
      ...section,
      label: 'By participating in the 2026 Sustainable Lifestyle Block Trail I acknowledge:',
      intro:
        'Lifestyle Block owners must ensure that work areas on the lifestyle block are safe and don’t pose a risk to the health and safety of any person. People visiting a lifestyle block have a responsibility to take reasonable care that their actions (or lack of action) do not put themselves or others at risk, and must comply with any reasonable instruction given by the owner (Worksafe guide: Farm visitors & events).',
      clauses: section.clauses.map(c =>
        c.replace('participation in the Sustainable Farms Trail.', 'participation in the Sustainable Lifestyle Block Trail.'),
      ),
    };
  }
  return section;
}

const LIFESTYLE: HSSchema = {
  type: 'lifestyle',
  title: 'Lifestyle Block Host Health & Safety Assessment 2026',
  blurb:
    'This risk assessment supports LIFESTYLE BLOCK HOSTS to keep visitors safe during their visit to your Lifestyle Block. The purpose is to identify hazards and risks of touring visitors, assess how likely each risk is and how severe the harm would be, and implement reasonably practical measures to manage risk.',
  sections: FARMS.sections.map(lifestyleSection),
};

export const HS_SCHEMAS: Record<HSType, HSSchema> = {
  backyards: BACKYARDS,
  builds: BUILDS,
  farms: FARMS,
  lifestyle: LIFESTYLE,
};

export function getHSSchema(type: HSType): HSSchema {
  return HS_SCHEMAS[type];
}

// ── Response model ───────────────────────────────────────────────────────────

export type HSFieldValue = string | string[];

export interface HSResponse {
  submissionId: string;
  hsType: HSType;
  linkedRegistrationId?: string;
  // Identity
  email: string;
  name: string;            // host name(s)
  propertyName: string;
  propertyAddress: string;
  // Answers keyed by field id (see conventions above)
  fields: Record<string, HSFieldValue>;
  // Signing
  acknowledged: boolean;
  signatureName: string;
  signedAt: string;        // ISO
  submittedAt: string;     // ISO
}

export function getInitialHSFields(type: HSType): Record<string, HSFieldValue> {
  const fields: Record<string, HSFieldValue> = {};
  for (const section of HS_SCHEMAS[type].sections) {
    switch (section.kind) {
      case 'hazard':
        fields[section.id] = [];
        fields[`${section.id}_other`] = '';
        fields[`${section.id}_plan`] = '';
        break;
      case 'checkboxOnly':
        fields[section.id] = [];
        fields[`${section.id}_other`] = '';
        break;
      case 'yesno':
      case 'shortText':
      case 'paragraph':
        fields[section.id] = '';
        break;
      case 'info':
      case 'acknowledgement':
        break;
    }
  }
  return fields;
}

// Human-readable label for each H&S form type.
export const HS_TYPE_LABELS: Record<HSType, string> = {
  backyards: 'Backyards',
  builds: 'Builds',
  farms: 'Farms',
  lifestyle: 'Lifestyle Blocks',
};
