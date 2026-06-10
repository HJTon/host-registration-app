// Shared Health & Safety sheet structure for the submit/update functions.
// Kept in a subdirectory so Netlify does not expose it as its own endpoint.
//
// Column definitions mirror src/types/healthSafety.ts. Each entry maps a field
// id from the client HSResponse to a sheet column. `kind`:
//   group → checkbox selections (array) + the field's _other free text
//   plan  → the paired mitigation paragraph stored at `${id}_plan`
//   value → a plain string field (yesno / shortText / paragraph)

export type HSType = 'backyards' | 'builds' | 'farms';
export type HSFieldValue = string | string[];

export interface HSSubmitBody {
  submissionId: string;
  hsType: HSType;
  linkedRegistrationId?: string;
  email: string;
  name: string;
  propertyName: string;
  propertyAddress: string;
  fields: Record<string, HSFieldValue>;
  acknowledged: boolean;
  signatureName: string;
  signedAt: string;
  submittedAt: string;
  // present on edits so we can detect a type change
  originalHsType?: HSType;
}

interface ColumnSpec {
  header: string;
  id: string;
  kind: 'group' | 'plan' | 'value';
}

// Helper to build a hazard pair (selections column + plan column).
function hazard(id: string, header: string): ColumnSpec[] {
  return [
    { header, id, kind: 'group' },
    { header: `${header} — Plan`, id, kind: 'plan' },
  ];
}

export const HS_COLUMNS: Record<HSType, ColumnSpec[]> = {
  backyards: [
    ...hazard('parking', 'Parking & Vehicles'),
    ...hazard('paths', 'Paths & Surfaces'),
    ...hazard('steps', 'Steps, Handrails & Drop-offs'),
    ...hazard('water', 'Water Hazards'),
    ...hazard('other', 'Other Hazards'),
    { header: 'First Aid Kit', id: 'firstAid', kind: 'value' },
    { header: 'Emergency Evacuation Point', id: 'evacPoint', kind: 'value' },
    { header: 'Emergency Vehicle Access', id: 'vehicleAccess', kind: 'value' },
    { header: 'New Host Site Visit', id: 'siteVisit', kind: 'value' },
  ],
  builds: [
    { header: 'Tour Outline', id: 'tourOutline', kind: 'value' },
    ...hazard('parking', 'Parking & Vehicles'),
    ...hazard('paths', 'Outside Paths & Surfaces'),
    ...hazard('steps', 'Steps, Handrails & Drop-offs'),
    ...hazard('other', 'Other Hazards'),
    { header: 'First Aid Kit', id: 'firstAid', kind: 'value' },
    { header: 'Emergency Evacuation Point', id: 'evacPoint', kind: 'value' },
    { header: 'Emergency Vehicle Access', id: 'vehicleAccess', kind: 'value' },
    { header: 'Site Visit', id: 'siteVisit', kind: 'value' },
  ],
  farms: [
    { header: 'Parking & Capacity', id: 'parking', kind: 'group' },
    { header: 'Vehicle Capacity', id: 'vehicleCapacity', kind: 'value' },
    { header: 'Parking to Tour Plan', id: 'parkingToTour', kind: 'value' },
    { header: 'Tour Outline', id: 'tourOutline', kind: 'value' },
    { header: 'Age Suitability', id: 'ageSuitability', kind: 'group' },
    { header: 'Clothing & Footwear', id: 'clothingFootwear', kind: 'value' },
    ...hazard('trails', 'Trails, Paths & Surfaces'),
    ...hazard('steepSteps', 'Steep Steps, Slopes & Drop-offs'),
    ...hazard('water', 'Water Hazards'),
    ...hazard('animals', 'Animals & Livestock'),
    ...hazard('machinery', 'Machinery & Chemicals'),
    ...hazard('biosecurity', 'Biosecurity'),
    ...hazard('other', 'Other Hazards'),
    { header: 'First Aid Kit', id: 'firstAid', kind: 'value' },
    { header: 'Emergency Plan', id: 'emergencyPlan', kind: 'value' },
    { header: 'Site Visit', id: 'siteVisit', kind: 'value' },
  ],
};

const LEADING_HEADERS = [
  'Submitted At',
  'Submission ID',
  'H&S Type',
  'Linked Property',
  'Email',
  'Host Name',
  'Property Name',
  'Property Address',
];
const TRAILING_HEADERS = ['Acknowledged', 'Signed By', 'Signed At'];

export function getHSTabName(hsType: HSType): string {
  switch (hsType) {
    case 'builds': return 'H&S Builds';
    case 'farms': return 'H&S Farms';
    default: return 'H&S Backyards';
  }
}

export function getHSHeaders(hsType: HSType): string[] {
  return [
    ...LEADING_HEADERS,
    ...HS_COLUMNS[hsType].map(c => c.header),
    ...TRAILING_HEADERS,
  ];
}

function cellValue(fields: Record<string, HSFieldValue>, spec: ColumnSpec): string {
  if (spec.kind === 'plan') {
    return String(fields[`${spec.id}_plan`] ?? '');
  }
  if (spec.kind === 'group') {
    const sel = Array.isArray(fields[spec.id]) ? (fields[spec.id] as string[]) : [];
    const other = String(fields[`${spec.id}_other`] ?? '').trim();
    const parts = sel.filter(s => s !== 'Other');
    if (sel.includes('Other') && other) parts.push(other);
    return parts.join(', ');
  }
  return String(fields[spec.id] ?? '');
}

// Build the header row + the data row for a submission. `submittedAt` is passed
// explicitly so edits can preserve the original submission timestamp.
export function buildHSRow(
  body: HSSubmitBody,
  submittedAt: string,
): { headers: string[]; row: string[] } {
  const specs = HS_COLUMNS[body.hsType];
  const leading = [
    submittedAt,
    body.submissionId || '',
    body.hsType,
    body.linkedRegistrationId || '',
    body.email || '',
    body.name || '',
    body.propertyName || '',
    body.propertyAddress || '',
  ];
  const middle = specs.map(spec => cellValue(body.fields, spec));
  const trailing = [
    body.acknowledged ? 'Yes' : 'No',
    body.signatureName || '',
    body.signedAt || '',
  ];
  return {
    headers: getHSHeaders(body.hsType),
    row: [...leading, ...middle, ...trailing],
  };
}
