import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi, setManualAuthToken } from "../../services/api/index.js";
import {
  saveSession,
  clearSession,
  isSessionExpired,
} from "../../utils/sessionManager";

// Restore stored session if valid
const getInitialUser = () => {
  try {
    if (isSessionExpired()) {
      clearSession();
      return null;
    }
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const getInitialToken = () => {
  try {
    if (isSessionExpired()) return null;
    return localStorage.getItem("token") || null;
  } catch {
    return null;
  }
};

const getInitialActivePortal = () => {
  return localStorage.getItem("active_portal") || null;
};

// Async thunk: Login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ username, email, password, role }, { rejectWithValue }) => {
    try {
      const loginPayload = {
        email: email || username,
        username: username || email,
        password,
        ...(role ? { role } : {}),
      };

      const result = await authApi.login(loginPayload);

      if (result.success && (result.data || result.user)) {
        const rawUser = result.data?.user || result.data || result.user;
        const token =
          result.token ||
          result.data?.accessToken ||
          result.data?.token ||
          result.data?.apiKey ||
          result.accessToken ||
          null;
        
        const rawDid = rawUser.did || rawUser.publicDid || null;
        const formattedDid = rawDid
          ? (rawDid.startsWith("did:") ? rawDid : `did:sov:${rawDid}`)
          : null;

        const user = {
          userId: rawUser.id || rawUser.userId,
          username: rawUser.username || rawUser.email,
          email: rawUser.email || rawUser.username,
          role: rawUser.role || "holder",
          organization: rawUser.organizationName || rawUser.organization || null,
          did: formattedDid,
          rawDid: rawDid,
          verkey: rawUser.verkey || null,
          tenantId: rawUser.tenantId || null,
          walletId: rawUser.walletId || null,
        };

        if (token) {
          saveSession(user, token);
          setManualAuthToken(token);
        } else {
          saveSession(user, "");
        }

        const refreshToken = result.data?.refreshToken || result.refreshToken;
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        localStorage.setItem("active_portal", user.role);

        return { user, token, role: user.role };
      }

      return rejectWithValue(result.message || "Invalid credentials");
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      return rejectWithValue(
        serverMessage || error.message || error.details || "Login failed. Please check credentials."
      );
    }
  }
);

// Async thunk: Register
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload, { rejectWithValue }) => {
    try {
      const result = await authApi.register(payload);

      if (result.success) {
        return result.data || result;
      }
      return rejectWithValue(result.message || "Registration failed");
    } catch (error) {
      return rejectWithValue(error.message || "Registration failed");
    }
  }
);

// Async thunk: Verify Email OTP
export const verifyEmailOtp = createAsyncThunk(
  "auth/verifyEmailOtp",
  async ({ userId, otp }, { rejectWithValue }) => {
    try {
      const result = await authApi.verifyEmail({ userId, otp });
      if (result.success) {
        return result.data || result;
      }
      return rejectWithValue(result.message || "OTP verification failed");
    } catch (error) {
      return rejectWithValue(error.message || "OTP verification failed");
    }
  }
);

// Async thunk: Submit for Admin Approval
export const submitForAdminApproval = createAsyncThunk(
  "auth/submitForAdminApproval",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const result = await authApi.submitForApproval({ userId });
      if (result.success) {
        return result.data || result;
      }
      return rejectWithValue(result.message || "Submission for approval failed");
    } catch (error) {
      return rejectWithValue(error.message || "Submission for approval failed");
    }
  }
);

// Async thunk: Check Registration Status
export const checkRegistrationStatus = createAsyncThunk(
  "auth/checkRegistrationStatus",
  async (userId, { rejectWithValue }) => {
    try {
      const result = await authApi.getRegistrationStatus(userId);
      if (result.success) {
        return result.data || result;
      }
      return rejectWithValue(result.message || "Failed to fetch status");
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch status");
    }
  }
);

// Async thunk: Logout
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  try {
    await authApi.logout();
  } catch {
    // Ignore network error on logout
  } finally {
    clearSession();
    localStorage.removeItem("active_portal");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
});

// Async thunk: Fetch live authenticated user profile (including DID and verkey)
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.getMe();
      const rawUser = res?.data || res?.user || res;
      if (rawUser && (rawUser.id || rawUser.email)) {
        const rawDid = rawUser.did || rawUser.publicDid || null;
        const formattedDid = rawDid
          ? (rawDid.startsWith("did:") ? rawDid : `did:sov:${rawDid}`)
          : null;

        const updatedUser = {
          userId: rawUser.id || rawUser.userId,
          username: rawUser.username || rawUser.email,
          email: rawUser.email || rawUser.username,
          role: rawUser.role || "holder",
          organization: rawUser.organizationName || rawUser.organization || null,
          did: formattedDid,
          rawDid: rawDid,
          verkey: rawUser.verkey || null,
          tenantId: rawUser.tenantId || null,
          walletId: rawUser.walletId || null,
        };

        try {
          const stored = localStorage.getItem("user");
          const existing = stored ? JSON.parse(stored) : {};
          const merged = { ...existing, ...updatedUser };
          localStorage.setItem("user", JSON.stringify(merged));
        } catch {
          // ignore storage error
        }

        return updatedUser;
      }
      return null;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch profile");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: getInitialUser(),
    token: getInitialToken(),
    activePortal: getInitialActivePortal(),
    onboarding: {
      userId: null,
      step: 1,
      email: null,
      role: null,
      status: null,
    },
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.activePortal = null;
      state.loading = false;
      state.error = null;
      clearSession();
      localStorage.removeItem("active_portal");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    clearError(state) {
      state.error = null;
    },
    setUser(state, action) {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem("user", JSON.stringify(action.payload));
        if (action.payload.role) {
          state.activePortal = action.payload.role;
          localStorage.setItem("active_portal", action.payload.role);
        }
      }
    },
    setActivePortalLock(state, action) {
      state.activePortal = action.payload;
      if (action.payload) {
        localStorage.setItem("active_portal", action.payload);
      } else {
        localStorage.removeItem("active_portal");
      }
    },
    setOnboardingData(state, action) {
      state.onboarding = { ...state.onboarding, ...action.payload };
    },
    resetOnboarding(state) {
      state.onboarding = {
        userId: null,
        step: 1,
        email: null,
        role: null,
        status: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.activePortal = action.payload.role;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        state.onboarding.userId = data.userId || data.id;
        state.onboarding.email = data.email;
        state.onboarding.role = data.role;
        state.onboarding.status = data.registrationStatus || "PENDING_VERIFICATION";
        state.onboarding.step = 2;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify Email OTP
      .addCase(verifyEmailOtp.fulfilled, (state) => {
        state.onboarding.step = 3;
      })
      // Submit for Approval
      .addCase(submitForAdminApproval.fulfilled, (state) => {
        state.onboarding.status = "PENDING_ADMIN_APPROVAL";
        state.onboarding.step = 4;
      })
      // Check Status
      .addCase(checkRegistrationStatus.fulfilled, (state, action) => {
        state.onboarding.status = action.payload.registrationStatus || action.payload.status;
      })
      // Fetch Current User / Profile
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = { ...state.user, ...action.payload };
        }
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.activePortal = null;
        state.loading = false;
      });
  },
});

export const {
  logout,
  clearError,
  setUser,
  setActivePortalLock,
  setOnboardingData,
  resetOnboarding,
} = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectActivePortal = (state) => state.auth.activePortal;
export const selectOnboarding = (state) => state.auth.onboarding;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;