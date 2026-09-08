import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string;
  hasGoogleAuth?: boolean;
  createdAt?: string;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // The auth cookie is httpOnly, so we can't check it here — just ask
      // the API. `apiFetch` redirects to /login on a 401.
      const data = await apiFetch<UserProfile>('/api/auth/me');
      setUser(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch user', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, loading, refreshUser: fetchUser, setUser };
}

