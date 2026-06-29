'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createSpacePost } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import {
  LEASE_DURATION_OPTIONS,
  SCHEDULE_OPTIONS,
  SPACE_APARTMENT_TYPES,
  SPACE_LEASE_TYPES,
  US_STATES,
} from '@/lib/rental-options';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import SafetyNotice from '@/components/SafetyNotice';

type SpaceForm = {
  city: string;
  state: string;
  zip: string;
  apartment_type: string;
  total_rent: string;
  your_share: string;
  rooms_available: string;
  lease_type: string;
  lease_duration: string;
  move_in_date: string;
  is_furnished: boolean;
  has_parking: boolean;
  has_laundry: boolean;
  pets_allowed: boolean;
  has_ac: boolean;
  utilities_included: boolean;
  pref_cleanliness: number;
  pref_noise_tolerance: number;
  pref_guests_frequency: number;
  pref_smoking_ok: boolean;
  pref_schedule: string;
  description: string;
};

type SpaceFormErrors = Partial<
  Record<'city' | 'state' | 'total_rent' | 'your_share' | 'rooms_available', string>
>;

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {hint ? <p className="text-xs text-white/55">{hint}</p> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </label>
  );
}

function validateForm(form: SpaceForm): SpaceFormErrors {
  const errors: SpaceFormErrors = {};
  const totalRent = Number(form.total_rent);
  const share = Number(form.your_share);
  const rooms = Number(form.rooms_available);

  if (!form.city.trim()) errors.city = 'Enter the city where the place is located.';
  if (!form.state) errors.state = 'Select the state for this listing.';
  if (!form.total_rent || Number.isNaN(totalRent) || totalRent <= 0) {
    errors.total_rent = 'Enter a valid monthly rent above 0.';
  }
  if (!form.your_share || Number.isNaN(share) || share <= 0) {
    errors.your_share = 'Enter the monthly share the roommate would pay.';
  } else if (!errors.total_rent && share > totalRent) {
    errors.your_share = 'The roommate share cannot be higher than the total rent.';
  }
  if (!form.rooms_available || Number.isNaN(rooms) || rooms < 1) {
    errors.rooms_available = 'Enter at least 1 available room or spot.';
  }

  return errors;
}

