import { createContext, useContext, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loginUser,
  logoutUser,
  registerUser,
  verifyEmailOtp,
  submitForAdminApproval,
  checkRegistrationStatus,
  selectUser,
  selectToken,
  selectActivePortal,
  selectOnboarding,
  selectAuthLoading,
  selectAuthError,
  clearError,
  setUser,
} from "../store/slices/authSlice";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const activePortal = useSelector(selectActivePortal);
  const onboarding = useSelector(selectOnboarding);
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  // Cross-tab synchronization via storage event
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        try {
          const newUser = e.newValue ? JSON.parse(e.newValue) : null;
          dispatch(setUser(newUser));
        } catch {
          dispatch(setUser(null));
        }
      }
      if (e.key === "token" && !e.newValue) {
        dispatch(logoutUser());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dispatch]);

  const login = async (credentials) => {
    return await dispatch(loginUser(credentials)).unwrap();
  };

  const register = async (userData) => {
    return await dispatch(registerUser(userData)).unwrap();
  };

  const verifyEmail = async (userId, otp) => {
    return await dispatch(verifyEmailOtp({ userId, otp })).unwrap();
  };

  const submitApproval = async (userId) => {
    return await dispatch(submitForAdminApproval({ userId })).unwrap();
  };

  const checkStatus = async (userId) => {
    return await dispatch(checkRegistrationStatus(userId)).unwrap();
  };

  const logoutAction = useCallback(() => {
    dispatch(logoutUser());
  }, [dispatch]);

  const clearAuthError = () => {
    dispatch(clearError());
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    activePortal,
    onboarding,
    isAuthenticated: !!user,
    isLoading,
    error: authError,
    login,
    register,
    verifyEmail,
    submitApproval,
    checkStatus,
    logout: logoutAction,
    clearError: clearAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export default AuthContext;