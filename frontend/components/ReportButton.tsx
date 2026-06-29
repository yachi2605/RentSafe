'use client';

import { useMemo, useState } from 'react';
import { createReport } from '@/lib/api';
import { ReportTargetType } from '@/types';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const REASON_OPTIONS = [
  { value: 'scam_or_fraud', label: 'Scam or fraud' },
  { value: 'harassment', label: 'Harassment or abusive language' },
  { value: 'discrimination', label: 'Discrimination or hate speech' },
  { value: 'unsafe_contact_request', label: 'Unsafe off-platform contact request' },
  { value: 'other', label: 'Other safety concern' },
];

interface ReportButtonProps {
  label: string;
  subjectLabel: string;
  targetId: string;
  targetType: ReportTargetType;
}

export default function ReportButton({
  label,
  subjectLabel,
  targetId,
  targetType,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASON_OPTIONS[0].value);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedLabel = useMemo(
    () => REASON_OPTIONS.find((option) => option.value === reason)?.label || 'safety issue',
    [reason]
  );

  const close = () => {
    setOpen(false);
    setError(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      trackEvent('report_submission_started', { target_type: targetType, reason });
      const response = await createReport({
        target_type: targetType,
        target_id: targetId,
        reason,
        details: details.trim() || undefined,
      });
      trackEvent('report_submission_completed', { target_type: targetType, reason });
      setSuccess(response.message || `Report submitted for ${subjectLabel}.`);
      setDetails('');
      close();
    } catch (err) {
      trackEvent('report_submission_failed', { target_type: targetType, reason });
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        onClick={() => {
          setOpen(true);
          trackEvent('report_dialog_opened', { target_type: targetType });
        }}
        className="rounded-full border border-white/15 px-3 py-1.5 text-xs"
      >
        {label}
      </Button>
      {success ? <p className="text-xs text-amber-200/80">{success}</p> : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-brand-navy p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Report {subjectLabel}</h2>
                <p className="mt-1 text-sm text-white/60">
                  Reports go into the moderation queue for review. Pick the closest reason and add context if needed.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1 text-white/40 hover:text-white/80"
                aria-label="Close report dialog"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="space-y-2">
                <p className="text-sm font-medium text-white">Reason</p>
                <Select value={reason} onChange={(event) => setReason(event.target.value)}>
                  {REASON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="text-black">
                      {option.label}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="space-y-2">
                <p className="text-sm font-medium text-white">Extra context</p>
                <Textarea
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder={`Optional details about the ${selectedLabel.toLowerCase()}...`}
                />
              </label>

              {error ? <p className="text-sm text-red-300">{error}</p> : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? 'Submitting...' : 'Submit report'}
                </Button>
                <Button variant="secondary" onClick={close} disabled={submitting} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
