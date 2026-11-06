import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { holderApi } from "../../services/api/index.js";

// Fetch Dashboard Stats
export const fetchHolderDashboardStats = createAsyncThunk(
  "holder/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await holderApi.getDashboardStats();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch holder stats");
    }
  }
);

// Fetch Stored Credentials in Wallet
export const fetchStoredCredentials = createAsyncThunk(
  "holder/fetchStoredCredentials",
  async (_, { rejectWithValue }) => {
    try {
      const res = await holderApi.getStoredCredentials();
      return res.data?.results || res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch credentials");
    }
  }
);

// Fetch Recorded My Credentials
export const fetchMyCredentials = createAsyncThunk(
  "holder/fetchMyCredentials",
  async (_, { rejectWithValue }) => {
    try {
      const res = await holderApi.getMyCredentials();
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch my credentials");
    }
  }
);

// Fetch Credential Offers (Exchanges)
export const fetchCredentialOffers = createAsyncThunk(
  "holder/fetchCredentialOffers",
  async (params, { rejectWithValue }) => {
    try {
      const res = await holderApi.getCredentialExchanges(params);
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch credential offers");
    }
  }
);

// Accept Credential Offer
export const acceptCredentialOffer = createAsyncThunk(
  "holder/acceptCredentialOffer",
  async (credExId, { rejectWithValue }) => {
    try {
      const res = await holderApi.sendCredentialRequest(credExId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to accept credential offer");
    }
  }
);

// Store Credential In Wallet
export const storeCredentialInWallet = createAsyncThunk(
  "holder/storeCredentialInWallet",
  async (credExId, { rejectWithValue }) => {
    try {
      const res = await holderApi.storeCredential(credExId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to store credential");
    }
  }
);

// Delete Credential
export const deleteHolderCredential = createAsyncThunk(
  "holder/deleteCredential",
  async (credentialId, { rejectWithValue }) => {
    try {
      await holderApi.deleteCredential(credentialId);
      return credentialId;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete credential");
    }
  }
);

// Fetch Proof Requests
export const fetchProofRequests = createAsyncThunk(
  "holder/fetchProofRequests",
  async (params, { rejectWithValue }) => {
    try {
      const res = await holderApi.getProofExchanges(params);
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch proof requests");
    }
  }
);

// Send Proof Presentation
export const sendProofPresentation = createAsyncThunk(
  "holder/sendProofPresentation",
  async ({ presExId, payload }, { rejectWithValue }) => {
    try {
      const res = await holderApi.sendProofPresentation(presExId, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to send presentation");
    }
  }
);

const holderSlice = createSlice({
  name: "holder",
  initialState: {
    dashboardStats: null,
    credentials: [],
    myCredentials: [],
    offers: [],
    proofRequests: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearHolderError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Stats
      .addCase(fetchHolderDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
      })
      // Stored Credentials
      .addCase(fetchStoredCredentials.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStoredCredentials.fulfilled, (state, action) => {
        state.loading = false;
        state.credentials = action.payload;
      })
      .addCase(fetchStoredCredentials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // My Credentials
      .addCase(fetchMyCredentials.fulfilled, (state, action) => {
        state.myCredentials = action.payload;
      })
      // Offers
      .addCase(fetchCredentialOffers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCredentialOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.offers = action.payload;
      })
      .addCase(fetchCredentialOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Credential
      .addCase(deleteHolderCredential.fulfilled, (state, action) => {
        state.credentials = state.credentials.filter(
          (c) => (c.credential_id || c.referent || c.id) !== action.payload
        );
      })
      // Proof Requests
      .addCase(fetchProofRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProofRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.proofRequests = action.payload;
      })
      .addCase(fetchProofRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearHolderError } = holderSlice.actions;

export const selectHolderStats = (state) => state.holder.dashboardStats;
export const selectHolderCredentials = (state) => state.holder.credentials;
export const selectMyCredentials = (state) => state.holder.myCredentials;
export const selectHolderOffers = (state) => state.holder.offers;
export const selectHolderProofRequests = (state) => state.holder.proofRequests;
export const selectHolderLoading = (state) => state.holder.loading;

export default holderSlice.reducer;
