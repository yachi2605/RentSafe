'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createSeekerPost } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { LEASE_DURATION_OPTIONS, SCHEDULE_OPTIONS, US_STATES } from '@/lib/rental-options';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import SafetyNotice from '@/components/SafetyNotice';

type SeekerForm = {
  city: string;
  state: string;
  budget_min: string;
  budget_max: string;
  move_in_date: string;
  lease_duration: string;
  cleanliness: number;
  noise_level: number;
  guests_frequency: number;
  smoking: boolean;
  schedule: string;
  needs_furnished: boolean;
  needs_parking: boolean;
  needs_laundry: boolean;
  needs_pets_allowed: boolean;
  needs_ac: boolean;
  needs_utilities_included: boolean;
  bio: string;
};

type SeekerFormErrors = Partial<Record<'city' | 'state' | 'budget_min' | 'budget_max', string>>;

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

function validateForm(form: SeekerForm): SeekerFormErrors {
  const errors: SeekerFormErrors = {};
  const budgetMin = Number(form.budget_min);
  const budgetMax = Number(form.budget_max);

  if (!form.city.trim()) errors.city = 'Enter the city where you want to live.';
  if (!form.state) errors.state = 'Select the state you want to live in.';
  if (!form.budget_min || Number.isNaN(budgetMin) || budgetMin <= 0) {
    errors.budget_min = 'Enter a valid minimum budget above 0.';
  }
  if (!form.budget_max || Number.isNaN(budgetMax) || budgetMax <= 0) {
    errors.budget_max = 'Enter a valid maximum budget above 0.';
  } else if (!errors.budget_min && budgetMax < budgetMin) {
    errors.budget_max = 'Maximum budget cannot be lower than the minimum budget.';
  }

  return errors;
}

