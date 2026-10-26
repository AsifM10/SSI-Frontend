import { createContext, useContext } from "react";
import {
  loginUser,
  logout,
  selectUser,
  selectAuthLoading,
  selectAuthError,
  clearError,
} from "../store/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";

import { authService } from "../services/apiClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const login = async (credentials) => {
    return await dispatch(loginUser(credentials)).unwrap();
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logoutAction = () => {
    dispatch(logout());
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error: authError,
    login,
    register,
    logout: logoutAction,
    clearError: clearAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;