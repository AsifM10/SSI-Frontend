/**
 * BasicMessages & In-App Messaging API Module (React JavaScript)
 * Covers listing messages across DIDComm connections, sending messages, and deleting records.
 */

import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const messagingApi = {
  /**
   * List basic messages optionally filtered by connectionId
   */
  async getMessages(params = {}) {
    const res = await apiClient.get(ENDPOINTS.CONNECTIONS.BASIC_MESSAGES, { params });
    return res.data;
  },

  /**
   * Send a basic message to an active connection
   */
  async sendMessage(connectionId, content) {
    const payload = typeof content === 'string' ? { content } : content;
    const res = await apiClient.post(ENDPOINTS.CONNECTIONS.SEND_MESSAGE(connectionId), payload);
    return res.data;
  },

  /**
   * Delete a basic message from local history
   */
  async deleteMessage(messageId) {
    const res = await apiClient.delete(ENDPOINTS.CONNECTIONS.BASIC_MESSAGE_ITEM(messageId));
    return res.data;
  },
};

export default messagingApi;
