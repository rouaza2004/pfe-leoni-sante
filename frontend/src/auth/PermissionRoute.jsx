import { Navigate, useLocation } from "react-router-dom";
import { getUserRole, isAuthenticated } from "./auth";
import { hasPermission } from "../lib/hasPermission";

export default function PermissionRoute({ permission, children }) {
  const authed = isAuthenticated();
  const role = getUserRole();
  const location = useLocation();

  if (!authed) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/login" replace />;

  if (!hasPermission(role, permission)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children;
}