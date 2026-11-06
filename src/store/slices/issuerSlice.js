import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { issuerApi } from "../../services/api/index.js";

// Fetch Dashboard Stats
export const fetchIssuerDashboardStats = createAsyncThunk(
  "issuer/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await issuerApi.getDashboardStats();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch issuer stats");
    }
  }
);

// Fetch Schemas
export const fetchRecordedSchemas = createAsyncThunk(
  "issuer/fetchRecordedSchemas",
  async (_, { rejectWithValue }) => {
    try {
      const res = await issuerApi.getRecordedSchemas();
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch schemas");
    }
  }
);

// Create Schema
export const createIssuerSchema = createAsyncThunk(
  "issuer/createSchema",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await issuerApi.createSchema(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to create schema");
    }
  }
);

// Fetch Credential Definitions
export const fetchRecordedCredDefs = createAsyncThunk(
  "issuer/fetchRecordedCredDefs",
  async (_, { rejectWithValue }) => {
    try {
      const res = await issuerApi.getRecordedCredDefs();
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch credential definitions");
    }
  }
);

// Create Credential Definition
export const createIssuerCredDef = createAsyncThunk(
  "issuer/createCredDef",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await issuerApi.createCredDef(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to create credential definition");
    }
  }
);

// Fetch Credential Issuance Records
export const fetchCredentialRecords = createAsyncThunk(
  "issuer/fetchCredentialRecords",
  async (params, { rejectWithValue }) => {
    try {
      const res = await issuerApi.getCredentialRecords(params);
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch issuance records");
    }
  }
);

// Issue Credential
export const issueCredential = createAsyncThunk(
  "issuer/issueCredential",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await issuerApi.issueCredential(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to issue credential");
    }
  }
);

// Revoke Credential
export const revokeCredential = createAsyncThunk(
  "issuer/revokeCredential",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await issuerApi.revokeCredential(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to revoke credential");
    }
  }
);

// Fetch Onboarding QR Records
export const fetchIssuerQrRecords = createAsyncThunk(
  "issuer/fetchQrRecords",
  async (_, { rejectWithValue }) => {
    try {
      const res = await issuerApi.getQrRecords();
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch QR records");
    }
  }
);

const issuerSlice = createSlice({
  name: "issuer",
  initialState: {
    dashboardStats: null,
    schemas: [],
    credentialDefinitions: [],
    issuanceRecords: [],
    qrCampaigns: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearIssuerError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Stats
      .addCase(fetchIssuerDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
      })
      // Schemas
      .addCase(fetchRecordedSchemas.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecordedSchemas.fulfilled, (state, action) => {
        state.loading = false;
        state.schemas = action.payload;
      })
      .addCase(fetchRecordedSchemas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createIssuerSchema.fulfilled, (state, action) => {
        if (action.payload) {
          state.schemas.unshift(action.payload);
        }
      })
      // CredDefs
      .addCase(fetchRecordedCredDefs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecordedCredDefs.fulfilled, (state, action) => {
        state.loading = false;
        state.credentialDefinitions = action.payload;
      })
      .addCase(fetchRecordedCredDefs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createIssuerCredDef.fulfilled, (state, action) => {
        if (action.payload) {
          state.credentialDefinitions.unshift(action.payload);
        }
      })
      // Issuance Records
      .addCase(fetchCredentialRecords.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCredentialRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.issuanceRecords = action.payload;
      })
      .addCase(fetchCredentialRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(issueCredential.fulfilled, (state, action) => {
        if (action.payload) {
          state.issuanceRecords.unshift(action.payload);
        }
      })
      // QR Campaigns
      .addCase(fetchIssuerQrRecords.fulfilled, (state, action) => {
        state.qrCampaigns = action.payload;
      });
  },
});

export const { clearIssuerError } = issuerSlice.actions;

export const selectIssuerStats = (state) => state.issuer.dashboardStats;
export const selectIssuerSchemas = (state) => state.issuer.schemas;
export const selectIssuerCredDefs = (state) => state.issuer.credentialDefinitions;
export const selectIssuerRecords = (state) => state.issuer.issuanceRecords;
export const selectIssuerQrCampaigns = (state) => state.issuer.qrCampaigns;
export const selectIssuerLoading = (state) => state.issuer.loading;

export default issuerSlice.reducer;
