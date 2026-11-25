import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationsApi } from "../../services/api/index.js";

// Fetch notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (params, { rejectWithValue }) => {
    try {
      const res = await notificationsApi.getNotifications(params);
      const list = res?.data?.results || res?.data?.notifications || res?.data || res?.results || [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch notifications");
    }
  }
);

// Mark single notification as read
export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id, { rejectWithValue }) => {
    try {
      await notificationsApi.markAsRead(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to mark notification as read");
    }
  }
);

// Mark all as read
export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await notificationsApi.markAllAsRead();
      return true;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to mark all notifications as read");
    }
  }
);

// Delete single notification
export const deleteNotification = createAsyncThunk(
  "notifications/delete",
  async (id, { rejectWithValue }) => {
    try {
      await notificationsApi.deleteNotification(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete notification");
    }
  }
);

// Clear all notifications
export const clearAllNotifications = createAsyncThunk(
  "notifications/clearAll",
  async (_, { rejectWithValue }) => {
    try {
      await notificationsApi.clearAll();
      return true;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to clear notifications");
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  平: {},
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      const incoming = action.payload;
      if (!incoming) return;
      const normalized = {
        id: incoming.id || `ws-${Date.now()}`,
        title: incoming.title || "New Notification",
        message: incoming.message || incoming.description || JSON.stringify(incoming),
        type: incoming.type || "info",
        isRead: false,
        createdAt: incoming.createdAt || new Date().toISOString(),
        payload: incoming.payload || incoming,
      };
      state.items.unshift(normalized);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark Read
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const item = state.items.find((n) => n.id === id);
        if (item) item.isRead = true;
      })
      // Mark All Read
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((item) => {
          item.isRead = true;
        });
      })
      // Delete
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((n) => n.id !== id);
      })
      // Clear All
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.items = [];
      });
  },
});

export const { addNotification } = notificationsSlice.actions;

export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadNotificationsCount = (state) =>
  state.notifications.items.filter((n) => !n.isRead).length;
export const selectNotificationsLoading = (state) => state.notifications.loading;

export default notificationsSlice.reducer;
