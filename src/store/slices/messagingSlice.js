import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { messagingApi } from "../../services/api/index.js";

// Fetch Messages
export const fetchBasicMessages = createAsyncThunk(
  "messaging/fetchMessages",
  async (params, { rejectWithValue }) => {
    try {
      const res = await messagingApi.getMessages(params);
      const list = res?.data?.results || res?.data?.messages || res?.data || res?.results || [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch messages");
    }
  }
);

// Send Message
export const sendBasicMessage = createAsyncThunk(
  "messaging/sendMessage",
  async ({ connectionId, content }, { rejectWithValue }) => {
    try {
      const res = await messagingApi.sendMessage(connectionId, content);
      return {
        connectionId,
        message: {
          id: res?.data?.message_id || `sent-${Date.now()}`,
          connection_id: connectionId,
          content: typeof content === "string" ? content : content?.content,
          sent_time: new Date().toISOString(),
          state: "sent",
          direction: "outgoing",
        },
      };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to send message");
    }
  }
);

// Delete Message
export const deleteBasicMessage = createAsyncThunk(
  "messaging/deleteMessage",
  async (messageId, { rejectWithValue }) => {
    try {
      await messagingApi.deleteMessage(messageId);
      return messageId;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete message");
    }
  }
);

const messagingSlice = createSlice({
  name: "messaging",
  initialState: {
    messages: [],
    activeConnectionId: null,
    loading: false,
    sending: false,
    error: null,
  },
  reducers: {
    setActiveConnection: (state, action) => {
      state.activeConnectionId = action.payload;
    },
    addIncomingMessage: (state, action) => {
      const msg = action.payload;
      if (!msg) return;
      const normalized = {
        id: msg.id || msg.message_id || `msg-${Date.now()}`,
        connection_id: msg.connection_id || state.activeConnectionId,
        content: msg.content || msg.text || "",
        sent_time: msg.sent_time || msg.createdAt || new Date().toISOString(),
        direction: msg.direction || "incoming",
        state: msg.state || "received",
      };
      state.messages.push(normalized);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Messages
      .addCase(fetchBasicMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBasicMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchBasicMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send Message
      .addCase(sendBasicMessage.pending, (state) => {
        state.sending = true;
      })
      .addCase(sendBasicMessage.fulfilled, (state, action) => {
        state.sending = false;
        if (action.payload?.message) {
          state.messages.push(action.payload.message);
        }
      })
      .addCase(sendBasicMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload;
      })
      // Delete Message
      .addCase(deleteBasicMessage.fulfilled, (state, action) => {
        const id = action.payload;
        state.messages = state.messages.filter(
          (m) => m.id !== id && m.message_id !== id
        );
      });
  },
});

export const { setActiveConnection, addIncomingMessage } = messagingSlice.actions;

export const selectMessages = (state) => state.messaging.messages;
export const selectActiveConnectionId = (state) => state.messaging.activeConnectionId;
export const selectMessagingLoading = (state) => state.messaging.loading;
export const selectMessagingSending = (state) => state.messaging.sending;

export default messagingSlice.reducer;
