import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleGuard = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  const primaryRole = allowedRoles[0] || "issuer";

  // 1. If user is not logged in, redirect to the role's login page
  if (!user) {
    return <Navigate to={`/login/${primaryRole}`} replace />;
  }

  // 2. Single-Portal Exclusivity: If user is logged into another role,
  // redirect them to their own authorized active portal!
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}-dashboard`} replace />;
  }

  return children;
};

export default RoleGuard;