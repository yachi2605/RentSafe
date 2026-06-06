import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  const formData = await req.formData();
  const res = await fetch(`${BACKEND_URL}/lease/analyze`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
