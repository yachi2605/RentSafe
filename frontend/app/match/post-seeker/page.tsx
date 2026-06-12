'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSeekerPost } from '@/lib/api';
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

export default function PostSeekerPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [form, setForm] = useState({
    city: '',
    state: '',
    budget_min: 0,
    budget_max: 0,
    move_in_date: '',
    lease_duration: 'flexible',
    cleanliness: 3,
    noise_level: 3,
    guests_frequency: 3,
    smoking: false,
    schedule: 'flexible',
    gender: 'prefer_not_to_say',
    needs_furnished: false,
    needs_parking: false,
    needs_laundry: false,
    needs_pets_allowed: false,
    needs_ac: false,
    needs_utilities_included: false,
    bio: '',
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
      await createSeekerPost({
        ...form,
        seeker_id: data.user.id,
        budget_min: Number(form.budget_min),
        budget_max: Number(form.budget_max),
        cleanliness: Number(form.cleanliness),
        noise_level: Number(form.noise_level),
        guests_frequency: Number(form.guests_frequency),
      });
      router.push('/match/my-matches');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create seeker post');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Post your flatmate search</h1>
        <p className="max-w-3xl text-sm text-white/65">
          Use this form if you need a room, apartment, or roommate. The questions below help other
          renters understand your budget, timeline, and living style.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">1. Where do you want to live?</h2>
          <p className="text-sm text-white/55">Start with the area you are targeting so we can show relevant listings.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="City" hint="Example: Chicago">
            <Input value={form.city} onChange={(e) => updateField('city', e.target.value)} />
          </Field>
          <Field label="State" hint="Example: IL">
            <Input value={form.state} onChange={(e) => updateField('state', e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">2. What can you afford and when do you want to move?</h2>
          <p className="text-sm text-white/55">This helps other people know whether your budget and timeline fit their listing.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Minimum monthly budget" hint="The lowest amount you would realistically pay">
            <Input
              type="number"
              value={form.budget_min}
              onChange={(e) => updateField('budget_min', e.target.value)}
            />
          </Field>
          <Field label="Maximum monthly budget" hint="The highest amount you can pay for your share">
            <Input
              type="number"
              value={form.budget_max}
              onChange={(e) => updateField('budget_max', e.target.value)}
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
              <option value="short_term" className="text-black">Short-term</option>
              <option value="long_term" className="text-black">Long-term</option>
              <option value="flexible" className="text-black">Flexible</option>
            </Select>
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">3. What is your living style?</h2>
          <p className="text-sm text-white/55">Use 1 for low and 5 for high. These numbers help with roommate compatibility.</p>
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
          <p className="text-sm text-white/55">Share your work or school routine, habits, roommate expectations, and what kind of home you are hoping to find.</p>
        </div>
        <Textarea
          placeholder="Example: I work downtown, keep common areas clean, and want a calm apartment near public transit. I’m looking for respectful roommates who communicate clearly."
          value={form.bio}
          onChange={(e) => updateField('bio', e.target.value)}
        />
      </section>

      <Button onClick={handleSubmit}>Create seeker post</Button>
    </div>
  );
}
