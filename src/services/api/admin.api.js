/**
 * Admin API Module (React JavaScript)
 * Covers User Management, Registration Approval Pipeline, Tenant Mappings & Audit Logs
 */

import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const adminApi = {
  // 0. Dashboard Statistics
  async getDashboardStats() {
    const res = await apiClient.get(ENDPOINTS.ADMIN.DASHBOARD_STATS);
    return res.data;
  },

  // 1. User Management
  async getUsers(filters) {
    const res = await apiClient.get(ENDPOINTS.ADMIN.USERS, {
      params: filters,
    });
    return res.data;
  },

  async getUser(userId) {
    const res = await apiClient.get(ENDPOINTS.ADMIN.USER_ITEM(userId));
    return res.data;
  },

  async getUserAgentToken(userId) {
    const res = await apiClient.get(ENDPOINTS.ADMIN.USER_AGENT_TOKEN(userId));
    return res.data;
  },

  async updateUserStatus(userId, payload) {
    // If activating or approving a user, strictly route to approveRegistration endpoint
    // so email verification and ACA-Py wallet provisioning cannot be bypassed
    if (
      payload?.status === 'active' ||
      payload?.status === 'approved' ||
      payload?.isActive === true ||
      payload?.registrationStatus === 'APPROVED'
    ) {
      const cleanWallet = String(payload?.walletName || payload?.organization || payload?.username || 'subwallet')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 32);
      const walletName = cleanWallet.endsWith('_subwallet') || cleanWallet.endsWith('_wallet')
        ? cleanWallet
        : `${cleanWallet}_subwallet`;

      return await this.approveRegistration(userId, {
        walletName,
        notes: payload?.notes || 'Approved by Governance Administrator.',
      });
    }
    const res = await apiClient.patch(ENDPOINTS.ADMIN.USER_ITEM(userId), payload);
    return res.data;
  },

  async deleteUser(userId) {
    const res = await apiClient.delete(ENDPOINTS.ADMIN.USER_ITEM(userId));
    return res.data;
  },

  // 2. Registration Approval Pipeline
  async getPendingRegistrations() {
    const res = await apiClient.get(ENDPOINTS.ADMIN.REGISTRATIONS_PENDING);
    return res.data;
  },

  async getAllRegistrations(filters) {
    const res = await apiClient.get(ENDPOINTS.ADMIN.REGISTRATIONS, {
      params: filters,
    });
    return res.data;
  },

  async approveRegistration(userId, payload) {
    const res = await apiClient.post(
      ENDPOINTS.ADMIN.APPROVE_REGISTRATION(userId),
      payload || {}
    );
    return res.data;
  },

  async rejectRegistration(userId, payload) {
    const res = await apiClient.post(
      ENDPOINTS.ADMIN.REJECT_REGISTRATION(userId),
      payload
    );
    return res.data;
  },

  async getTenantMapping(userId) {
    const res = await apiClient.get(ENDPOINTS.ADMIN.TENANT_MAPPING(userId));
    return res.data;
  },

  // 3. Audit Logs
  async getAuditLogs() {
    const res = await apiClient.get(ENDPOINTS.ADMIN.AUDIT_LOGS);
    return res.data;
  },
};

export default adminApi;
