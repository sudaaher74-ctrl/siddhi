import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use local network IP for Android emulator or localhost for iOS simulator
const getBaseUrl = () => {
  if (__DEV__) {
    // Android emulator loopback IP
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api';
    }
    // iOS simulator or web
    return 'http://localhost:5000/api';
  }
  // Production URL
  return 'https://api.siddhijournal.com/api'; // Replace with real production URL
};

export const API_URL = getBaseUrl();

export const getAuthToken = async () => {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const setAuthToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync('authToken', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

export const removeAuthToken = async () => {
  try {
    await SecureStore.deleteItemAsync('authToken');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};
