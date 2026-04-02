export type WeekendDay = 'sat31Oct' | 'sun1Nov' | 'sat7Nov' | 'sun8Nov';
export type MidweekDay = 'fri30Oct' | 'mon2Nov' | 'tue3Nov' | 'wed4Nov' | 'thu5Nov' | 'fri6Nov';
export type TimeSlotDay = WeekendDay | MidweekDay;
export type TimeSlotPeriod = 'morning' | 'afternoon';
export type TimeSlotKey = `${TimeSlotDay}_${TimeSlotPeriod}`;
export type SlotState = 'open' | 'closed' | 'possible';
export type TimeSlots = Record<TimeSlotKey, SlotState>;

// Main property categories
export type PropertyCategory = 'backyard' | 'build' | 'farm' | 'lifestyle-block';
// Sub-types for backyard category
export type BackyardSubType = 'private-property' | 'community-garden' | 'school-garden';

// Helper to determine the category from a propertyType value
export function getPropertyCategory(propertyType: string): PropertyCategory | '' {
  if (['private-property', 'community-garden', 'school-garden'].includes(propertyType)) return 'backyard';
  if (propertyType === 'build') return 'build';
  if (propertyType === 'farm') return 'farm';
  if (propertyType === 'lifestyle-block') return 'lifestyle-block';
  return '';
}

// Whether a property type uses the "tour" flow (builds, farms, lifestyle blocks)
export function isTourType(propertyType: string): boolean {
  const cat = getPropertyCategory(propertyType);
  return cat === 'build' || cat === 'farm' || cat === 'lifestyle-block';
}

export interface FormData {
  // Submission identity (empty on new, set after first submit)
  submissionId: string;
  // Step 1 – Email
  email: string;
  // Step 2 – Contact
  propertyName: string;
  hostNames: string;
  contactNumber: string;
  preferredContact: string[]; // e.g. ['whatsapp', 'email']
  // Step 3 – Location
  address: string;
  suburb: string;
  townCity: string;
  // Step 4 – Property type
  propertyType: string; // PropertyCategory values or BackyardSubType values
  // Step 5 – Property details
  propertySize: string;
  yearEstablished: string;
  buildOrigin: string; // builds only: 'Did you build, renovate or purchase as is?'
  sustainabilityFeatures: string; // farms/lifestyle: cultural/historical notes; builds: unused in step 5
  // Step 6 – Open hours (backyards) or Tour details (builds/farms/lifestyle)
  timeSlots: TimeSlots;
  additionalHours: string;
  weekendVolunteerNote: string; // backyards only: volunteer offer info
  // Tour fields (builds/farms/lifestyle)
  tourLocations: string; // 3-5 locations and what you'll talk about
  tourDuration: string; // approximate tour length
  tourCapacity: string; // max group size
  tourPrice: string; // price & inclusions
  secondTalk: string; // 'yes' | 'no' | ''
  secondTalkDetails: string; // details for second talk
  tourAvailability: string; // 'available' | 'not-available'
  tourDatesText: string; // free text for dates/times
  // Step 7 – Features
  features: string[];
  featuresNotes: string;
  briefDescription: string;
  // Step 8 – What makes it unique
  whatMakesUnique: string;
  // Step 9 – Visitor access
  facilities: string[];
  accessLimitations: string[];
  parkingInfo: string;
  parkingPhotos: File[];
  // Step 10 – Activities
  kidFriendly: string; // '' | 'yes' | 'no' | 'maybe'
  talkTopic: string;
  needVolunteers: string; // '' | 'yes' | 'no'
  volunteerOffer: string[]; // e.g. ['lunch', 'seedlings', 'tea-coffee', 'other']
  volunteerOfferOther: string; // free text when 'other' is selected
  // Step 11 – Review
  advertiser: string;
  // Captured photos — File objects, not persisted to localStorage
  photos: File[];
}

export function getInitialFormData(): FormData {
  return {
    submissionId: '',
    email: '',
    propertyName: '',
    hostNames: '',
    contactNumber: '',
    preferredContact: [],
    address: '',
    suburb: '',
    townCity: '',
    propertyType: '',
    propertySize: '',
    yearEstablished: '',
    buildOrigin: '',
    sustainabilityFeatures: '',
    timeSlots: {
      // Weekends default open
      sat31Oct_morning: 'open',
      sat31Oct_afternoon: 'open',
      sun1Nov_morning: 'open',
      sun1Nov_afternoon: 'open',
      sat7Nov_morning: 'open',
      sat7Nov_afternoon: 'open',
      sun8Nov_morning: 'open',
      sun8Nov_afternoon: 'open',
      // Midweek default closed
      fri30Oct_morning: 'closed',
      fri30Oct_afternoon: 'closed',
      mon2Nov_morning: 'closed',
      mon2Nov_afternoon: 'closed',
      tue3Nov_morning: 'closed',
      tue3Nov_afternoon: 'closed',
      wed4Nov_morning: 'closed',
      wed4Nov_afternoon: 'closed',
      thu5Nov_morning: 'closed',
      thu5Nov_afternoon: 'closed',
      fri6Nov_morning: 'closed',
      fri6Nov_afternoon: 'closed',
    },
    additionalHours: '',
    weekendVolunteerNote: '',
    tourLocations: '',
    tourDuration: '',
    tourCapacity: '',
    tourPrice: '',
    secondTalk: '',
    secondTalkDetails: '',
    tourAvailability: '',
    tourDatesText: '',
    features: [],
    featuresNotes: '',
    briefDescription: '',
    whatMakesUnique: '',
    facilities: [],
    accessLimitations: [],
    parkingInfo: '',
    parkingPhotos: [],
    kidFriendly: '',
    talkTopic: '',
    needVolunteers: '',
    volunteerOffer: [],
    volunteerOfferOther: '',
    advertiser: '',
    photos: [],
  };
}
