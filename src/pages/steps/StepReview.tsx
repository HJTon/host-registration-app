import { useRef, useEffect } from 'react';
import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';
import { isTourType } from '../../types/form';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
  submitError: string | null;
}

const WEEKEND_DAY_LABELS: Record<string, string> = {
  sat31Oct: 'Sat 31 Oct',
  sun1Nov: 'Sun 1 Nov',
  sat7Nov: 'Sat 7 Nov',
  sun8Nov: 'Sun 8 Nov',
};

const MIDWEEK_DAY_LABELS: Record<string, string> = {
  fri30Oct: 'Fri 30 Oct',
  mon2Nov: 'Mon 2 Nov',
  tue3Nov: 'Tue 3 Nov',
  wed4Nov: 'Wed 4 Nov',
  thu5Nov: 'Thu 5 Nov',
  fri6Nov: 'Fri 6 Nov',
};

const ALL_DAY_LABELS: Record<string, string> = { ...WEEKEND_DAY_LABELS, ...MIDWEEK_DAY_LABELS };

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  'private-property': 'Private backyard',
  'community-garden': 'Community garden',
  'school-garden': 'School garden',
  'build': 'Build',
  'farm': 'Farm',
  'lifestyle-block': 'Lifestyle block',
};

const KID_FRIENDLY_LABELS: Record<string, string> = {
  yes: 'Yes', no: 'No', maybe: 'Maybe',
};

const DEADLINE_TEXT = 'Info required by 15th April. Please include photos.';

function Row({ label, value, required }: { label: string; value: string; required?: boolean }) {
  return (
    <div className="flex gap-2 text-sm py-1">
      <span className="text-ink-soft shrink-0 w-32">{label}</span>
      <span className={value ? 'text-ink' : 'text-amber-600 italic text-xs self-center'}>
        {value || (required ? 'Required' : '—')}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line pb-3 last:border-0">
      <h3 className="text-xs font-bold uppercase tracking-wide text-primary mb-2">{title}</h3>
      {children}
    </div>
  );
}

// Group slots by day, showing open/possible/closed states
function OpenSlots({ timeSlots }: { timeSlots: FormData['timeSlots'] }) {
  const allDayKeys = Object.keys(ALL_DAY_LABELS);
  const lines: string[] = [];

  for (const day of allDayKeys) {
    const mKey = `${day}_morning` as keyof typeof timeSlots;
    const aKey = `${day}_afternoon` as keyof typeof timeSlots;
    const morning = timeSlots[mKey];
    const afternoon = timeSlots[aKey];
    const label = ALL_DAY_LABELS[day];

    const mOpen = morning === 'open' || morning === true as unknown;
    const aOpen = afternoon === 'open' || afternoon === true as unknown;
    const mPossible = morning === 'possible';
    const aPossible = afternoon === 'possible';

    if (mOpen && aOpen) {
      lines.push(`${label} 10am–1pm & 1pm–4pm`);
    } else if (mOpen) {
      lines.push(`${label} 10am–1pm`);
    } else if (aOpen) {
      lines.push(`${label} 1pm–4pm`);
    } else if (mPossible && aPossible) {
      lines.push(`${label} 10am–1pm & 1pm–4pm (possible)`);
    } else if (mPossible) {
      lines.push(`${label} 10am–1pm (possible)`);
    } else if (aPossible) {
      lines.push(`${label} 1pm–4pm (possible)`);
    }
  }

  if (lines.length === 0) {
    return <p className="text-amber-600 italic text-xs">No open hours selected</p>;
  }

  return (
    <div className="text-sm space-y-0.5">
      {lines.map((line, i) => (
        <p key={i} className="text-ink">{line}</p>
      ))}
    </div>
  );
}

