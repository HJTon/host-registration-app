// Shared Health & Safety sheet structure for the submit/update functions.
// Kept in a subdirectory so Netlify does not expose it as its own endpoint.
//
// Column definitions mirror src/types/healthSafety.ts. Each entry maps a field
// id from the client HSResponse to a sheet column. `kind`:
//   group → checkbox selections (array) + the field's _other free text
//   plan  → the paired mitigation paragraph stored at `${id}_plan`
//   value → a plain string field (yesno / shortText / paragraph)

export type HSType = 'backyards' | 'builds' | 'farms' | 'lifestyle';
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

// Farms and Lifestyle share the same column layout (Lifestyle is a reworded
// copy of Farms with identical field ids).
function FARM_COLUMNS(): ColumnSpec[] {
  return [
    { header: 'Parking & Capacity', id: 'parking', kind: 'group' },
    { header: 'Vehicle Capacity', id: 'vehicleCapacity', kind: 'value' },
    { header: 'Parking to Tour Plan', id: 'parkingToTour', kind: 'value' },
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
    { header: 'Concerns or Questions', id: 'concerns', kind: 'value' },
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
    { header: 'Concerns or Questions', id: 'concerns', kind: 'value' },
  ],
  builds: [
    ...hazard('parking', 'Parking & Vehicles'),
    ...hazard('paths', 'Outside Paths & Surfaces'),
    ...hazard('steps', 'Steps, Handrails & Drop-offs'),
    ...hazard('other', 'Other Hazards'),
    { header: 'First Aid Kit', id: 'firstAid', kind: 'value' },
    { header: 'Emergency Evacuation Point', id: 'evacPoint', kind: 'value' },
    { header: 'Emergency Vehicle Access', id: 'vehicleAccess', kind: 'value' },
    { header: 'Concerns or Questions', id: 'concerns', kind: 'value' },
  ],
  farms: FARM_COLUMNS(),
  lifestyle: FARM_COLUMNS(),
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
    case 'lifestyle': return 'H&S Lifestyle Blocks';
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

// Inverse of buildHSRow: reconstruct an HSResponse-shaped object from a sheet
// row, so the dashboard can render a host's plan with the same component the
// host sees. Columns are located by header name (robust to column reordering).
// Group selections were joined into one cell on write; on read we surface that
// cell as a single-item array, which the plan renderer displays verbatim.
export function rowToHSResponse(
  hsType: HSType,
  headers: string[],
  row: string[],
): HSSubmitBody {
  const idx = (name: string) => headers.indexOf(name);
  const at = (name: string) => {
    const i = idx(name);
    return i >= 0 ? String(row[i] ?? '') : '';
  };

  const fields: Record<string, HSFieldValue> = {};
  for (const spec of HS_COLUMNS[hsType]) {
    // spec.header already carries the " — Plan" suffix for plan columns.
    const cell = at(spec.header);
    if (spec.kind === 'plan') {
      fields[`${spec.id}_plan`] = cell;
    } else if (spec.kind === 'group') {
      fields[spec.id] = cell ? [cell] : [];
    } else {
      fields[spec.id] = cell;
    }
  }

  return {
    submissionId: at('Submission ID'),
    hsType,
    linkedRegistrationId: at('Linked Property'),
    email: at('Email'),
    name: at('Host Name'),
    propertyName: at('Property Name'),
    propertyAddress: at('Property Address'),
    fields,
    acknowledged: at('Acknowledged').toLowerCase() === 'yes',
    signatureName: at('Signed By'),
    signedAt: at('Signed At'),
    submittedAt: at('Submitted At'),
  };
}
