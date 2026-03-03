import { Navigate, useLocation } from "react-router-dom";
import { getUserRole, isAuthenticated } from "./auth";

export default function RoleRoute({ allowedRoles, children }) {
  const role = getUserRole();
  const authed = isAuthenticated();
  const location = useLocation();

  if (!authed) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children;
}