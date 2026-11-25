/**
 * Notifications API Module (React JavaScript)
 * Covers getting notification feed, marking as read, deleting, and clearing all.
 */

import apiClient from './client';
import { ENDPOINTS } from './endpoints';

export const notificationsApi = {
  /**
   * Get paginated notifications
   */
  async getNotifications(params = {}) {
    const res = await apiClient.get(ENDPOINTS.NOTIFICATIONS.LIST, { params });
    return res.data;
  },

  /**
   * Get single notification by ID
   */
  async getNotification(id) {
    const res = await apiClient.get(ENDPOINTS.NOTIFICATIONS.ITEM(id));
    return res.data;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id) {
    const res = await apiClient.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    return res.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const res = await apiClient.patch(ENDPOINTS.NOTIFICATIONS.READ_ALL);
    return res.data;
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id) {
    const res = await apiClient.delete(ENDPOINTS.NOTIFICATIONS.ITEM(id));
    return res.data;
  },

  /**
   * Clear all notifications
   */
  async clearAll() {
    const res = await apiClient.delete(ENDPOINTS.NOTIFICATIONS.CLEAR_ALL);
    return res.data;
  },
};

export default notificationsApi;
