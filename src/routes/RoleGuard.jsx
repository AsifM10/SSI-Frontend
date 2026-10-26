import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleGuard = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  const primaryRole = allowedRoles[0] || "issuer";

  // If user is not logged in, or logged into a different role,
  // redirect directly to the login page for this specific role!
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={`/login/${primaryRole}`} replace />;
  }

  return children;
};

export default RoleGuard;