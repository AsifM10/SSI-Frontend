/**
 * Authentication & Onboarding API Functions (React JavaScript)
 */

import apiClient, { setManualAuthToken } from './client';
import { ENDPOINTS } from './endpoints';

export const authApi = {
  /**
   * Register a new user (Holder, Issuer, or Verifier)
   */
  async register(payload) {
    const res = await apiClient.post(ENDPOINTS.AUTH.REGISTER, payload);
    if (res.data?.data?.onboardingToken) {
      setManualAuthToken(res.data.data.onboardingToken);
    }
    return res.data;
  },

  /**
   * Check whether a username is still available during registration
   */
  async checkUsername(username) {
    const res = await apiClient.get(ENDPOINTS.AUTH.CHECK_USERNAME, {
      params: { username },
    });
    return res.data;
  },

  /**
   * Resend Email OTP
   */
  async resendOtp(params) {
    const res = await apiClient.post(ENDPOINTS.AUTH.RESEND_OTP, params);
    return res.data;
  },

  /**
   * Verify Email using 6-digit OTP
   */
  async verifyEmail(payload) {
    const res = await apiClient.post(ENDPOINTS.AUTH.VERIFY_EMAIL, payload);
    return res.data;
  },

  /**
   * Verify Offline Aadhaar eKYC ZIP or XML archive (multipart upload or base64)
   */
  async verifyOfflineEkyc(payload) {
    const formData = new FormData();
    formData.append('userId', payload.userId);
    if (payload.passcode || payload.shareCode) {
      formData.append('passcode', payload.passcode || payload.shareCode);
      formData.append('shareCode', payload.passcode || payload.shareCode);
    }
    if (payload.file) {
      formData.append('zipFile', payload.file);
    }
    if (payload.zipData) formData.append('zipData', payload.zipData);
    if (payload.xmlData) formData.append('xmlData', payload.xmlData);
    if (payload.name || payload.fullName) formData.append('name', payload.name || payload.fullName);
    if (payload.dob) formData.append('dob', payload.dob);

    const res = await apiClient.post(ENDPOINTS.AUTH.VERIFY_EKYC, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Direct Aadhaar XML verification without user account linkage
   */
  async verifyAadhaarDirect(payload) {
    const formData = new FormData();
    formData.append('passcode', payload.passcode || payload.shareCode || '');
    if (payload.file) formData.append('file', payload.file);
    if (payload.zipData) formData.append('zipData', payload.zipData);
    if (payload.xmlData) formData.append('xmlData', payload.xmlData);
    if (payload.name || payload.fullName) formData.append('name', payload.name || payload.fullName);
    if (payload.dob) formData.append('dob', payload.dob);

    const res = await apiClient.post(ENDPOINTS.AUTH.VERIFY_AADHAAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Change verification method during onboarding (e.g. from ekyc to email)
   */
  async changeVerificationMethod(payload) {
    const res = await apiClient.post(ENDPOINTS.AUTH.CHANGE_VERIFICATION_METHOD, payload);
    return res.data;
  },

  /**
   * Verify ePramaan SSO token
   */
  async verifyEpramaan(payload) {
    const res = await apiClient.post(ENDPOINTS.AUTH.VERIFY_EPRAMAAN, payload);
    return res.data;
  },

  /**
   * Submit registration to Admin review queue
   */
  async submitForApproval(payload) {
    const res = await apiClient.post(ENDPOINTS.AUTH.SUBMIT_APPROVAL, payload);
    return res.data;
  },

  /**
   * Poll registration approval status by userId
   */
  async getRegistrationStatus(userId) {
    const res = await apiClient.get(ENDPOINTS.AUTH.STATUS(userId));
    return res.data;
  },

  /**
   * Login with email and password
   * Sets secure HttpOnly cookie in browser and returns user/token
   */
  async login(payload) {
    const res = await apiClient.post(ENDPOINTS.AUTH.LOGIN, payload);
    const token =
      res.headers?.['x-auth-token'] ||
      res.data?.data?.accessToken ||
      res.data?.data?.token ||
      res.data?.data?.apiKey ||
      res.data?.accessToken ||
      res.data?.token ||
      res.data?.apiKey;
    if (token) {
      setManualAuthToken(token);
    }
    const refreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    return { ...res.data, token: token || res.data?.token };
  },

  /**
   * Programmatic Token Checkout for Agent Backends (Headless M2M)
   */
  async agentTokenCheckout(payload) {
    const res = await apiClient.post(ENDPOINTS.AUTH.TOKEN, payload);
    return res.data;
  },

  /**
   * Logout and terminate active user session
   */
  async logout() {
    try {
      const res = await apiClient.post(ENDPOINTS.AUTH.LOGOUT, {});
      return res.data;
    } finally {
      setManualAuthToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('active_portal');
    }
  },

  /**
   * Get current authenticated user profile
   */
  async getMe() {
    const res = await apiClient.get(ENDPOINTS.AUTH.ME);
    return res.data;
  },

  /**
   * Request password reset code via registered email
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(payload) {
    const data = typeof payload === "string" ? { email: payload } : payload;
    const res = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
    return res.data;
  },

  /**
   * Reset account password using email, code, and newPassword
   * POST /api/v1/auth/reset-password
   */
  async resetPassword({ email, code, newPassword }) {
    const res = await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
      email,
      code,
      newPassword,
    });
    return res.data;
  },

  /**
   * Change account password
   */
  async changePassword(payload) {
    const res = await apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
    return res.data;
  },

  /**
   * List database-backed API keys
   */
  async getApiKeys() {
    const res = await apiClient.get(ENDPOINTS.AUTH.API_KEYS);
    return res.data;
  },

  /**
   * Generate new API key
   */
  async createApiKey(name) {
    const res = await apiClient.post(ENDPOINTS.AUTH.API_KEYS, { name });
    return res.data;
  },

  /**
   * Revoke an API key
   */
  async revokeApiKey(id) {
    const res = await apiClient.delete(ENDPOINTS.AUTH.API_KEY_ITEM(id));
    return res.data;
  },

  /**
   * Atomically rotate an existing API key
   */
  async rotateApiKey(id, name) {
    const res = await apiClient.post(ENDPOINTS.AUTH.API_KEY_ROTATE(id), { name });
    return res.data;
  },
};

export default authApi;
