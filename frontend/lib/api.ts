/**
 * Single place that knows how to talk to the API.
 *
 * Browser code calls same-origin `/api/...` routes, which are proxied by
 * `app/api/[...path]/route.ts`. That proxy attaches the auth token from an
 * httpOnly cookie, so no page script ever handles the token.
 *
 * Server components call the backend directly via `serverFetch`, reading the
 * same httpOnly cookie on the server.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const parseError = async (res: Response): Promise<string> => {
  try {
    const body = await res.json();
    return body?.message || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
};

/**
 * Browser-side fetch. `path` is an API path such as `/api/sessions`.
 * Throws ApiError on a non-2xx response so callers can show a real message.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const hasBody = options.body !== undefined;

  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/login';
    throw new ApiError('Your session expired. Please sign in again.', 401);
  }

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const apiPut = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });

export const apiDelete = <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' });