export default function PostSpacePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [form, setForm] = useState<SpaceForm>({
    city: '',
    state: '',
    zip: '',
    apartment_type: '2bhk',
    total_rent: '',
    your_share: '',
    rooms_available: '1',
    lease_type: 'existing',
    lease_duration: 'flexible',
    move_in_date: '',
    is_furnished: false,
    has_parking: false,
    has_laundry: false,
    pets_allowed: false,
    has_ac: false,
    utilities_included: false,
    pref_cleanliness: 3,
    pref_noise_tolerance: 3,
    pref_guests_frequency: 3,
    pref_smoking_ok: false,
    pref_schedule: 'flexible',
    description: '',
  });
  const [errors, setErrors] = useState<SpaceFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = <K extends keyof SpaceForm>(key: K, value: SpaceForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as keyof SpaceFormErrors];
      return next;
    });
  };

  const handleSubmit = async () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      trackEvent('match_post_redirected_to_login', { post_type: 'space' });
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      trackEvent('match_space_post_started', { state: form.state, furnished: form.is_furnished });
      await createSpacePost({
        poster_id: data.user.id,
        city: form.city.trim(),
        state: form.state,
        zip: form.zip.trim() || undefined,
        apartment_type: form.apartment_type,
        total_rent: Number(form.total_rent),
        your_share: Number(form.your_share),
        rooms_available: Number(form.rooms_available),
        lease_type: form.lease_type,
        lease_duration: form.lease_duration,
        move_in_date: form.move_in_date || undefined,
        is_furnished: form.is_furnished,
        has_parking: form.has_parking,
        has_laundry: form.has_laundry,
        pets_allowed: form.pets_allowed,
        has_ac: form.has_ac,
        utilities_included: form.utilities_included,
        pref_cleanliness: form.pref_cleanliness,
        pref_noise_tolerance: form.pref_noise_tolerance,
        pref_guests_frequency: form.pref_guests_frequency,
        pref_smoking_ok: form.pref_smoking_ok,
        pref_schedule: form.pref_schedule,
        description: form.description.trim() || undefined,
      });
      trackEvent('match_space_post_completed', { state: form.state, city: form.city.trim() });
      router.push('/match/my-matches');
    } catch (err) {
      trackEvent('match_space_post_failed', { state: form.state });
      setSubmitError(err instanceof Error ? err.message : 'Failed to create space post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold sm:text-4xl">Post your room or apartment</h1>
        <p className="max-w-3xl text-sm text-white/65">
          Use this form if you already have a place and want to find a roommate or flatmate.
          Fill in the details below so seekers understand the home, the cost, and what kind of
          person would be a good fit.
        </p>
      </div>

      <SafetyNotice title="Trust and safety">
        Keep the first conversation on RentPilot. Public posts should not include phone numbers, email addresses,
        or payment handles, and those details may be removed automatically if you add them.
      </SafetyNotice>

      {submitError ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {submitError}
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">1. Where is the place?</h2>
          <p className="text-sm text-white/55">
            These details help us show your listing to people searching in the same area.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="City" hint="Example: Chicago" error={errors.city}>
            <Input
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Chicago"
              aria-invalid={Boolean(errors.city)}
            />
          </Field>
          <Field label="State" hint="Choose the state for this listing" error={errors.state}>
            <Select
              value={form.state}
              onChange={(e) => updateField('state', e.target.value)}
              aria-invalid={Boolean(errors.state)}
            >
              <option value="" className="text-black">
                Select a state
              </option>
              {US_STATES.map((state) => (
                <option key={state} value={state} className="text-black">
                  {state}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="ZIP code" hint="Optional, but helps with more accurate matching">
            <Input
              value={form.zip}
              onChange={(e) => updateField('zip', e.target.value)}
              placeholder="60616"
            />
          </Field>
          <Field label="Apartment type" hint="Choose the kind of place you are offering">
            <Select value={form.apartment_type} onChange={(e) => updateField('apartment_type', e.target.value)}>
              {SPACE_APARTMENT_TYPES.map((option) => (
                <option key={option.value} value={option.value} className="text-black">
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">2. What are the lease and cost details?</h2>
          <p className="text-sm text-white/55">
            Be clear about rent and timing so people know whether the place fits their budget and move-in plan.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Total apartment rent" hint="The full monthly rent for the unit" error={errors.total_rent}>
            <Input
              type="number"
              min="1"
              value={form.total_rent}
              onChange={(e) => updateField('total_rent', e.target.value)}
              aria-invalid={Boolean(errors.total_rent)}
            />
          </Field>
          <Field label="Roommate's expected share" hint="How much the new person would pay each month" error={errors.your_share}>
            <Input
              type="number"
              min="1"
              value={form.your_share}
              onChange={(e) => updateField('your_share', e.target.value)}
              aria-invalid={Boolean(errors.your_share)}
            />
          </Field>
          <Field label="How many roommates are you looking for?" hint="Usually 1 unless you need multiple people" error={errors.rooms_available}>
            <Input
              type="number"
              min="1"
              value={form.rooms_available}
              onChange={(e) => updateField('rooms_available', e.target.value)}
              aria-invalid={Boolean(errors.rooms_available)}
            />
          </Field>
          <Field label="Lease situation" hint="Tell people whether they would join your lease, co-sign a new one, or sublet">
            <Select value={form.lease_type} onChange={(e) => updateField('lease_type', e.target.value)}>
              {SPACE_LEASE_TYPES.map((option) => (
                <option key={option.value} value={option.value} className="text-black">
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Preferred lease length" hint="How long you want the roommate to stay">
            <Select value={form.lease_duration} onChange={(e) => updateField('lease_duration', e.target.value)}>
              {LEASE_DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-black">
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Move-in date" hint="When the room or space becomes available">
            <Input
              type="date"
              value={form.move_in_date}
              onChange={(e) => updateField('move_in_date', e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">3. What does the place include?</h2>
          <p className="text-sm text-white/55">Turn on each feature that is available in the home.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Furnished</p>
              <p className="text-xs text-white/50">Bed, couch, desk, or other furniture is included.</p>
            </div>
            <Switch checked={form.is_furnished} onChange={(e) => updateField('is_furnished', e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Parking</p>
              <p className="text-xs text-white/50">Street, garage, or assigned parking is available.</p>
            </div>
            <Switch checked={form.has_parking} onChange={(e) => updateField('has_parking', e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Laundry</p>
              <p className="text-xs text-white/50">Washer/dryer is in-unit or on-site.</p>
            </div>
            <Switch checked={form.has_laundry} onChange={(e) => updateField('has_laundry', e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Pets allowed</p>
              <p className="text-xs text-white/50">Landlord or lease allows pets in the home.</p>
            </div>
            <Switch checked={form.pets_allowed} onChange={(e) => updateField('pets_allowed', e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Air conditioning</p>
              <p className="text-xs text-white/50">Useful for seekers who specifically need AC.</p>
            </div>
            <Switch checked={form.has_ac} onChange={(e) => updateField('has_ac', e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Utilities included</p>
              <p className="text-xs text-white/50">Water, electricity, gas, wifi, or similar are covered.</p>
            </div>
            <Switch checked={form.utilities_included} onChange={(e) => updateField('utilities_included', e.target.checked)} />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">4. What kind of roommate works well with you?</h2>
          <p className="text-sm text-white/55">
            Use 1 for low and 5 for high. These help RentPilot suggest better matches.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Slider
            label="How clean should the roommate be? (1 = relaxed, 5 = very tidy)"
            min={1}
            max={5}
            value={form.pref_cleanliness}
            onChange={(e) => updateField('pref_cleanliness', Number(e.target.value))}
          />
          <Slider
            label="How much noise is okay? (1 = quiet only, 5 = noise is fine)"
            min={1}
            max={5}
            value={form.pref_noise_tolerance}
            onChange={(e) => updateField('pref_noise_tolerance', Number(e.target.value))}
          />
          <Slider
            label="How often are guests okay? (1 = rarely, 5 = often)"
            min={1}
            max={5}
            value={form.pref_guests_frequency}
            onChange={(e) => updateField('pref_guests_frequency', Number(e.target.value))}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Preferred schedule" hint="This is used in the compatibility score.">
            <Select value={form.pref_schedule} onChange={(e) => updateField('pref_schedule', e.target.value)}>
              {SCHEDULE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-black">
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Smoking okay</p>
              <p className="text-xs text-white/50">Turn this on only if a smoker is welcome in the home.</p>
            </div>
            <Switch checked={form.pref_smoking_ok} onChange={(e) => updateField('pref_smoking_ok', e.target.checked)} />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">5. Describe the place in your own words</h2>
          <p className="text-sm text-white/55">
            Mention neighborhood vibe, room size, commute, house rules, and the kind of roommate you hope to find.
          </p>
        </div>
        <Textarea
          placeholder="Example: Sunny private room in a 2-bedroom apartment near downtown. Looking for a respectful roommate who is clean, communicates well, and is okay with an occasional guest."
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
        />
      </section>

      <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Creating space post...' : 'Create space post'}
      </Button>
    </div>
  );
}
