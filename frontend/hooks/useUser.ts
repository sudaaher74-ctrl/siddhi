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
      // Login system removed for local dev
      const mockUser = {
        _id: 'mock-user-id',
        name: 'Local Dev User',
        email: 'dev@localhost.com',
        role: 'admin',
      };
      setUser(mockUser);
      return mockUser;
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

