'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSpacePost } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

export default function PostSpacePage() {
  const router = useRouter();
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
    if (!data.user) return;
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
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Post a space</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="City" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
        <Input placeholder="State" value={form.state} onChange={(e) => updateField('state', e.target.value)} />
        <Input placeholder="ZIP" value={form.zip} onChange={(e) => updateField('zip', e.target.value)} />
        <Select value={form.apartment_type} onChange={(e) => updateField('apartment_type', e.target.value)}>
          <option value="studio" className="text-black">Studio</option>
          <option value="1bhk" className="text-black">1BHK</option>
          <option value="2bhk" className="text-black">2BHK</option>
          <option value="3bhk" className="text-black">3BHK</option>
          <option value="room_only" className="text-black">Room only</option>
        </Select>
        <Input
          placeholder="Total rent"
          type="number"
          value={form.total_rent}
          onChange={(e) => updateField('total_rent', e.target.value)}
        />
        <Input
          placeholder="Your share"
          type="number"
          value={form.your_share}
          onChange={(e) => updateField('your_share', e.target.value)}
        />
        <Input
          placeholder="Rooms available"
          type="number"
          value={form.rooms_available}
          onChange={(e) => updateField('rooms_available', e.target.value)}
        />
        <Select value={form.lease_type} onChange={(e) => updateField('lease_type', e.target.value)}>
          <option value="existing" className="text-black">Existing lease</option>
          <option value="new_cosign" className="text-black">New co-sign</option>
          <option value="sublet" className="text-black">Sublet</option>
        </Select>
        <Select value={form.lease_duration} onChange={(e) => updateField('lease_duration', e.target.value)}>
          <option value="short_term" className="text-black">Short-term</option>
          <option value="long_term" className="text-black">Long-term</option>
          <option value="flexible" className="text-black">Flexible</option>
        </Select>
        <Input
          placeholder="Move-in date"
          type="date"
          value={form.move_in_date}
          onChange={(e) => updateField('move_in_date', e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex items-center gap-3 text-sm text-white/70">
          <Switch checked={form.is_furnished} onChange={(e) => updateField('is_furnished', e.target.checked)} />
          Furnished
        </label>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <Switch checked={form.has_parking} onChange={(e) => updateField('has_parking', e.target.checked)} />
          Parking
        </label>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <Switch checked={form.has_laundry} onChange={(e) => updateField('has_laundry', e.target.checked)} />
          Laundry
        </label>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <Switch checked={form.pets_allowed} onChange={(e) => updateField('pets_allowed', e.target.checked)} />
          Pets allowed
        </label>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <Switch checked={form.utilities_included} onChange={(e) => updateField('utilities_included', e.target.checked)} />
          Utilities included
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Slider
          label="Cleanliness"
          min={1}
          max={5}
          value={form.pref_cleanliness}
          onChange={(e) => updateField('pref_cleanliness', Number(e.target.value))}
        />
        <Slider
          label="Noise tolerance"
          min={1}
          max={5}
          value={form.pref_noise_tolerance}
          onChange={(e) => updateField('pref_noise_tolerance', Number(e.target.value))}
        />
        <Slider
          label="Guests frequency"
          min={1}
          max={5}
          value={form.pref_guests_frequency}
          onChange={(e) => updateField('pref_guests_frequency', Number(e.target.value))}
        />
      </div>

      <Textarea
        placeholder="Describe your space, room, and ideal roommate."
        value={form.description}
        onChange={(e) => updateField('description', e.target.value)}
      />

      <Button onClick={handleSubmit}>Create space post</Button>
    </div>
  );
}
