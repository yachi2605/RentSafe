export function formatHistoryDate(value: string) {
  if (!value) return 'Saved recently';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Saved recently';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function truncateText(value: string, maxLength = 160) {
  const normalized = value.trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function formatVerdictLabel(verdict: string) {
  return verdict.replaceAll('_', ' ');
}

export function verdictTone(verdict: string): 'green' | 'amber' | 'red' {
  if (verdict === 'likely_scam') return 'red';
  if (verdict === 'suspicious') return 'amber';
  return 'green';
}

export function leaseScoreTone(score: number): 'green' | 'amber' | 'red' {
  if (score >= 7) return 'green';
  if (score >= 4) return 'amber';
  return 'red';
}

export function leaseScoreLabel(score: number) {
  if (score >= 7) return 'Tenant-friendly';
  if (score >= 4) return 'Mixed';
  return 'Landlord-heavy';
}
