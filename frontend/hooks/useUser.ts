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
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('archerx_user');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.name && parsed.name !== 'Local Dev User') {
            return parsed;
          }
        }
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const data = await apiFetch<UserProfile>('/api/auth/me', { skipAuthRedirect: true });
      if (data && data.name) {
        setUser(data);
        try {
          localStorage.setItem('archerx_user', JSON.stringify(data));
        } catch {}
        return data;
      }
      return null;
    } catch (error) {
      console.warn('Failed to fetch user', error);
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

