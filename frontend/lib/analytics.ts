'use client';

type AnalyticsValue = string | number | boolean;
type AnalyticsPayload = Record<string, AnalyticsValue | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, AnalyticsValue>>;
    gtag?: (command: 'event', eventName: string, params?: Record<string, AnalyticsValue>) => void;
    plausible?: (eventName: string, options?: { props?: Record<string, AnalyticsValue> }) => void;
  }
}

function normalizePayload(payload: AnalyticsPayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null && value !== undefined),
  ) as Record<string, AnalyticsValue>;
}

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined') return;

  const props = normalizePayload(payload);
  let delivered = false;

  if (typeof window.plausible === 'function') {
    window.plausible(eventName, { props });
    delivered = true;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, props);
    delivered = true;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...props });
    delivered = true;
  }

  if (!delivered && process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', eventName, props);
  }
}
