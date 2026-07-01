'use client';

/**
 * Soft save-prompt shown to anonymous users after a successful tool result.
 *
 * Design intent:
 * - Dismissible (once dismissed, stays gone for the session via sessionStorage)
 * - Non-blocking — sits below the result, never intercepts the workflow
 * - Clear value prop: save to account = permanent access + match feature
 * - Links to /signup with a ?next= param so they return to their current tool
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookmarkPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISSED_KEY = 'rp_save_prompt_dismissed';

interface SaveResultsPromptProps {
  /** Extra context shown in the subtitle — e.g. "this lease analysis" */
  context?: string;
}

export default function SaveResultsPrompt({ context = 'this result' }: SaveResultsPromptProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show once per browser session.
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  const signupHref = `/signup?next=${encodeURIComponent(pathname)}`;

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-brand-green/20 bg-brand-green/5 p-5">
      <span className="mt-0.5 rounded-xl border border-brand-green/25 bg-brand-green/10 p-2 text-brand-green">
        <BookmarkPlus size={18} strokeWidth={1.75} />
      </span>

      <div className="flex-1 space-y-1">
        <p className="font-semibold text-white">Save {context} permanently</p>
        <p className="text-sm leading-relaxed text-white/60">
          Create a free account to access {context} later, track all your analyses, and unlock roommate matching.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link href={signupHref}>
            <Button className="h-9 px-4 text-sm">Create free account</Button>
          </Link>
          <Link href="/login" className="text-sm text-white/50 hover:text-white/80 transition-colors">
            Already have one? Sign in
          </Link>
        </div>
      </div>

      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg p-1 text-white/30 transition hover:text-white/60"
      >
        <X size={16} />
      </button>
    </div>
  );
}
