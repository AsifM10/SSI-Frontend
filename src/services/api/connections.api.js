/**
 * Connections & Out-of-Band (RFC 0434 / AIP 2.0) API Module (React JavaScript)
 * Shared across all four roles
 */

import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const connectionsApi = {
  /**
   * List all active DIDComm connections
   */
  async listConnections(params) {
    const res = await apiClient.get(ENDPOINTS.CONNECTIONS.LIST, { params });
    return res.data;
  },

  /**
   * Get single connection by ID
   */
  async getConnection(connId) {
    const res = await apiClient.get(ENDPOINTS.CONNECTIONS.ITEM(connId));
    return res.data;
  },

  /**
   * Create Out-of-Band (AIP 2.0 / RFC 0434) connection invitation
   */
  async createInvitation(payload) {
    const body = typeof payload === 'string'
      ? { alias: payload, handshake_protocols: ['https://didcomm.org/didexchange/1.0'] }
      : (payload && typeof payload === 'object' ? payload : {});
    const res = await apiClient.post(
      ENDPOINTS.CONNECTIONS.CREATE_INVITATION,
      body
    );
    return res.data;
  },

  /**
   * Receive and accept Out-of-Band connection invitation (JSON or URL)
   */
  async receiveInvitation(payload, aliasParam) {
    let body = {};
    let alias = aliasParam;

    if (typeof payload === 'string') {
      body = { invitation_url: payload };
    } else if (payload && typeof payload === 'object') {
      if (payload.alias) alias = payload.alias;
      if (payload.invitation_url) {
        body = { invitation_url: payload.invitation_url, alias };
      } else if (payload.invitation) {
        body = { invitation: payload.invitation, alias };
      } else {
        body = payload;
      }
    }

    const res = await apiClient.post(
      ENDPOINTS.CONNECTIONS.RECEIVE_INVITATION,
      body,
      { params: alias ? { alias } : undefined }
    );
    return res.data;
  },

  /**
   * Check connection status
   */
  async getConnectionStatus(connId) {
    const res = await apiClient.get(ENDPOINTS.CONNECTIONS.STATUS(connId));
    return res.data;
  },

  /**
   * Accept an inbound connection invitation
   */
  async acceptInvitation(connId) {
    const res = await apiClient.post(
      ENDPOINTS.CONNECTIONS.ACCEPT_INVITATION(connId)
    );
    return res.data;
  },

  /**
   * Accept an inbound connection request
   */
  async acceptRequest(connId) {
    const res = await apiClient.post(
      ENDPOINTS.CONNECTIONS.ACCEPT_REQUEST(connId)
    );
    return res.data;
  },

  /**
   * Reject an inbound connection request
   */
  async rejectRequest(connId) {
    const res = await apiClient.post(
      ENDPOINTS.CONNECTIONS.REJECT(connId)
    );
    return res.data;
  },

  /**
   * Send trust ping to connection
   */
  async sendPing(connId, comment) {
    const res = await apiClient.post(
      ENDPOINTS.CONNECTIONS.SEND_PING(connId),
      { comment: comment || 'ping' }
    );
    return res.data;
  },

  /**
   * Remove/delete a connection record
   */
  async deleteConnection(connId) {
    const res = await apiClient.delete(
      ENDPOINTS.CONNECTIONS.ITEM(connId)
    );
    return res.data;
  },

  /**
   * Get recorded connection records stored in backend DB
   */
  async getRecordedConnections() {
    const res = await apiClient.get(ENDPOINTS.CONNECTIONS.RECORDED);
    return res.data;
  },

  /**
   * Delete recorded connection record from local DB cache
   */
  async deleteRecordedConnection(connId) {
    const res = await apiClient.delete(ENDPOINTS.CONNECTIONS.RECORDED_ITEM(connId));
    return res.data;
  },
};

export default connectionsApi;
