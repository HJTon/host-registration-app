import type { FormData, TimeSlotKey, SlotState } from '../../types/form';
import type { ChangeHandler } from '../FormPage';
import { isTourType, getPropertyCategory } from '../../types/form';
import TimeSlotGrid from '../../components/TimeSlotGrid';
import VoiceInput from '../../components/VoiceInput';

interface Props {
  data: FormData;
  errors: Record<string, string>;
  onChange: ChangeHandler;
  onTimeSlotChange: (key: TimeSlotKey, value: SlotState) => void;
}

function additionalHoursHint(type: string): string {
  if (type === 'community-garden' || type === 'school-garden') {
    return 'If you are a school or community garden, you can choose your hours — please provide day/times here.';
  }
  const cat = getPropertyCategory(type);
  if (cat === 'backyard') {
    return 'Backyards — if you want to offer evening hours or any special arrangements, please describe them here.';
  }
  return '';
}

function tourLocationsHint(type: string): string {
  if (type === 'build') {
    return "Think about your build's sustainable features. Walk around and through your property and decide on 3-5 locations where you could talk to a group about these features. Tell us each location and generally what you'll talk to. E.g. Driveway - build process / Back deck - design, solar and battery system / Lounge - Materials, appliances.";
  }
  return "Think about your property's sustainable features. Decide on 3-5 reasonably easily accessible locations where you could talk to a group about these features. Tell us each location and generally what you'll talk to. E.g. Cow shed - milking and soil health / Back paddock - pasture systems / Woolshed - energy and waste management.";
}

