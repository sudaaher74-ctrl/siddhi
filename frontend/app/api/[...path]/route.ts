import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '@/lib/api';

/**
 * Same-origin proxy to the backend API.
 *
 * The browser never sees the auth token: it lives in an httpOnly cookie on
 * this domain, and is attached here as a Bearer header on the server side.
 */
async function proxy(request: NextRequest, path: string[]) {
  const token = (await cookies()).get('token')?.value;
  const target = `${API_URL}/api/${path.join('/')}${request.nextUrl.search}`;

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const contentType = request.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;

  const method = request.method;
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();

  try {
    const res = await fetch(target, { method, headers, body, cache: 'no-store' });
    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error(`Proxy to ${target} failed:`, error);
    return NextResponse.json({ message: 'Could not reach the server' }, { status: 502 });
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function POST(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function PUT(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function DELETE(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
