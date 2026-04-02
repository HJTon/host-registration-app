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

interface UpdateBody {
  submissionId: string;
  propertyType: string;
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

    const tabName = getTabName(body.propertyType);
    const sheets = getSheets();

    // Fetch column B (Submission ID) from the tab to locate the row
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tabName}'!A:B`,
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

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tabName}'!A${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] },
    });

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
