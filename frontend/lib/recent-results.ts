/**
 * Client-side persistence for recent tool results.
 *
 * Anonymous users get their last 3 results per tool stored in localStorage
 * with a 7-day TTL. Authenticated users still get this as a fast local cache,
 * but their canonical history lives in the backend DB.
 *
 * Shape is intentionally minimal — just enough to render a useful "Recent"
 * list without re-running the analysis.
 */

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_ITEMS = 3;

const KEYS = {
  leases: 'rp_recent_leases',
  scams: 'rp_recent_scams',
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RecentLeaseResult {
  id: string;            // client-generated UUID
  file_name: string;
  score: number;         // tenant_friendly_score
  score_label: string;   // 'Tenant-friendly' | 'Mixed' | 'Landlord-heavy'
  flag_count: number;
  summary: string;
  saved_at: number;      // Date.now()
  /** Full analysis result — stored so detail views work without re-upload */
  result: Record<string, unknown>;
}

export interface RecentScamResult {
  id: string;
  snippet: string;       // first 80 chars of listing_input
  scam_score: number;
  verdict: string;
  flag_count: number;
  saved_at: number;
  result: Record<string, unknown>;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function readItems<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const items: (T & { saved_at: number })[] = JSON.parse(raw);
    const cutoff = Date.now() - TTL_MS;
    return items.filter((item) => item.saved_at > cutoff);
  } catch {
    return [];
  }
}

function writeItems<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Lease results ────────────────────────────────────────────────────────────

export function saveRecentLease(
  fileName: string,
  result: Record<string, unknown>,
): RecentLeaseResult {
  const score = (result.tenant_friendly_score as number) ?? 0;
  const item: RecentLeaseResult = {
    id: generateId(),
    file_name: fileName,
    score,
    score_label: score >= 7 ? 'Tenant-friendly' : score >= 4 ? 'Mixed' : 'Landlord-heavy',
    flag_count: ((result.red_flags as unknown[]) ?? []).length,
    summary: (result.summary as string) ?? '',
    saved_at: Date.now(),
    result,
  };
  const existing = readItems<RecentLeaseResult>(KEYS.leases);
  writeItems(KEYS.leases, [item, ...existing]);
  return item;
}

export function getRecentLeases(): RecentLeaseResult[] {
  return readItems<RecentLeaseResult>(KEYS.leases);
}

export function clearRecentLeases(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(KEYS.leases);
}

// ─── Scam results ─────────────────────────────────────────────────────────────

export function saveRecentScam(
  listingText: string,
  result: Record<string, unknown>,
): RecentScamResult {
  const item: RecentScamResult = {
    id: generateId(),
    snippet: listingText.trim().slice(0, 80),
    scam_score: (result.scam_score as number) ?? 0,
    verdict: (result.verdict as string) ?? 'suspicious',
    flag_count: ((result.red_flags as unknown[]) ?? []).length,
    saved_at: Date.now(),
    result,
  };
  const existing = readItems<RecentScamResult>(KEYS.scams);
  writeItems(KEYS.scams, [item, ...existing]);
  return item;
}

export function getRecentScams(): RecentScamResult[] {
  return readItems<RecentScamResult>(KEYS.scams);
}

export function clearRecentScams(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(KEYS.scams);
}

// ─── Combined recent activity (for dashboard / history pages) ─────────────────

export function hasRecentActivity(): boolean {
  return getRecentLeases().length > 0 || getRecentScams().length > 0;
}
