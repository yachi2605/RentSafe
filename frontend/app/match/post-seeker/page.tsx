'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSeekerPost } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

export default function PostSeekerPage() {
  const router = useRouter();
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
    if (!data.user) return;
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
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Post a seeker</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="City" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
        <Input placeholder="State" value={form.state} onChange={(e) => updateField('state', e.target.value)} />
        <Input
          placeholder="Budget min"
          type="number"
          value={form.budget_min}
          onChange={(e) => updateField('budget_min', e.target.value)}
        />
        <Input
          placeholder="Budget max"
          type="number"
          value={form.budget_max}
          onChange={(e) => updateField('budget_max', e.target.value)}
        />
        <Input
          placeholder="Move-in date"
          type="date"
          value={form.move_in_date}
          onChange={(e) => updateField('move_in_date', e.target.value)}
        />
        <Select value={form.lease_duration} onChange={(e) => updateField('lease_duration', e.target.value)}>
          <option value="short_term" className="text-black">Short-term</option>
          <option value="long_term" className="text-black">Long-term</option>
          <option value="flexible" className="text-black">Flexible</option>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Slider
          label="Cleanliness"
          min={1}
          max={5}
          value={form.cleanliness}
          onChange={(e) => updateField('cleanliness', Number(e.target.value))}
        />
        <Slider
          label="Noise level"
          min={1}
          max={5}
          value={form.noise_level}
          onChange={(e) => updateField('noise_level', Number(e.target.value))}
        />
        <Slider
          label="Guests frequency"
          min={1}
          max={5}
          value={form.guests_frequency}
          onChange={(e) => updateField('guests_frequency', Number(e.target.value))}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex items-center gap-3 text-sm text-white/70">
          <Switch checked={form.needs_furnished} onChange={(e) => updateField('needs_furnished', e.target.checked)} />
          Needs furnished
        </label>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <Switch checked={form.needs_parking} onChange={(e) => updateField('needs_parking', e.target.checked)} />
          Needs parking
        </label>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <Switch checked={form.needs_laundry} onChange={(e) => updateField('needs_laundry', e.target.checked)} />
          Needs laundry
        </label>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <Switch checked={form.needs_pets_allowed} onChange={(e) => updateField('needs_pets_allowed', e.target.checked)} />
          Needs pets allowed
        </label>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <Switch checked={form.needs_utilities_included} onChange={(e) => updateField('needs_utilities_included', e.target.checked)} />
          Utilities included
        </label>
      </div>

      <Textarea
        placeholder="Share your lifestyle, preferences, and move-in goals."
        value={form.bio}
        onChange={(e) => updateField('bio', e.target.value)}
      />

      <Button onClick={handleSubmit}>Create seeker post</Button>
    </div>
  );
}