// Tour-based flow for builds, farms, lifestyle blocks
function TourDetails({ data, onChange }: { data: FormData; onChange: ChangeHandler }) {
  return (
    <div className="space-y-6">
      {/* Talk & Tour locations */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="tourLocations">
          Talk & Tour: Locations
        </label>
        <p className="text-xs text-text-secondary mb-2">
          {tourLocationsHint(data.propertyType)}
        </p>
        <VoiceInput
          id="tourLocations"
          value={data.tourLocations}
          onChange={v => onChange('tourLocations', v)}
          rows={5}
          fieldHint="3-5 tour locations on a property and what the host will discuss at each stop"
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="tourDuration">
          Approximately how long will your tour take?
        </label>
        <p className="text-xs text-text-secondary mb-2">
          Including introductions, outlining health & safety aspects, talk points, travel to locations, summary.
        </p>
        <input
          id="tourDuration"
          type="text"
          value={data.tourDuration}
          onChange={e => onChange('tourDuration', e.target.value)}
          placeholder="e.g. 45 minutes; 1 hour"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[52px]"
        />
      </div>

      {/* Capacity */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="tourCapacity">
          How many people could you comfortably tour in a group?
        </label>
        <input
          id="tourCapacity"
          type="text"
          value={data.tourCapacity}
          onChange={e => onChange('tourCapacity', e.target.value)}
          placeholder="e.g. Max. 30 (min. 4)"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[52px]"
        />
      </div>

      {/* Price & inclusions */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="tourPrice">
          Price & inclusions
        </label>
        <p className="text-xs text-text-secondary mb-2">
          Most of our builds, farms, and lifestyle tours will be free, but you have the option to charge a small fee if you include refreshments, food, or product.
        </p>
        <input
          id="tourPrice"
          type="text"
          value={data.tourPrice}
          onChange={e => onChange('tourPrice', e.target.value)}
          placeholder="e.g. Free; $5 including hot drink & scone"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[52px]"
        />
      </div>

      {/* Second talk */}
      <div>
        <p className="text-sm font-medium text-text-primary mb-1">
          Second talk?
        </p>
        <p className="text-xs text-text-secondary mb-3">
          Alongside your general tour, you're welcome to provide a second talk on a specific topic e.g. solar and batteries.
        </p>
        <div className="space-y-2">
          {[
            { value: 'yes', label: "Yes, I'd like to do a second talk" },
            { value: 'no', label: 'No, I prefer to repeat the same talk & tour' },
          ].map(({ value, label }) => (
            <label
              key={value}
              className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors min-h-[52px] ${
                data.secondTalk === value
                  ? 'border-primary bg-secondary/30'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="secondTalk"
                value={value}
                checked={data.secondTalk === value}
                onChange={() => onChange('secondTalk', value)}
                className="w-5 h-5 accent-primary shrink-0"
              />
              <span className="text-sm text-text-primary">{label}</span>
            </label>
          ))}
        </div>

        {data.secondTalk === 'yes' && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="secondTalkDetails">
              What will your second talk cover?
            </label>
            <VoiceInput
              id="secondTalkDetails"
              value={data.secondTalkDetails}
              onChange={v => onChange('secondTalkDetails', v)}
              rows={3}
              fieldHint="topic and details for a second talk at the property"
            />
          </div>
        )}
      </div>

      {/* Tour dates */}
      <div>
        <p className="text-sm font-medium text-text-primary mb-1">
          Tour dates & availability
        </p>
        <p className="text-xs text-text-secondary mb-3">
          Please let us know your availability between 9–15 November.
        </p>

        <div className="space-y-2 mb-3">
          {[
            { value: 'available', label: "I'll suggest 3–5 dates & times I'm available below" },
            { value: 'not-available', label: "I'm flexible with dates/time. Below is when I'm NOT available." },
          ].map(({ value, label }) => (
            <label
              key={value}
              className={`flex items-center gap-4 p-3 border-2 rounded-xl cursor-pointer transition-colors min-h-[48px] ${
                data.tourAvailability === value
                  ? 'border-primary bg-secondary/30'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="tourAvailability"
                value={value}
                checked={data.tourAvailability === value}
                onChange={() => onChange('tourAvailability', value)}
                className="w-5 h-5 accent-primary shrink-0"
              />
              <span className="text-sm text-text-primary">{label}</span>
            </label>
          ))}
        </div>

        <textarea
          id="tourDatesText"
          value={data.tourDatesText}
          onChange={e => onChange('tourDatesText', e.target.value)}
          rows={3}
          placeholder={
            data.tourAvailability === 'not-available'
              ? 'e.g. Not available Tue 11 Nov afternoon, Wed 12 Nov all day'
              : 'e.g. Sat 9 Nov 10am, Mon 11 Nov 2pm, Thu 14 Nov 10am'
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
        />
      </div>
    </div>
  );
}

export default function StepHours({ data, errors: _errors, onChange, onTimeSlotChange }: Props) {
  if (isTourType(data.propertyType)) {
    return <TourDetails data={data} onChange={onChange} />;
  }

  const hint = additionalHoursHint(data.propertyType);
  const isBackyard = getPropertyCategory(data.propertyType) === 'backyard';

  return (
    <div className="space-y-6">
      <TimeSlotGrid timeSlots={data.timeSlots} onChange={onTimeSlotChange} />

      {/* Additional hours */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="additionalHours">
          Any other hours or arrangements? <span className="text-text-secondary font-normal">(optional)</span>
        </label>
        {hint && (
          <p className="text-xs text-text-secondary mb-2">
            {hint}
          </p>
        )}
        <textarea
          id="additionalHours"
          value={data.additionalHours}
          onChange={e => onChange('additionalHours', e.target.value)}
          rows={3}
          placeholder="e.g. Thursday evening 6–8pm; school group bookings by arrangement…"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
        />
      </div>

      {/* Volunteers (backyard types only) */}
      {isBackyard && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="weekendVolunteerNote">
            Volunteers <span className="text-text-secondary font-normal">(optional)</span>
          </label>
          <p className="text-xs text-text-secondary mb-2">
            Finding your own volunteers is encouraged (friends, neighbours, family etc). If it is going to be difficult to find a welcome desk person, we may be able to source a volunteer. If you think you may need a Sustainable Taranaki volunteer on the weekend, please say what you can offer as a thank you e.g. providing a meal, free seedlings, etc.
          </p>
          <textarea
            id="weekendVolunteerNote"
            value={data.weekendVolunteerNote}
            onChange={e => onChange('weekendVolunteerNote', e.target.value)}
            rows={3}
            placeholder="e.g. I could offer a home-cooked lunch, or seedlings from the garden…"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
          />
        </div>
      )}
    </div>
  );
}
