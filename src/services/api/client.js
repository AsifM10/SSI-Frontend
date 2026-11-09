/**
 * Centralized API Client for SSI Frontend (React JavaScript)
 * Supports HttpOnly Cookie Sessions, Bearer Headers, Sliding Refresh Tokens, and Normalized Error Handling
 */

import axios from 'axios';

// Detect API base URL from Vite environment variables or fallback to the live server
const getBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return '/api/v1';
};

export const API_BASE_URL = getBaseUrl();

// Active manual token store (used for Headless Agent Tokens, CLI scripts, or onboarding)
let manualToken = null;
let onSessionExpiredCallback = null;

export const setManualAuthToken = (token) => {
  manualToken = token;
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
  }
};

export const getManualAuthToken = () => {
  return manualToken || localStorage.getItem('token') || localStorage.getItem('accessToken') || null;
};

export const setSessionExpiredHandler = (callback) => {
  onSessionExpiredCallback = callback;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // CRITICAL: Ensures browser sends HttpOnly 'apiKey' / session cookie
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CRITICAL: Backend CSRF Protection
  },
});

// Request Interceptor: Attach Bearer token and X-API-KEY if present
apiClient.interceptors.request.use(
  (config) => {
    if (!config.url || config.url === '/' || config.url === '') {
      console.warn("Prevented blank API call to root baseURL:", config);
      return Promise.reject(new Error("Empty API endpoint path is not allowed."));
    }
    let token = manualToken || localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token && typeof token === 'string' && (token.startsWith('token-') || token.startsWith('mock-'))) {
      token = null;
    }
    if (token) {
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (!config.headers['X-API-KEY'] && !config.headers['x-api-key']) {
        config.headers['X-API-KEY'] = token;
      }
    }
    if (!config.headers['X-Requested-With']) {
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Capture auth tokens, sliding session renewals, and handle 401 Session Expirations
apiClient.interceptors.response.use(
  (response) => {
    // 1. Capture extracted auth token from proxy or sliding refresh
    const incomingToken =
      response.headers?.['x-auth-token'] ||
      response.headers?.['x-new-access-token'] ||
      response.data?.data?.accessToken ||
      response.data?.data?.token ||
      response.data?.data?.apiKey ||
      response.data?.accessToken ||
      response.data?.token ||
      response.data?.apiKey;

    if (incomingToken && typeof incomingToken === 'string' && !incomingToken.startsWith('mock-')) {
      setManualAuthToken(incomingToken);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const errorData = error.response?.data;

    // Handle session expiration
    if (status === 401) {
      if (
        errorData?.code === 'SESSION_EXPIRED' ||
        errorData?.code === 'INVALID_API_KEY' ||
        errorData?.message?.toLowerCase().includes('session has expired')
      ) {
        if (onSessionExpiredCallback) {
          onSessionExpiredCallback();
        }
      }
    }

    // Build standardized API error object
    const normalizedError = {
      success: false,
      status: status || error.response?.status,
      statusCode: status || error.response?.status,
      code: errorData?.code || `HTTP_${status || 'UNKNOWN'}`,
      message: errorData?.message || error.message || 'An unexpected network error occurred.',
      details: errorData?.details,
      suggestedAction: errorData?.suggestedAction,
      response: error.response,
    };

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
