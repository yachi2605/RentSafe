import { supabase } from '@/lib/supabase';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function ensureOk(res: Response, fallback: string): Promise<Response> {
  if (res.ok) return res;
  let detail = fallback;
  try {
    const body = await res.json();
    if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
  } catch {
    // response body wasn't JSON; keep fallback message
  }
  throw new Error(detail);
}

async function authHeaders(contentType = 'application/json') {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function analyzeLease(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BACKEND_URL}/lease/analyze`, {
    method: 'POST',
    body: form,
    headers: await authHeaders(''),
  });
  await ensureOk(res, 'Lease analysis failed');
  return res.json();
}

export async function checkScam(listingText: string) {
  const res = await fetch(`${BACKEND_URL}/scam/check`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ listing_text: listingText }),
  });
  await ensureOk(res, 'Scam check failed');
  return res.json();
}

export async function askTenantRights(question: string, state: string) {
  const res = await fetch(`${BACKEND_URL}/rights/ask`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ question, state }),
  });
  await ensureOk(res, 'Rights query failed');
  return res.json();
}

export async function createSpacePost(data: object) {
  const res = await fetch(`${BACKEND_URL}/match/spaces`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  await ensureOk(res, 'Failed to create space post');
  return res.json();
}

export async function createSeekerPost(data: object) {
  const res = await fetch(`${BACKEND_URL}/match/seekers`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  await ensureOk(res, 'Failed to create seeker post');
  return res.json();
}

export async function getMyMatches(userId: string) {
  const res = await fetch(`${BACKEND_URL}/match/my-matches/${userId}`, {
    headers: await authHeaders(''),
  });
  await ensureOk(res, 'Failed to fetch matches');
  return res.json();
}

export async function listSpacePosts(city?: string, state?: string, maxRent?: number) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (state) params.set('state', state);
  if (maxRent) params.set('max_rent', String(maxRent));
  const res = await fetch(`${BACKEND_URL}/match/spaces?${params}`, {
    headers: await authHeaders(''),
  });
  await ensureOk(res, 'Failed to fetch space posts');
  return res.json();
}

export async function listSeekerPosts(city?: string, state?: string) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (state) params.set('state', state);
  const res = await fetch(`${BACKEND_URL}/match/seekers?${params}`, {
    headers: await authHeaders(''),
  });
  await ensureOk(res, 'Failed to fetch seeker posts');
  return res.json();
}

export async function getMessages(matchId: string) {
  const res = await fetch(`${BACKEND_URL}/match/${matchId}/messages`, {
    headers: await authHeaders(''),
  });
  await ensureOk(res, 'Failed to load messages');
  return res.json();
}

export async function sendMessage(matchId: string, content: string) {
  const res = await fetch(`${BACKEND_URL}/match/${matchId}/messages`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ content }),
  });
  await ensureOk(res, 'Failed to send message');
  return res.json();
}
