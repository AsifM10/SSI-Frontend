import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { verifierApi } from "../../services/api/index.js";

// Fetch Dashboard Stats
export const fetchVerifierDashboardStats = createAsyncThunk(
  "verifier/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await verifierApi.getDashboardStats();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch verifier stats");
    }
  }
);

// Fetch Credential Catalog
export const fetchCredentialCatalog = createAsyncThunk(
  "verifier/fetchCredentialCatalog",
  async (_, { rejectWithValue }) => {
    try {
      const res = await verifierApi.getCredentialCatalog();
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch credential catalog");
    }
  }
);

// Fetch Verification Records
export const fetchVerifications = createAsyncThunk(
  "verifier/fetchVerifications",
  async (_, { rejectWithValue }) => {
    try {
      const res = await verifierApi.getVerifications();
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch verification records");
    }
  }
);

// Create Proof Request (Present Proof 2.0)
export const createVerifierProofRequest = createAsyncThunk(
  "verifier/createProofRequest",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await verifierApi.createProofRequest(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to create proof request");
    }
  }
);

// Verify Presentation
export const verifyPresentationRecord = createAsyncThunk(
  "verifier/verifyPresentation",
  async (presExId, { rejectWithValue }) => {
    try {
      const res = await verifierApi.verifyPresentation(presExId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to verify presentation");
    }
  }
);

// Create Verification QR
export const createVerifierQr = createAsyncThunk(
  "verifier/createQr",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await verifierApi.createVerificationQr(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to create verification QR");
    }
  }
);

// Fetch Verifier QR Records
export const fetchVerifierQrRecords = createAsyncThunk(
  "verifier/fetchQrRecords",
  async (_, { rejectWithValue }) => {
    try {
      const res = await verifierApi.getQrRecords();
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch QR records");
    }
  }
);

const verifierSlice = createSlice({
  name: "verifier",
  initialState: {
    dashboardStats: null,
    catalog: [],
    verifications: [],
    qrCampaigns: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearVerifierError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Stats
      .addCase(fetchVerifierDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
      })
      // Catalog
      .addCase(fetchCredentialCatalog.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCredentialCatalog.fulfilled, (state, action) => {
        state.loading = false;
        state.catalog = action.payload;
      })
      .addCase(fetchCredentialCatalog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verifications
      .addCase(fetchVerifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVerifications.fulfilled, (state, action) => {
        state.loading = false;
        state.verifications = action.payload;
      })
      .addCase(fetchVerifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // QR Campaigns
      .addCase(fetchVerifierQrRecords.fulfilled, (state, action) => {
        state.qrCampaigns = action.payload;
      });
  },
});

export const { clearVerifierError } = verifierSlice.actions;

export const selectVerifierStats = (state) => state.verifier.dashboardStats;
export const selectCredentialCatalog = (state) => state.verifier.catalog;
export const selectVerifications = (state) => state.verifier.verifications;
export const selectVerifierQrCampaigns = (state) => state.verifier.qrCampaigns;
export const selectVerifierLoading = (state) => state.verifier.loading;

export default verifierSlice.reducer;
