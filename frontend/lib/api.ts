import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  MatchBrowseFilters,
  Message,
  ReportTargetType,
  RightsAnswer,
  RightsCoverage,
  SavedLeaseAnalysis,
  SavedScamCheck,
} from '@/types';

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
  const supabase = createClientComponentClient();
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

export async function getProactiveQA(leaseText: string) {
  const res = await fetch(`${BACKEND_URL}/lease/proactive-qa`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ lease_text: leaseText }),
  });
  await ensureOk(res, 'Failed to generate Q&A');
  return res.json();
}

export async function askLeaseQuestionText(leaseText: string, question: string) {
  const res = await fetch(`${BACKEND_URL}/lease/ask-text`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ lease_text: leaseText, question }),
  });
  await ensureOk(res, 'Failed to get answer');
  return res.json() as Promise<{ answer: string; disclaimer: string }>;
}

export async function negotiateClause(clause: string, clauseText: string, explanation: string) {
  const res = await fetch(`${BACKEND_URL}/lease/negotiate-clause`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ clause, clause_text: clauseText, explanation }),
  });
  await ensureOk(res, 'Failed to generate email');
  return res.json() as Promise<{ subject: string; body: string }>;
}

export async function getMoveOutChecklist(leaseText: string) {
  const res = await fetch(`${BACKEND_URL}/lease/moveout-checklist`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ lease_text: leaseText }),
  });
  await ensureOk(res, 'Failed to generate checklist');
  return res.json();
}

export async function askLeaseQuestion(file: File, question: string) {
  const form = new FormData();
  form.append('file', file);
  form.append('question', question);
  const res = await fetch(`${BACKEND_URL}/lease/ask`, {
    method: 'POST',
    body: form,
    headers: await authHeaders(''),
  });
  await ensureOk(res, 'Failed to get answer');
  return res.json() as Promise<{ answer: string; disclaimer: string }>;
}

export async function getLeaseHistory(limit?: number) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  const res = await fetch(`${BACKEND_URL}/lease/history?${params}`, {
    headers: await authHeaders(''),
  });
  await ensureOk(res, 'Failed to load lease history');
  return res.json() as Promise<{ items: SavedLeaseAnalysis[] }>;
}

export async function getLeaseHistoryDetail(id: string) {
  const res = await fetch(`${BACKEND_URL}/lease/history/${id}`, {
    headers: await authHeaders(''),
  });
  await ensureOk(res, 'Failed to load lease analysis');
  return res.json() as Promise<SavedLeaseAnalysis>;
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

export async function getScamHistory(limit?: number) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  const res = await fetch(`${BACKEND_URL}/scam/history?${params}`, {
    headers: await authHeaders(''),
  });
  await ensureOk(res, 'Failed to load scam history');
  return res.json() as Promise<{ items: SavedScamCheck[] }>;
}

export async function getScamHistoryDetail(id: string) {
  const res = await fetch(`${BACKEND_URL}/scam/history/${id}`, {
    headers: await authHeaders(''),
  });
  await ensureOk(res, 'Failed to load scam check');
  return res.json() as Promise<SavedScamCheck>;
}

export async function askTenantRights(question: string, state: string) {
  const res = await fetch(`${BACKEND_URL}/rights/ask`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ question, state }),
  });
  await ensureOk(res, 'Rights query failed');
  return res.json() as Promise<RightsAnswer>;
}

export async function getTenantRightsCoverage() {
  const res = await fetch(`${BACKEND_URL}/rights/states`);
  await ensureOk(res, 'Failed to load rights coverage');
  return res.json() as Promise<RightsCoverage>;
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

function buildMatchFilterParams(filters?: MatchBrowseFilters) {
  const params = new URLSearchParams();
  if (!filters) return params;
  if (filters.city) params.set('city', filters.city);
  if (filters.state) params.set('state', filters.state);
  if (filters.budget !== undefined) params.set('budget', String(filters.budget));
  if (filters.move_in_by) params.set('move_in_by', filters.move_in_by);
  if (filters.furnished) params.set('furnished', 'true');
  if (filters.parking) params.set('parking', 'true');
  if (filters.laundry) params.set('laundry', 'true');
  if (filters.pets) params.set('pets', 'true');
  if (filters.ac) params.set('ac', 'true');
  return params;
}

export async function listSpacePosts(filters?: MatchBrowseFilters) {
  const params = buildMatchFilterParams(filters);
  const res = await fetch(`${BACKEND_URL}/match/spaces?${params}`, {
    headers: await authHeaders(''),
  });
  await ensureOk(res, 'Failed to fetch space posts');
  return res.json();
}

export async function listSeekerPosts(filters?: MatchBrowseFilters) {
  const params = buildMatchFilterParams(filters);
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
  return res.json() as Promise<Message>;
}

export async function createReport(data: {
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details?: string;
}) {
  const res = await fetch(`${BACKEND_URL}/match/reports`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  await ensureOk(res, 'Failed to submit report');
  return res.json() as Promise<{ message: string }>;
}
