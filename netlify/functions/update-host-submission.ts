import type { Context } from '@netlify/functions';
import { google } from 'googleapis';

const SPREADSHEET_ID_ENV = 'HOST_FORM_SPREADSHEET_ID';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

function getTabName(propertyType: string): string {
  switch (propertyType) {
    case 'private-property': return 'Backyards';
    case 'community-garden': return 'Community Gardens';
    case 'school-garden': return 'School Gardens';
    case 'build': return 'Builds';
    case 'farm': return 'Farms';
    case 'lifestyle-block': return 'Lifestyle Blocks';
    default: return 'Other';
  }
}

function isTourType(propertyType: string): boolean {
  return propertyType === 'build' || propertyType === 'farm' || propertyType === 'lifestyle-block';
}

const TIME_SLOT_KEYS = [
  'sat31Oct_morning', 'sat31Oct_afternoon',
  'sun1Nov_morning', 'sun1Nov_afternoon',
  'sat7Nov_morning', 'sat7Nov_afternoon',
  'sun8Nov_morning', 'sun8Nov_afternoon',
  'fri30Oct_morning', 'fri30Oct_afternoon',
  'mon2Nov_morning', 'mon2Nov_afternoon',
  'tue3Nov_morning', 'tue3Nov_afternoon',
  'wed4Nov_morning', 'wed4Nov_afternoon',
  'thu5Nov_morning', 'thu5Nov_afternoon',
  'fri6Nov_morning', 'fri6Nov_afternoon',
] as const;

function slotValue(timeSlots: Record<string, string | boolean>, key: string): string {
  const val = timeSlots[key];
  if (val === 'open' || val === true) return 'Open';
  if (val === 'possible') return 'Possible';
  return 'Closed';
}

const COMMON_HEADERS = [
  'Submitted At', 'Submission ID', 'Email', 'Property Name', 'Host Name(s)',
  'Contact Number', 'Preferred Contact', 'Address', 'Suburb', 'Town / City', 'Property Type',
];

const BACKYARD_HEADERS = [
  ...COMMON_HEADERS, 'Property Size', 'Year Established',
  'Sat 31 Oct 10am-1pm', 'Sat 31 Oct 1pm-4pm', 'Sun 1 Nov 10am-1pm', 'Sun 1 Nov 1pm-4pm',
  'Sat 7 Nov 10am-1pm', 'Sat 7 Nov 1pm-4pm', 'Sun 8 Nov 10am-1pm', 'Sun 8 Nov 1pm-4pm',
  'Fri 30 Oct 10am-1pm', 'Fri 30 Oct 1pm-4pm', 'Mon 2 Nov 10am-1pm', 'Mon 2 Nov 1pm-4pm',
  'Tue 3 Nov 10am-1pm', 'Tue 3 Nov 1pm-4pm', 'Wed 4 Nov 10am-1pm', 'Wed 4 Nov 1pm-4pm',
  'Thu 5 Nov 10am-1pm', 'Thu 5 Nov 1pm-4pm', 'Fri 6 Nov 10am-1pm', 'Fri 6 Nov 1pm-4pm',
  'Additional Hours', 'Volunteer Note', 'Features', 'Features Notes', 'Brief Description',
  'Full Description', 'Facilities', 'Access Limitations', 'Parking Info', 'Parking Photo Links',
  'Kid Activities', 'Talk Topic', 'Advertiser', 'Photo Links',
];

const TOUR_HEADERS = (sizeLabel: string, yearsLabel: string, notesLabel: string, briefLabel: string) => [
  ...COMMON_HEADERS, sizeLabel, yearsLabel, notesLabel,
  'Tour Locations', 'Tour Duration', 'Tour Capacity', 'Tour Price',
  'Second Talk', 'Second Talk Details', 'Tour Availability', 'Tour Dates',
  'Sustainability Features', briefLabel, 'Full Description',
  'Facilities', 'Access Limitations', 'Parking Info', 'Parking Photo Links', 'Advertiser', 'Photo Links',
];

function getHeaders(propertyType: string): string[] {
  switch (propertyType) {
    case 'build': return TOUR_HEADERS('Build Size (sqm)', 'Years in Property', 'Build/Renovate/Purchase', 'Brief Description (How Build Is Used)');
    case 'farm': return TOUR_HEADERS('Size & Type of Property', 'Years Working the Land', 'Cultural/Historical Notes', 'Brief Description (How Farm Is Used)');
    case 'lifestyle-block': return TOUR_HEADERS('Size & Type of Property', 'Years Working the Land', 'Cultural/Historical Notes', 'Brief Description (How Land Is Used)');
    default: return BACKYARD_HEADERS;
  }
}

async function ensureTab(
  sheets: ReturnType<typeof getSheets>,
  spreadsheetId: string,
  tabName: string,
  headers: string[],
): Promise<void> {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = spreadsheet.data.sheets?.some(s => s.properties?.title === tabName);
  if (exists) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers] },
  });
}

