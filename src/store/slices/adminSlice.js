import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminApi } from "../../services/api/index.js";

// Fetch Dashboard Stats
export const fetchAdminDashboardStats = createAsyncThunk(
  "admin/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminApi.getDashboardStats();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch admin stats");
    }
  }
);

// Fetch Pending Registrations (Organization Requests)
export const fetchPendingRegistrations = createAsyncThunk(
  "admin/fetchPendingRegistrations",
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminApi.getPendingRegistrations();
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch pending requests");
    }
  }
);

// Fetch All Registrations
export const fetchAllRegistrations = createAsyncThunk(
  "admin/fetchAllRegistrations",
  async (filters, { rejectWithValue }) => {
    try {
      const res = await adminApi.getAllRegistrations(filters);
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch registrations");
    }
  }
);

// Approve Registration
export const approveRegistration = createAsyncThunk(
  "admin/approveRegistration",
  async ({ userId, payload }, { rejectWithValue }) => {
    try {
      const res = await adminApi.approveRegistration(userId, payload);
      return { userId, data: res.data };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to approve registration");
    }
  }
);

// Reject Registration
export const rejectRegistration = createAsyncThunk(
  "admin/rejectRegistration",
  async ({ userId, reason }, { rejectWithValue }) => {
    try {
      const res = await adminApi.rejectRegistration(userId, { reason });
      return { userId, data: res.data };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to reject registration");
    }
  }
);

// Fetch Users
export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (filters, { rejectWithValue }) => {
    try {
      const res = await adminApi.getUsers(filters);
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch users");
    }
  }
);

// Update User Status
export const updateAdminUserStatus = createAsyncThunk(
  "admin/updateUserStatus",
  async ({ userId, status, record }, { rejectWithValue }) => {
    try {
      if (status === "active" || status === "approved") {
        const rawTenant = record?.organization || record?.tenant_name || record?.username || "subwallet";
        const cleanWallet = String(rawTenant).toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 32);
        const walletName = cleanWallet.endsWith("_subwallet") || cleanWallet.endsWith("_wallet")
          ? cleanWallet
          : `${cleanWallet}_subwallet`;
        const res = await adminApi.approveRegistration(userId, {
          walletName,
          notes: "Approved by Governance Administrator.",
        });
        return res;
      }
      const res = await adminApi.updateUserStatus(userId, { status, isActive: false });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message || "Failed to update user status");
    }
  }
);

// Delete User
export const deleteAdminUser = createAsyncThunk(
  "admin/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      await adminApi.deleteUser(userId);
      return userId;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to delete user");
    }
  }
);

// Fetch Audit Logs
export const fetchAdminAuditLogs = createAsyncThunk(
  "admin/fetchAuditLogs",
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminApi.getAuditLogs();
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch audit logs");
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    dashboardStats: null,
    pendingRegistrations: [],
    allRegistrations: [],
    users: [],
    auditLogs: [],
    tenantMapping: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearAdminError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard stats
      .addCase(fetchAdminDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
      })
      // Pending registrations
      .addCase(fetchPendingRegistrations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPendingRegistrations.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingRegistrations = action.payload;
      })
      .addCase(fetchPendingRegistrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // All registrations
      .addCase(fetchAllRegistrations.fulfilled, (state, action) => {
        state.allRegistrations = action.payload;
      })
      // Approve registration
      .addCase(approveRegistration.fulfilled, (state, action) => {
        state.pendingRegistrations = state.pendingRegistrations.filter(
          (r) => (r.id || r.reservation_id) !== action.payload.userId
        );
      })
      // Reject registration
      .addCase(rejectRegistration.fulfilled, (state, action) => {
        state.pendingRegistrations = state.pendingRegistrations.filter(
          (r) => (r.id || r.reservation_id) !== action.payload.userId
        );
      })
      // Users
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update user status
      .addCase(updateAdminUserStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.users.findIndex((u) => u.id === updated.id);
        if (idx !== -1) {
          state.users[idx] = { ...state.users[idx], ...updated };
        }
      })
      // Delete user
      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      })
      // Audit logs
      .addCase(fetchAdminAuditLogs.fulfilled, (state, action) => {
        state.auditLogs = action.payload;
      });
  },
});

export const { clearAdminError } = adminSlice.actions;

export const selectAdminStats = (state) => state.admin.dashboardStats;
export const selectPendingRegistrations = (state) => state.admin.pendingRegistrations;
export const selectAllRegistrations = (state) => state.admin.allRegistrations;
export const selectAdminUsers = (state) => state.admin.users;
export const selectAdminAuditLogs = (state) => state.admin.auditLogs;
export const selectAdminLoading = (state) => state.admin.loading;

export default adminSlice.reducer;
