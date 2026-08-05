import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

/**
 * Registers against the backend and stores the returned token in an httpOnly
 * cookie on this domain. The token is deliberately not returned to the page,
 * so an XSS cannot read it.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
  } catch (error) {
    console.error('Login proxy failed:', error);
    return NextResponse.json({ message: 'Could not reach the server' }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.token) {
    return NextResponse.json(
      { message: data.message || 'Could not create account' },
      { status: res.status || 400 }
    );
  }

  const response = NextResponse.json({ _id: data._id, email: data.email });
  response.cookies.set('token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: THIRTY_DAYS_SECONDS,
    path: '/',
  });

  return response;
}
