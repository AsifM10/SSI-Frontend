import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { connectionsApi } from "../../services/api/index.js";

// Fetch Connections
export const fetchConnectionsList = createAsyncThunk(
  "connections/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      const res = await connectionsApi.listConnections(params);
      const list = res?.data?.results || res?.data?.connections || res?.data || res?.results || res;
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch connections");
    }
  }
);

// Create Out-of-Band Invitation
export const createConnectionInvitation = createAsyncThunk(
  "connections/createInvitation",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await connectionsApi.createInvitation(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to create invitation");
    }
  }
);

// Receive & Accept Invitation
export const receiveConnectionInvitation = createAsyncThunk(
  "connections/receiveInvitation",
  async ({ invitation, alias }, { rejectWithValue }) => {
    try {
      const res = await connectionsApi.receiveInvitation(invitation, alias);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to receive invitation");
    }
  }
);

// Send Trust Ping
export const sendTrustPing = createAsyncThunk(
  "connections/sendPing",
  async ({ connId, comment }, { rejectWithValue }) => {
    try {
      const res = await connectionsApi.sendPing(connId, comment);
      return { connId, data: res.data };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to send trust ping");
    }
  }
);

// Delete Connection
export const removeConnection = createAsyncThunk(
  "connections/deleteConnection",
  async (connId, { rejectWithValue }) => {
    try {
      await connectionsApi.deleteConnection(connId);
      return connId;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete connection");
    }
  }
);

const connectionsSlice = createSlice({
  name: "connections",
  initialState: {
    connections: [],
    activeInvitation: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearConnectionsError(state) {
      state.error = null;
    },
    clearActiveInvitation(state) {
      state.activeInvitation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchConnectionsList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchConnectionsList.fulfilled, (state, action) => {
        state.loading = false;
        state.connections = action.payload;
      })
      .addCase(fetchConnectionsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Invitation
      .addCase(createConnectionInvitation.fulfilled, (state, action) => {
        state.activeInvitation = action.payload;
      })
      // Delete Connection
      .addCase(removeConnection.fulfilled, (state, action) => {
        state.connections = state.connections.filter(
          (c) => c.connection_id !== action.payload
        );
      });
  },
});

export const { clearConnectionsError, clearActiveInvitation } = connectionsSlice.actions;

export const selectConnections = (state) => state.connections.connections;
export const selectActiveInvitation = (state) => state.connections.activeInvitation;
export const selectConnectionsLoading = (state) => state.connections.loading;

export default connectionsSlice.reducer;
