'use client';

import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface LeaseUploaderProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

export default function LeaseUploader({ onFileSelected, isLoading }: LeaseUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(
    (file?: File) => {
      if (!file) return;
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
      <p className="mb-4 text-sm text-white/70">
        Drag and drop your lease PDF here, or click to upload.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={isLoading}>
        {isLoading ? 'Analyzing...' : 'Upload Lease PDF'}
      </Button>
    </div>
  );
}
