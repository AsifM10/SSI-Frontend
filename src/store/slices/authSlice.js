// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import api from "../../services/api";

// const storedUser = localStorage.getItem("user");
// const storedToken = localStorage.getItem("token");

// export const loginUser = createAsyncThunk(
//   "auth/loginUser",
//   async ({ email, password }, { rejectWithValue }) => {
//     try {
//       const response = await api.post("/auth/login", { email, password });
//       if (response.data.success) {
//         const loginData = response.data.data;
//         const user = {
//           userId: loginData.userId,
//           email: loginData.email,
//           role: loginData.role,
//           deptId: loginData.deptId,
//         };
//         const token = loginData.accessToken;

//         localStorage.setItem("user", JSON.stringify(user));
//         localStorage.setItem("token", token);

//         return { user, token };
//       }
//       return rejectWithValue("Login failed");
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || "Invalid Credentials");
//     }
//   }
// );

// const authSlice = createSlice({
//   name: "auth",
//   initialState: {
//     user: storedUser ? JSON.parse(storedUser) : null,
//     token: storedToken || null,
//     loading: false,
//     error: null,
//   },
//   reducers: {
//     logout(state) {
//       state.user = null;
//       state.token = null;
//       state.loading = false;
//       state.error = null;
//       localStorage.removeItem("user");
//       localStorage.removeItem("token");
//     },
//     clearError(state) {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload.user;
//         state.token = action.payload.token;
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const { logout, clearError } = authSlice.actions;

// export const selectUser = (state) => state.auth.user;
// export const selectToken = (state) => state.auth.token;
// export const selectAuthLoading = (state) => state.auth.loading;
// export const selectAuthError = (state) => state.auth.error;

// export default authSlice.reducer;








//new code with D-

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import {
  saveSession,
  clearSession,
} from "../../utils/sessionManager";

// Restore session after refresh
const storedUser = localStorage.getItem("user");
const storedToken = localStorage.getItem("token");

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        const loginData = response.data.data;

        // Separate token from user object
        const { accessToken, ...user } = loginData;

        const token = accessToken;

        // Save session
        saveSession(user, token);

        return {
          user,
          token,
        };
      }

      return rejectWithValue("Login Failed");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Invalid Credentials"
      );
    }
  }
);

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

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

    // Optional: Update user profile in Redux
    setUser(state, action) {
      state.user = action.payload;

      localStorage.setItem(
        "user",
        JSON.stringify(action.payload)
      );
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
      });
  },
});

export const {
  logout,
  clearError,
  setUser,
} = authSlice.actions;

// Selectors

export const selectUser = (state) => state.auth.user;

export const selectToken = (state) => state.auth.token;

export const selectAuthLoading = (state) =>
  state.auth.loading;

export const selectAuthError = (state) =>
  state.auth.error;

export default authSlice.reducer;