export default function PostSeekerPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [form, setForm] = useState<SeekerForm>({
    city: '',
    state: '',
    budget_min: '',
    budget_max: '',
    move_in_date: '',
    lease_duration: 'flexible',
    cleanliness: 3,
    noise_level: 3,
    guests_frequency: 3,
    smoking: false,
    schedule: 'flexible',
    needs_furnished: false,
    needs_parking: false,
    needs_laundry: false,
    needs_pets_allowed: false,
    needs_ac: false,
    needs_utilities_included: false,
    bio: '',
  });
  const [errors, setErrors] = useState<SeekerFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = <K extends keyof SeekerForm>(key: K, value: SeekerForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as keyof SeekerFormErrors];
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
      trackEvent('match_post_redirected_to_login', { post_type: 'seeker' });
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      trackEvent('match_seeker_post_started', { state: form.state, furnished: form.needs_furnished });
      await createSeekerPost({
        seeker_id: data.user.id,
        city: form.city.trim(),
        state: form.state,
        budget_min: Number(form.budget_min),
        budget_max: Number(form.budget_max),
        move_in_date: form.move_in_date || undefined,
        lease_duration: form.lease_duration,
        cleanliness: form.cleanliness,
        noise_level: form.noise_level,
        guests_frequency: form.guests_frequency,
        smoking: form.smoking,
        schedule: form.schedule,
        needs_furnished: form.needs_furnished,
        needs_parking: form.needs_parking,
        needs_laundry: form.needs_laundry,
        needs_pets_allowed: form.needs_pets_allowed,
        needs_ac: form.needs_ac,
        needs_utilities_included: form.needs_utilities_included,
        bio: form.bio.trim() || undefined,
      });
      trackEvent('match_seeker_post_completed', { state: form.state, city: form.city.trim() });
      router.push('/match/my-matches');
    } catch (err) {
      trackEvent('match_seeker_post_failed', { state: form.state });
      setSubmitError(err instanceof Error ? err.message : 'Failed to create seeker post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold sm:text-4xl">Post your flatmate search</h1>
        <p className="max-w-3xl text-sm text-white/65">
          Use this form if you need a room, apartment, or roommate. The questions below help other
          renters understand your budget, timeline, and living style.
        </p>
      </div>

      <SafetyNotice title="Trust and safety">
        Keep first contact on RentPilot. Public seeker posts should not include phone numbers, email addresses,
        or payment handles, and those details may be removed automatically if you include them.
      </SafetyNotice>

      {submitError ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {submitError}
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">1. Where do you want to live?</h2>
          <p className="text-sm text-white/55">
            Start with the area you are targeting so we can show relevant listings.
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
          <Field label="State" hint="Choose the state you are targeting" error={errors.state}>
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
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">2. What can you afford and when do you want to move?</h2>
          <p className="text-sm text-white/55">
            This helps other people know whether your budget and timeline fit their listing.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Minimum monthly budget" hint="The lowest amount you would realistically pay" error={errors.budget_min}>
            <Input
              type="number"
              min="1"
              value={form.budget_min}
              onChange={(e) => updateField('budget_min', e.target.value)}
              aria-invalid={Boolean(errors.budget_min)}
            />
          </Field>
          <Field label="Maximum monthly budget" hint="The highest amount you can pay for your share" error={errors.budget_max}>
            <Input
              type="number"
              min="1"
              value={form.budget_max}
              onChange={(e) => updateField('budget_max', e.target.value)}
              aria-invalid={Boolean(errors.budget_max)}
            />
          </Field>
          <Field label="Target move-in date" hint="When you would ideally move into a place">
            <Input
              type="date"
              value={form.move_in_date}
              onChange={(e) => updateField('move_in_date', e.target.value)}
            />
          </Field>
          <Field label="Preferred lease length" hint="How long you want the arrangement to last">
            <Select value={form.lease_duration} onChange={(e) => updateField('lease_duration', e.target.value)}>
              {LEASE_DURATION_OPTIONS.map((option) => (
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
          <h2 className="text-lg font-semibold text-white">3. What is your living style?</h2>
          <p className="text-sm text-white/55">
            Use 1 for low and 5 for high. These numbers help with roommate compatibility.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Slider
            label="How clean are you? (1 = relaxed, 5 = very tidy)"
            min={1}
            max={5}
            value={form.cleanliness}
            onChange={(e) => updateField('cleanliness', Number(e.target.value))}
          />
          <Slider
            label="How much noise is okay for you? (1 = very quiet, 5 = lively/noisy is fine)"
            min={1}
            max={5}
            value={form.noise_level}
            onChange={(e) => updateField('noise_level', Number(e.target.value))}
          />
          <Slider
            label="How often do you expect guests? (1 = rarely, 5 = often)"
            min={1}
            max={5}
            value={form.guests_frequency}
            onChange={(e) => updateField('guests_frequency', Number(e.target.value))}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Your schedule" hint="This helps us compare you with poster preferences.">
            <Select value={form.schedule} onChange={(e) => updateField('schedule', e.target.value)}>
              {SCHEDULE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="text-black">
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Smoker</p>
              <p className="text-xs text-white/50">Turn this on only if smoking is part of your living setup.</p>
            </div>
            <Switch checked={form.smoking} onChange={(e) => updateField('smoking', e.target.checked)} />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">4. What must the home include?</h2>
          <p className="text-sm text-white/55">Turn on the features you really need in the place you move into.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Need furnished</p>
              <p className="text-xs text-white/50">You want the room or apartment to come with furniture.</p>
            </div>
            <Switch checked={form.needs_furnished} onChange={(e) => updateField('needs_furnished', e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Need parking</p>
              <p className="text-xs text-white/50">You need a place to park regularly.</p>
            </div>
            <Switch checked={form.needs_parking} onChange={(e) => updateField('needs_parking', e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Need laundry</p>
              <p className="text-xs text-white/50">You want a washer/dryer in-unit or on-site.</p>
            </div>
            <Switch checked={form.needs_laundry} onChange={(e) => updateField('needs_laundry', e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Need pets allowed</p>
              <p className="text-xs text-white/50">You need a pet-friendly lease or building.</p>
            </div>
            <Switch checked={form.needs_pets_allowed} onChange={(e) => updateField('needs_pets_allowed', e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Need air conditioning</p>
              <p className="text-xs text-white/50">Useful if you are filtering for AC-compatible spaces.</p>
            </div>
            <Switch checked={form.needs_ac} onChange={(e) => updateField('needs_ac', e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div>
              <p className="font-medium text-white">Need utilities included</p>
              <p className="text-xs text-white/50">You want rent to include some or all utilities.</p>
            </div>
            <Switch checked={form.needs_utilities_included} onChange={(e) => updateField('needs_utilities_included', e.target.checked)} />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">5. Tell people about yourself</h2>
          <p className="text-sm text-white/55">
            Share your work or school routine, habits, roommate expectations, and what kind of home you are hoping to find.
          </p>
        </div>
        <Textarea
          placeholder="Example: I work downtown, keep common areas clean, and want a calm apartment near public transit. I’m looking for respectful roommates who communicate clearly."
          value={form.bio}
          onChange={(e) => updateField('bio', e.target.value)}
        />
      </section>

      <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Creating seeker post...' : 'Create seeker post'}
      </Button>
    </div>
  );
}
