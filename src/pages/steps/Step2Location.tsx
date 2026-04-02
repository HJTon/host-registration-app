import type { FormData } from '../../types/form';
import type { ChangeHandler } from '../FormPage';
import FieldError from '../../components/FieldError';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
}

export default function Step2Location({ data, errors, onChange }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-text-secondary text-sm">
        Where is your property located? This is used for the visitor map and event programme.
      </p>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="address">
          Street address <span className="text-red-500">*</span>
        </label>
        <input
          id="address"
          type="text"
          autoComplete="street-address"
          value={data.address}
          onChange={e => onChange('address', e.target.value)}
          placeholder="e.g. 42 Fernhill Road"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[48px]"
        />
        {errors.address && <FieldError message={errors.address} />}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="suburb">
          Suburb / locality <span className="text-red-500">*</span>
        </label>
        <input
          id="suburb"
          type="text"
          value={data.suburb}
          onChange={e => onChange('suburb', e.target.value)}
          placeholder="e.g. Inglewood, Waitara, New Plymouth"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[48px]"
        />
        {errors.suburb && <FieldError message={errors.suburb} />}
      </div>
    </div>
  );
}
