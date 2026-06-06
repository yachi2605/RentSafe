const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function analyzeLease(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BACKEND_URL}/lease/analyze`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Lease analysis failed');
  return res.json();
}

export async function checkScam(listingText: string) {
  const res = await fetch(`${BACKEND_URL}/scam/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_text: listingText }),
  });
  if (!res.ok) throw new Error('Scam check failed');
  return res.json();
}

export async function askTenantRights(question: string, state: string) {
  const res = await fetch(`${BACKEND_URL}/rights/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, state }),
  });
  if (!res.ok) throw new Error('Rights query failed');
  return res.json();
}

export async function createSpacePost(data: object) {
  const res = await fetch(`${BACKEND_URL}/match/spaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create space post');
  return res.json();
}

export async function createSeekerPost(data: object) {
  const res = await fetch(`${BACKEND_URL}/match/seekers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create seeker post');
  return res.json();
}

export async function getMyMatches(userId: string) {
  const res = await fetch(`${BACKEND_URL}/match/my-matches/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

export async function listSpacePosts(city?: string, state?: string, maxRent?: number) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (state) params.set('state', state);
  if (maxRent) params.set('max_rent', String(maxRent));
  const res = await fetch(`${BACKEND_URL}/match/spaces?${params}`);
  if (!res.ok) throw new Error('Failed to fetch space posts');
  return res.json();
}

export async function listSeekerPosts(city?: string, state?: string) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (state) params.set('state', state);
  const res = await fetch(`${BACKEND_URL}/match/seekers?${params}`);
  if (!res.ok) throw new Error('Failed to fetch seeker posts');
  return res.json();
}
