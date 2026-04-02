import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
}

export default function StepAddress({ data, errors: _errors, onChange }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-text-secondary text-sm">
        Used for the visitor map and printed programme.
      </p>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="address">
          Street address
        </label>
        <input
          id="address"
          type="text"
          autoComplete="street-address"
          value={data.address}
          onChange={e => onChange('address', e.target.value)}
          placeholder="e.g. 42 Fernhill Road"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[52px]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="suburb">
          Suburb
        </label>
        <input
          id="suburb"
          type="text"
          value={data.suburb}
          onChange={e => onChange('suburb', e.target.value)}
          placeholder="E.g. Moturoa, Fitzroy"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[52px]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="townCity">
          Town / City
        </label>
        <input
          id="townCity"
          type="text"
          value={data.townCity}
          onChange={e => onChange('townCity', e.target.value)}
          placeholder="E.g. Hāwera, Ōpunake, New Plymouth"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[52px]"
        />
      </div>
    </div>
  );
}
