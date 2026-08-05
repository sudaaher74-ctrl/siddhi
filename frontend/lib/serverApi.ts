import 'server-only';
import { cookies } from 'next/headers';
import { API_URL } from './api';

/**
 * Fetches from the backend inside a server component, forwarding the auth
 * token from the httpOnly cookie. Returns `null` instead of throwing so pages
 * can render an empty state — never mock data, which hides real failures.
 */
export async function serverFetch<T>(path: string): Promise<T | null> {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return null;

    const res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`GET ${path} failed with ${res.status}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error(`GET ${path} failed:`, error);
    return null;
  }
}
