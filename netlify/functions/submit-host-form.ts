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

// Map property type to sheet tab name
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

// Shared contact/location headers
const COMMON_HEADERS = [
  'Submitted At',
  'Submission ID',
  'Email',
  'Property Name',
  'Host Name(s)',
  'Contact Number',
  'Preferred Contact',
  'Address',
  'Suburb',
  'Town / City',
  'Property Type',
];

const BACKYARD_HEADERS = [
  ...COMMON_HEADERS,
  'Property Size',
  'Year Established',
  // Weekend slots
  'Sat 31 Oct 10am-1pm', 'Sat 31 Oct 1pm-4pm',
  'Sun 1 Nov 10am-1pm', 'Sun 1 Nov 1pm-4pm',
  'Sat 7 Nov 10am-1pm', 'Sat 7 Nov 1pm-4pm',
  'Sun 8 Nov 10am-1pm', 'Sun 8 Nov 1pm-4pm',
  // Midweek slots
  'Fri 30 Oct 10am-1pm', 'Fri 30 Oct 1pm-4pm',
  'Mon 2 Nov 10am-1pm', 'Mon 2 Nov 1pm-4pm',
  'Tue 3 Nov 10am-1pm', 'Tue 3 Nov 1pm-4pm',
  'Wed 4 Nov 10am-1pm', 'Wed 4 Nov 1pm-4pm',
  'Thu 5 Nov 10am-1pm', 'Thu 5 Nov 1pm-4pm',
  'Fri 6 Nov 10am-1pm', 'Fri 6 Nov 1pm-4pm',
  'Additional Hours',
  'Volunteer Note',
  'Features',
  'Features Notes',
  'Brief Description',
  'Full Description',
  'Facilities',
  'Access Limitations',
  'Parking Info',
  'Parking Photo Links',
  'Kid Activities',
  'Talk Topic',
  'Advertiser',
  'Photo Links',
];

const BUILD_HEADERS = [
  ...COMMON_HEADERS,
  'Build Size (sqm)',
  'Years in Property',
  'Build/Renovate/Purchase',
  'Tour Locations',
  'Tour Duration',
  'Tour Capacity',
  'Tour Price',
  'Second Talk',
  'Second Talk Details',
  'Tour Availability',
  'Tour Dates',
  'Sustainability Features',
  'Brief Description (How Build Is Used)',
  'Full Description',
  'Facilities',
  'Access Limitations',
  'Parking Info',
  'Parking Photo Links',
  'Advertiser',
  'Photo Links',
];

const FARM_HEADERS = [
  ...COMMON_HEADERS,
  'Size & Type of Property',
  'Years Working the Land',
  'Cultural/Historical Notes',
  'Tour Locations',
  'Tour Duration',
  'Tour Capacity',
  'Tour Price',
  'Second Talk',
  'Second Talk Details',
  'Tour Availability',
  'Tour Dates',
  'Sustainability Features',
  'Brief Description (How Farm Is Used)',
  'Full Description',
  'Facilities',
  'Access Limitations',
  'Parking Info',
  'Parking Photo Links',
  'Advertiser',
  'Photo Links',
];

const LIFESTYLE_HEADERS = [
  ...COMMON_HEADERS,
  'Size & Type of Property',
  'Years Working the Land',
  'Cultural/Historical Notes',
  'Tour Locations',
  'Tour Duration',
  'Tour Capacity',
  'Tour Price',
  'Second Talk',
  'Second Talk Details',
  'Tour Availability',
  'Tour Dates',
  'Sustainability Features',
  'Brief Description (How Land Is Used)',
  'Full Description',
  'Facilities',
  'Access Limitations',
  'Parking Info',
  'Parking Photo Links',
  'Advertiser',
  'Photo Links',
];

function getHeaders(propertyType: string): string[] {
  switch (propertyType) {
    case 'build': return BUILD_HEADERS;
    case 'farm': return FARM_HEADERS;
    case 'lifestyle-block': return LIFESTYLE_HEADERS;
    default: return BACKYARD_HEADERS; // covers private-property, community-garden, school-garden
  }
}

// All time slot keys in column order
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

async function ensureTab(
  sheets: ReturnType<typeof getSheets>,
  spreadsheetId: string,
  tabName: string,
  headers: string[],
): Promise<void> {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = spreadsheet.data.sheets?.some(
    (s) => s.properties?.title === tabName,
  );
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: tabName } } }],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers] },
  });
}

interface SubmitBody {
  submissionId: string;
  email: string;
  propertyName: string;
  hostNames: string;
  contactNumber: string;
  preferredContact: string[];
  address: string;
  suburb: string;
  townCity: string;
  propertyType: string;
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
  needVolunteers: string;
  volunteerOffer: string[];
  volunteerOfferOther: string;
  parkingInfo: string;
  parkingPhotoUrls: string[];
  advertiser: string;
  photoUrls: string[];
}

function slotValue(timeSlots: Record<string, string | boolean>, key: string): string {
  const val = timeSlots[key];
  if (val === 'open' || val === true) return 'Open';
  if (val === 'possible') return 'Possible';
  return 'Closed';
}

function isTourType(propertyType: string): boolean {
  return propertyType === 'build' || propertyType === 'farm' || propertyType === 'lifestyle-block';
}

function buildRow(body: SubmitBody, propertyType: string): string[] {
  const commonValues = [
    new Date().toISOString(),
    body.submissionId || '',
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

  if (isTourType(propertyType)) {
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
      body.featuresNotes || '',  // sustainability features free text
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

  // Backyard types
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

    const body = (await request.json()) as SubmitBody;

    if (!body.email || !body.propertyName || !body.hostNames || !body.contactNumber) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const tabName = getTabName(body.propertyType);
    const headers = getHeaders(body.propertyType);
    const sheets = getSheets();
    await ensureTab(sheets, spreadsheetId, tabName, headers);

    const row = buildRow(body, body.propertyType);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${tabName}'!A:A`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (error) {
    console.error('Error submitting host form:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to submit registration',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      },
    );
  }
};