function TourSummary({ data }: { data: FormData }) {
  return (
    <Section title="Tour details">
      <Row label="Tour locations" value={data.tourLocations.slice(0, 100) + (data.tourLocations.length > 100 ? '…' : '')} />
      <Row label="Duration" value={data.tourDuration} />
      <Row label="Capacity" value={data.tourCapacity} />
      <Row label="Price" value={data.tourPrice} />
      {data.secondTalk && <Row label="Second talk" value={data.secondTalk === 'yes' ? 'Yes' : 'No'} />}
      {data.secondTalkDetails && <Row label="Second topic" value={data.secondTalkDetails.slice(0, 80) + (data.secondTalkDetails.length > 80 ? '…' : '')} />}
      <Row label="Availability" value={data.tourAvailability === 'available' ? 'Dates I\'m available' : data.tourAvailability === 'not-available' ? 'Dates I\'m not available' : ''} />
      {data.tourDatesText && <Row label="Dates" value={data.tourDatesText.slice(0, 100) + (data.tourDatesText.length > 100 ? '…' : '')} />}
    </Section>
  );
}

export default function StepReview({ data, errors, onChange, submitError }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const objectUrlsRef = useRef<Map<File, string>>(new Map());
  function getThumb(file: File): string {
    if (!objectUrlsRef.current.has(file)) {
      objectUrlsRef.current.set(file, URL.createObjectURL(file));
    }
    return objectUrlsRef.current.get(file)!;
  }
  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => { urls.forEach(url => URL.revokeObjectURL(url)); };
  }, []);

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    if (newFiles.length === 0) return;
    onChange('photos', [...data.photos, ...newFiles]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const file = data.photos[index];
    const url = objectUrlsRef.current.get(file);
    if (url) { URL.revokeObjectURL(url); objectUrlsRef.current.delete(file); }
    onChange('photos', data.photos.filter((_, i) => i !== index));
  };

  const kidFriendlyLabel = data.kidFriendly ? KID_FRIENDLY_LABELS[data.kidFriendly] : '';
  const featureCount = data.features.length;
  const isTour = isTourType(data.propertyType);
  const isBackyard = !isTour && data.propertyType !== '';

  return (
    <div className="space-y-6">

      {/* Deadline banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-amber-800 text-sm font-medium">{DEADLINE_TEXT}</p>
        <p className="text-amber-700 text-xs mt-1">
          A summary will be emailed to you after submission.
        </p>
      </div>

      {/* Advertiser */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="advertiser">
          Local business advertiser connection <span className="text-ink-soft font-normal">(optional)</span>
        </label>
        <p className="text-xs text-ink-soft mb-2">
          Do you have, work for or know a local business who may like to advertise alongside in the Sustainable Trails programme?
        </p>
        <textarea
          id="advertiser"
          value={data.advertiser}
          onChange={e => onChange('advertiser', e.target.value)}
          rows={2}
          placeholder="Business name, contact name, email/phone…"
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green resize-y"
        />
      </div>

      {/* Photo upload */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1">
          Property photos
        </label>
        <p className="text-xs text-ink-soft mb-3">
          Please take & upload photos or email to Suzy at{' '}
          <a href="mailto:suzy.randall@sustainabletaranaki.org.nz" className="text-primary">
            suzy.randall@sustainabletaranaki.org.nz
          </a>
        </p>

        {data.photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {data.photos.map((file, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-cream-soft">
                <img src={getThumb(file)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center leading-none"
                >×</button>
              </div>
            ))}
          </div>
        )}

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFilesAdded} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesAdded} className="hidden" />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-line rounded-xl text-sm font-medium text-ink-soft hover:border-primary hover:text-primary transition-colors"
          >
            <span className="text-lg">📷</span> Take photo
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-line rounded-xl text-sm font-medium text-ink-soft hover:border-primary hover:text-primary transition-colors"
          >
            <span className="text-lg">🖼️</span> Choose from device
          </button>
        </div>

        <p className="mt-2 text-xs text-ink-soft">
          {data.photos.length === 0
            ? 'No photos added yet — aim for at least 3, or email them to Suzy'
            : `${data.photos.length} photo${data.photos.length !== 1 ? 's' : ''} added${data.photos.length < 3 ? ' — aim for at least 3' : ' ✓'}`}
        </p>
      </div>

      {/* Review summary */}
      <div className="bg-cream-soft rounded-xl p-4 space-y-3">
        <h2 className="font-semibold text-ink">Your registration summary</h2>

        <Section title="Contact">
          <Row label="Email" value={data.email} required />
          {errors.email && <p className="text-danger text-sm mt-1">{errors.email}</p>}
          <Row label="Property" value={data.propertyName} />
          <Row label="Host(s)" value={data.hostNames} />
          <Row label="Phone" value={data.contactNumber} />
          {data.preferredContact.length > 0 && <Row label="Contact via" value={data.preferredContact.join(', ')} />}
        </Section>

        <Section title="Location">
          <Row label="Address" value={data.address} />
          <Row label="Suburb" value={data.suburb} />
          {data.townCity && <Row label="Town / City" value={data.townCity} />}
        </Section>

        <Section title="Property">
          <Row label="Photos" value={data.photos.length > 0 ? `${data.photos.length} photo${data.photos.length !== 1 ? 's' : ''} added` : ''} />
          <Row label="Type" value={PROPERTY_TYPE_LABELS[data.propertyType] ?? data.propertyType} />
          <Row label="Size" value={data.propertySize} />
          <Row label="Established" value={data.yearEstablished} />
          {data.buildOrigin && <Row label="Build origin" value={data.buildOrigin} />}
          {data.sustainabilityFeatures && <Row label="Notes" value={data.sustainabilityFeatures.slice(0, 100) + (data.sustainabilityFeatures.length > 100 ? '…' : '')} />}
        </Section>

        {isTour ? (
          <TourSummary data={data} />
        ) : (
          <Section title="Hours">
            <OpenSlots timeSlots={data.timeSlots} />
            {data.additionalHours && <Row label="Additional" value={data.additionalHours} />}
            {data.weekendVolunteerNote && <Row label="Volunteer note" value={data.weekendVolunteerNote.slice(0, 80) + (data.weekendVolunteerNote.length > 80 ? '…' : '')} />}
          </Section>
        )}

        <Section title="Features">
          {featureCount > 0 && <Row label="Features" value={`${featureCount} item${featureCount !== 1 ? 's' : ''} selected`} />}
          {data.featuresNotes && <Row label="Notes" value={data.featuresNotes.slice(0, 80) + (data.featuresNotes.length > 80 ? '…' : '')} />}
          {data.briefDescription && <Row label="Description" value={data.briefDescription.slice(0, 100) + (data.briefDescription.length > 100 ? '…' : '')} />}
          <Row label="Full description" value={data.whatMakesUnique.slice(0, 100) + (data.whatMakesUnique.length > 100 ? '…' : '')} />
        </Section>

        <Section title="Visitors">
          {data.facilities.length > 0 && <Row label="Facilities" value={data.facilities.join(', ')} />}
          {data.accessLimitations.length > 0 && <Row label="Access" value={data.accessLimitations.join(', ')} />}
          <Row label="Parking & bikes" value={data.parkingInfo} />
          {data.parkingPhotos.length > 0 && (
            <Row label="Parking photos" value={`${data.parkingPhotos.length} photo${data.parkingPhotos.length !== 1 ? 's' : ''} added`} />
          )}
          {isBackyard && <Row label="Kid activities" value={kidFriendlyLabel} />}
          {data.talkTopic && <Row label="Talk topic" value={data.talkTopic} />}
        </Section>
      </div>

      {submitError && (
        <div className="bg-danger/10 border border-red-200 rounded-xl p-4">
          <p className="text-danger text-sm font-medium">{submitError}</p>
        </div>
      )}
    </div>
  );
}
