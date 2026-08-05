import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // The auth cookie is httpOnly, so we can't check it here — just ask
        // the API. `apiFetch` redirects to /login on a 401.
        setUser(await apiFetch<UserProfile>('/api/auth/me'));
      } catch (error) {
        console.error('Failed to fetch user', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}