interface UpdateBody {
  submissionId: string;
  propertyType: string;
  originalPropertyType?: string; // the tab the submission was originally written to
  email: string;
  propertyName: string;
  hostNames: string;
  contactNumber: string;
  preferredContact: string[];
  address: string;
  suburb: string;
  townCity: string;
  propertySize: string;
  yearEstablished: string;
  buildOrigin: string;
  sustainabilityFeatures: string;
  timeSlots: Record<string, string | boolean>;
  additionalHours: string;
  weekendVolunteerNote: string;
  tourLocations: string;
  tourDuration: string;
  tourCapacity: string;
  tourPrice: string;
  secondTalk: string;
  secondTalkDetails: string;
  tourAvailability: string;
  tourDatesText: string;
  features: string[];
  featuresNotes: string;
  briefDescription: string;
  whatMakesUnique: string;
  facilities: string[];
  accessLimitations: string[];
  kidFriendly: string;
  talkTopic: string;
  parkingInfo: string;
  parkingPhotoUrls: string[];
  advertiser: string;
  photoUrls: string[];
}

function buildRow(body: UpdateBody, originalSubmittedAt: string): string[] {
  const commonValues = [
    originalSubmittedAt, // preserve original submission date
    body.submissionId,
    body.email,
    body.propertyName,
    body.hostNames,
    body.contactNumber,
    (body.preferredContact ?? []).join(', '),
    body.address,
    body.suburb,
    body.townCity || '',
    body.propertyType,
  ];

  if (isTourType(body.propertyType)) {
    return [
      ...commonValues,
      body.propertySize,
      body.yearEstablished,
      body.buildOrigin || '',
      body.tourLocations || '',
      body.tourDuration || '',
      body.tourCapacity || '',
      body.tourPrice || '',
      body.secondTalk || '',
      body.secondTalkDetails || '',
      body.tourAvailability || '',
      body.tourDatesText || '',
      body.featuresNotes || '',
      body.briefDescription || '',
      body.whatMakesUnique || '',
      (body.facilities ?? []).join(', '),
      (body.accessLimitations ?? []).join(', '),
      body.parkingInfo || '',
      (body.parkingPhotoUrls ?? []).join(', '),
      body.advertiser || '',
      (body.photoUrls ?? []).join(', '),
    ];
  }

  const timeSlotValues = TIME_SLOT_KEYS.map(key => slotValue(body.timeSlots, key));
  return [
    ...commonValues,
    body.propertySize,
    body.yearEstablished,
    ...timeSlotValues,
    body.additionalHours || '',
    body.weekendVolunteerNote || '',
    (body.features ?? []).join(', '),
    body.featuresNotes || '',
    body.briefDescription || '',
    body.whatMakesUnique || '',
    (body.facilities ?? []).join(', '),
    (body.accessLimitations ?? []).join(', '),
    body.parkingInfo || '',
    (body.parkingPhotoUrls ?? []).join(', '),
    body.kidFriendly || '',
    body.talkTopic || '',
    body.advertiser || '',
    (body.photoUrls ?? []).join(', '),
  ];
}

export default async (request: Request, _context: Context) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  try {
    const spreadsheetId = process.env[SPREADSHEET_ID_ENV];
    if (!spreadsheetId) {
      return new Response(JSON.stringify({ error: 'Spreadsheet ID not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const body = (await request.json()) as UpdateBody;
    if (!body.submissionId || !body.propertyType) {
      return new Response(JSON.stringify({ error: 'Missing submissionId or propertyType' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    // Use originalPropertyType to find which tab the submission was written to.
    // This handles the case where the host changes property type during editing.
    const sourceTabName = getTabName(body.originalPropertyType || body.propertyType);
    const destTabName = getTabName(body.propertyType);
    const sheets = getSheets();

    // Fetch column A:B from the source tab to locate the row by submission ID
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sourceTabName}'!A:B`,
    });

    const rows = readResponse.data.values ?? [];
    // rows[0] is the header; data starts at rows[1]
    const rowIndex = rows.findIndex((row, i) => i > 0 && row[1] === body.submissionId);

    if (rowIndex === -1) {
      return new Response(JSON.stringify({ error: 'Submission not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    // Preserve the original submission timestamp from column A
    const originalSubmittedAt = rows[rowIndex][0] ?? new Date().toISOString();
    const sheetRowNumber = rowIndex + 1; // convert 0-indexed array to 1-indexed sheet row

    const newRow = buildRow(body, originalSubmittedAt);

    if (sourceTabName === destTabName) {
      // Same tab — update the row in place
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sourceTabName}'!A${sheetRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newRow] },
      });
    } else {
      // Property type changed — clear the old row and append to the new tab
      const emptyRow = new Array((rows[rowIndex] as string[]).length).fill('');
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sourceTabName}'!A${sheetRowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [emptyRow] },
      });
      await ensureTab(sheets, spreadsheetId, destTabName, getHeaders(body.propertyType));
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${destTabName}'!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [newRow] },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    console.error('Error updating host submission:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update registration',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      },
    );
  }
};
