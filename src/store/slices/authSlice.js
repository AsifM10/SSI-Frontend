import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/apiClient";
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

// Async thunk for user login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const result = await authService.login({ username, password });

      if (result.success && result.user) {
        const user = {
          userId: result.user.userId,
          username: result.user.username,
          email: result.user.email || result.user.username,
          role: result.user.role,
        };

        saveSession(user, result.token || `token-${Date.now()}`);
        return { user, token: result.token };
      }

      return rejectWithValue(result.message || "Invalid credentials");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Login failed"
      );
    }
  }
);

// Async thunk for user logout
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  await authService.logout();
  clearSession();
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: getInitialUser(),
    token: getInitialToken(),
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      clearSession();
    },
    clearError(state) {
      state.error = null;
    },
    setUser(state, action) {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem("user", JSON.stringify(action.payload));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export const { logout, clearError, setUser } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;