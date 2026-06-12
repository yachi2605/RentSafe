'use client';

import { useState } from 'react';
import LeaseUploader from '@/components/LeaseUploader';
import LeaseResultCard from '@/components/LeaseResultCard';
import { analyzeLease } from '@/lib/api';
import { LeaseAnalysisResult } from '@/types';

export default function LeaseAnalyzerPage() {
  const [result, setResult] = useState<LeaseAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await analyzeLease(file);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lease analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Lease Analyzer</h1>
        <p className="text-sm text-white/60">Upload a lease PDF and get a renter-friendly breakdown.</p>
      </div>
      <LeaseUploader onFileSelected={handleUpload} isLoading={loading} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {result && <LeaseResultCard result={result} />}
    </div>
  );
}
