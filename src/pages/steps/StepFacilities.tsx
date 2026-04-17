import { useRef, useEffect } from 'react';
import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
}

const FACILITIES_OPTIONS = [
  { value: 'toilets', label: 'Toilet facilities available' },
  { value: 'wheelchair', label: 'Wheelchair accessible' },
  { value: 'flat-terrain', label: 'Flat terrain' },
  { value: 'seating', label: 'Seating areas' },
  { value: 'refreshments', label: 'Refreshments available' },
  { value: 'bike-parking', label: 'Place to lock or safely leave bikes' },
];

const ACCESS_OPTIONS = [
  { value: 'uneven-terrain', label: 'Uneven or rough terrain' },
  { value: 'narrow-paths', label: 'Narrow paths or tight spaces' },
  { value: 'no-dogs', label: 'No dogs allowed' },
  { value: 'unavoidable-steps', label: 'Unavoidable steps' },
];

function CheckboxList({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value],
    );
  };
  return (
    <div className="space-y-2">
      {options.map(({ value, label }) => (
        <label
          key={value}
          className="flex items-center gap-3 p-3 border border-line rounded-lg cursor-pointer hover:bg-cream-soft transition-colors min-h-[48px]"
        >
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={() => toggle(value)}
            className="w-5 h-5 accent-brand-green shrink-0"
          />
          <span className="text-sm text-ink">{label}</span>
        </label>
      ))}
    </div>
  );
}

export default function StepFacilities({ data, errors: _errors, onChange }: Props) {
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
    onChange('parkingPhotos', [...data.parkingPhotos, ...newFiles]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const file = data.parkingPhotos[index];
    const url = objectUrlsRef.current.get(file);
    if (url) { URL.revokeObjectURL(url); objectUrlsRef.current.delete(file); }
    onChange('parkingPhotos', data.parkingPhotos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-ink mb-2">
          Facilities available <span className="text-ink-soft font-normal">(tick all that apply)</span>
        </p>
        <CheckboxList
          options={FACILITIES_OPTIONS}
          selected={data.facilities}
          onChange={values => onChange('facilities', values)}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink mb-2">
          Access limitations <span className="text-ink-soft font-normal">(tick all that apply)</span>
        </p>
        <CheckboxList
          options={ACCESS_OPTIONS}
          selected={data.accessLimitations}
          onChange={values => onChange('accessLimitations', values)}
        />
      </div>

      {/* Parking & bikes */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1" htmlFor="parkingInfo">
          Where can visitors park and leave bikes?
        </label>
        <p className="text-xs text-ink-soft mb-2">
          Describe where to park, any road-side notes, and where bikes can be safely left.
          e.g. "Street parking on Elm St, bikes can be locked to the fence at the side gate."
        </p>
        <textarea
          id="parkingInfo"
          value={data.parkingInfo}
          onChange={e => onChange('parkingInfo', e.target.value)}
          rows={3}
          placeholder="Describe parking and bike storage for visitors…"
          className="w-full border border-line rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-green resize-y"
        />

        {/* Parking photo thumbnails */}
        {data.parkingPhotos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.parkingPhotos.map((file, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-cream-soft">
                <img src={getThumb(file)} alt={`Parking photo ${i + 1}`} className="w-full h-full object-cover" />
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

        <div className="flex gap-2 mt-3">
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

        {data.parkingPhotos.length > 0 && (
          <p className="mt-2 text-xs text-ink-soft">
            {data.parkingPhotos.length} parking photo{data.parkingPhotos.length !== 1 ? 's' : ''} added ✓
          </p>
        )}
      </div>
    </div>
  );
}
