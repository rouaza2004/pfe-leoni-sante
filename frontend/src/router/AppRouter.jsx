import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";

import LoginPage from "../pages/shared/LoginPage";
import Dashboard from "../pages/shared/Dashboard";

import AdminDashboard from "../pages/admin/AdminDashboard";
import MedecinTraitantDashboard from "../pages/medecin-traitant/MedecinTraitantDashboard";
import MedecinTravailDashboard from "../pages/medecin-travail/MedecinTravailDashboard";
import MedecinControleurDashboard from "../pages/medecin-controleur/MedecinControleurDashboard";
import InfirmierDashboard from "../pages/infirmier/InfirmierDashboard";
import RHDashboard from "../pages/rh/RHDashboard";
import HSEEDashboard from "../pages/hsee/HSEEDashboard";

import Collaborateurs from "../pages/medecin-traitant/Collaborateurs";
import RDV from "../pages/medecin-traitant/RDV";

import Analyses from "../pages/shared/Analyses";
import Stock from "../pages/infirmier/Stock";
import Utilisateurs from "../pages/admin/Utilisateurs";
import Audit from "../pages/shared/Audit";
import Parametres from "../pages/admin/Parametres";
import NotificationsPage from "../pages/shared/NotificationsPage";

import ProtectedRoute from "../auth/ProtectedRoute";
import RoleRoute from "../auth/RoleRoute";
import PermissionRoute from "../auth/PermissionRoute";
import { getUserRole, isAuthenticated } from "../auth/auth";
import { Permission } from "../lib/permissions";

export default function AppRouter() {
  const role = getUserRole();
  const authed = isAuthenticated();

  // ✅ من / يمشي حسب الحالة
  const defaultPath = authed ? "/dashboard" : "/login";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultPath} replace />} />

      <Route
        path="/login"
        element={authed && role ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      <Route
        path="/unauthorized"
        element={
          <div style={{ padding: 30 }}>
            <h2>⛔ Unauthorized</h2>
            <p>Vous n'avez pas accès à cette page.</p>
          </div>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard عام */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Dashboards حسب الدور */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-traitant"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT"]}>
              <MedecinTraitantDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL"]}>
              <MedecinTravailDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-controleur"
          element={
            <RoleRoute allowedRoles={["MEDECIN_CONTROLEUR"]}>
              <MedecinControleurDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier"
          element={
            <RoleRoute allowedRoles={["INFIRMIER"]}>
              <InfirmierDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/rh"
          element={
            <RoleRoute allowedRoles={["RESPONSABLE_RH"]}>
              <RHDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/hsee"
          element={
            <RoleRoute allowedRoles={["AGENT_HSEE"]}>
              <HSEEDashboard />
            </RoleRoute>
          }
        />

        {/* ✅ Routes خاصة بالـ Médecin Traitant */}
        <Route
          path="/medecin-traitant/collaborateurs"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT"]}>
              {/* إذا تحب permissions خليه PermissionRoute بدل RoleRoute */}
              <Collaborateurs />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-traitant/rdv"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT"]}>
              <RDV />
            </RoleRoute>
          }
        />

        {/* بقيّة الصفحات (اختياري تخليهم global مع PermissionRoute) */}
        <Route
          path="/analyses"
          element={
            <PermissionRoute permission={Permission.VIEW_ANALYSES}>
              <Analyses />
            </PermissionRoute>
          }
        />

        <Route
          path="/stock"
          element={
            <PermissionRoute permission={Permission.VIEW_STOCK}>
              <Stock />
            </PermissionRoute>
          }
        />

        <Route
          path="/utilisateurs"
          element={
            <PermissionRoute permission={Permission.VIEW_USERS}>
              <Utilisateurs />
            </PermissionRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <PermissionRoute permission={Permission.VIEW_AUDIT}>
              <Audit />
            </PermissionRoute>
          }
        />

        <Route
          path="/parametres"
          element={
            <PermissionRoute permission={Permission.VIEW_PARAMETRES}>
              <Parametres />
            </PermissionRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <PermissionRoute permission={Permission.VIEW_NOTIFICATIONS}>
              <NotificationsPage />
            </PermissionRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}