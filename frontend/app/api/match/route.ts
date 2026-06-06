import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = `${BACKEND_URL}${url.pathname.replace('/api', '')}${url.search}`;
  const res = await fetch(target);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const target = `${BACKEND_URL}${url.pathname.replace('/api', '')}`;
  const body = await req.json();
  const res = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
