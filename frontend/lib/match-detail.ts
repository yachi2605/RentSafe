const LABEL_MAP: Record<string, string> = {
  studio: 'Studio',
  '1bhk': '1 BHK',
  '2bhk': '2 BHK',
  '3bhk': '3 BHK',
  room_only: 'Private room',
  existing: 'Join existing lease',
  new_cosign: 'Sign a new lease together',
  sublet: 'Sublet',
  short_term: 'Short-term',
  long_term: 'Long-term',
  flexible: 'Flexible',
  early_bird: 'Early bird',
  night_owl: 'Night owl',
};

export function formatLabel(value: string | undefined | null): string {
  if (!value) return 'Not specified';
  return LABEL_MAP[value] || value.replace(/_/g, ' ');
}

export function formatDate(value: string | undefined | null): string {
  if (!value) return 'Flexible';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export function formatBool(value: boolean, yes: string, no = 'Not included'): string {
  return value ? yes : no;
}
