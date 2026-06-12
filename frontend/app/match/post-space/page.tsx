'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSpacePost } from '@/lib/api';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {hint ? <p className="text-xs text-white/55">{hint}</p> : null}
      </div>
      {children}
    </label>
  );
}

export default function PostSpacePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [form, setForm] = useState({
    city: '',
    state: '',
    zip: '',
    apartment_type: '2bhk',
    total_rent: 0,
    your_share: 0,
    rooms_available: 1,
    lease_type: 'existing',
    lease_duration: 'flexible',
    move_in_date: '',
    is_furnished: false,
    has_parking: false,
    has_laundry: false,
    pets_allowed: false,
    has_ac: false,
    has_gym: false,
    utilities_included: false,
    pref_cleanliness: 3,
    pref_noise_tolerance: 3,
    pref_guests_frequency: 3,
    pref_smoking_ok: false,
    pref_schedule: 'flexible',
    pref_gender: 'any',
    description: '',
  });

  const updateField = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push('/login');
      return;
    }
    try {
      await createSpacePost({
        ...form,
        poster_id: data.user.id,
        total_rent: Number(form.total_rent),
        your_share: Number(form.your_share),
        rooms_available: Number(form.rooms_available),
        pref_cleanliness: Number(form.pref_cleanliness),
        pref_noise_tolerance: Number(form.pref_noise_tolerance),
        pref_guests_frequency: Number(form.pref_guests_frequency),
      });
      router.push('/match/my-matches');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create space post');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Post your room or apartment</h1>
        <p className="max-w-3xl text-sm text-white/65">
          Use this form if you already have a place and want to find a roommate or flatmate.
          Fill in the details below so seekers understand the home, the cost, and what kind of
          person would be a good fit.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">1. Where is the place?</h2>
          <p className="text-sm text-white/55">These details help us show your listing to people searching in the same area.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="City" hint="Example: Chicago">
            <Input value={form.city} onChange={(e) => updateField('city', e.target.value)} />
          </Field>
          <Field label="State" hint="Example: IL">
            <Input value={form.state} onChange={(e) => updateField('state', e.target.value)} />
          </Field>
          <Field label="ZIP code" hint="Optional, but helps with more accurate matching">
            <Input value={form.zip} onChange={(e) => updateField('zip', e.target.value)} />
          </Field>
          <Field label="Apartment type" hint="Choose the kind of place you are offering">
            <Select value={form.apartment_type} onChange={(e) => updateField('apartment_type', e.target.value)}>
              <option value="studio" className="text-black">Studio</option>
              <option value="1bhk" className="text-black">1 bedroom apartment</option>
              <option value="2bhk" className="text-black">2 bedroom apartment</option>
              <option value="3bhk" className="text-black">3 bedroom apartment</option>
              <option value="room_only" className="text-black">Private room only</option>
            </Select>
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">2. What are the lease and cost details?</h2>
          <p className="text-sm text-white/55">Be clear about rent and timing so people know whether the place fits their budget and move-in plan.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Total apartment rent" hint="The full monthly rent for the unit">
            <Input
              type="number"
              value={form.total_rent}
              onChange={(e) => updateField('total_rent', e.target.value)}
            />
          </Field>
          <Field label="Roommate's expected share" hint="How much the new person would pay each month">
            <Input
              type="number"
              value={form.your_share}
              onChange={(e) => updateField('your_share', e.target.value)}
            />
          </Field>
          <Field label="How many roommates are you looking for?" hint="Usually 1 unless you need multiple people">
            <Input
              type="number"
              value={form.rooms_available}
              onChange={(e) => updateField('rooms_available', e.target.value)}
            />
          </Field>
          <Field label="Lease situation" hint="Tell people whether they would join your lease, co-sign a new one, or sublet">
            <Select value={form.lease_type} onChange={(e) => updateField('lease_type', e.target.value)}>
              <option value="existing" className="text-black">Join my existing lease</option>
              <option value="new_cosign" className="text-black">Sign a new lease together</option>
              <option value="sublet" className="text-black">Sublet / short replacement</option>
            </Select>
          </Field>
          <Field label="Preferred lease length" hint="How long you want the roommate to stay">
            <Select value={form.lease_duration} onChange={(e) => updateField('lease_duration', e.target.value)}>
              <option value="short_term" className="text-black">Short-term</option>
              <option value="long_term" className="text-black">Long-term</option>
              <option value="flexible" className="text-black">Flexible</option>
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
          <p className="text-sm text-white/55">Use 1 for low and 5 for high. These help RentSafe suggest better matches.</p>
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
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">5. Describe the place in your own words</h2>
          <p className="text-sm text-white/55">Mention neighborhood vibe, room size, commute, house rules, and the kind of roommate you hope to find.</p>
        </div>
        <Textarea
          placeholder="Example: Sunny private room in a 2-bedroom apartment near downtown. Looking for a respectful roommate who is clean, communicates well, and is okay with an occasional guest."
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
        />
      </section>

      <Button onClick={handleSubmit}>Create space post</Button>
    </div>
  );
}
