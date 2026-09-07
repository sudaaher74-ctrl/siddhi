import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

/**
 * Proxies Google OAuth sign-in against the backend and stores the returned token
 * in an httpOnly cookie on this domain.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
  } catch (error) {
    console.error('Google auth proxy failed:', error);
    return NextResponse.json({ message: 'Could not reach the authentication server' }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.token) {
    return NextResponse.json(
      { message: data.message || 'Google authentication failed' },
      { status: res.status || 401 }
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
