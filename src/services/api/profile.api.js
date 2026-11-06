/**
 * Unified Profile API Module for All Roles (React JavaScript)
 * Covers Self-Service Profile Retrieval, Updating, Password Changes & API Key Management
 */

import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const profileApi = {
  /**
   * Upload user avatar image (multipart/form-data)
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await apiClient.post(ENDPOINTS.PROFILE.AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Remove user avatar
   */
  async deleteAvatar() {
    const res = await apiClient.delete(ENDPOINTS.PROFILE.AVATAR);
    return res.data;
  },

  /**
   * Upload supporting verification document (PDF, PNG, JPG, XML, ZIP)
   */
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('document', file);
    const res = await apiClient.post(ENDPOINTS.PROFILE.DOCUMENTS, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Get current authenticated user profile
   */
  async getMyProfile() {
    const res = await apiClient.get(ENDPOINTS.PROFILE.ME);
    return res.data;
  },

  /**
   * Get active sovereign DIDs for current authenticated user (Step 15)
   */
  async getDids() {
    const res = await apiClient.get(ENDPOINTS.PROFILE.DIDS);
    return res.data;
  },

  /**
   * Update profile using standard PUT
   */
  async updateMyProfile(payload) {
    const res = await apiClient.put(ENDPOINTS.AUTH.ME, payload);
    return res.data;
  },

  /**
   * Partially update profile using PATCH
   */
  async patchMyProfile(payload) {
    const res = await apiClient.patch(ENDPOINTS.AUTH.ME, payload);
    return res.data;
  },

  /**
   * Change account password
   */
  async changePassword(payload) {
    const res = await apiClient.post(
      ENDPOINTS.AUTH.CHANGE_PASSWORD,
      payload
    );
    return res.data;
  },

  /**
   * Self-delete account with cascading purge across credentials and connections
   */
  async deleteMyAccount() {
    const res = await apiClient.delete(ENDPOINTS.AUTH.ME);
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
   * Create new API key
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
   * Rotate an API key
   */
  async rotateApiKey(id, name) {
    const res = await apiClient.post(ENDPOINTS.AUTH.API_KEY_ROTATE(id), { name });
    return res.data;
  },
};

export default profileApi;
