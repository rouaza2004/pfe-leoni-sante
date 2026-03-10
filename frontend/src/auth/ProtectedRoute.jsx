import { Navigate } from "react-router-dom";
import { getUserRole, isAuthenticated } from "./auth.js";

export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}