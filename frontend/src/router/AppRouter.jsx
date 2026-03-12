import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import LoginPage from "../pages/shared/LoginPage";
import Dashboard from "../pages/shared/Dashboard";

import FicheAptitudeForm from "../pages/medecin-travail/FicheAptitudeForm";
import DemandeAnalyseForm from "../pages/medecin-travail/DemandeAnalyseForm";
import ExamenComplementaireForm from "../pages/medecin-travail/ExamenComplementaireForm";
import FichesAptitudePage from "../pages/medecin-travail/FichesAptitudePage";
import AdminDashboard from "../pages/admin/AdminDashboard";

import MedecinTraitantDashboard from "../pages/medecin-traitant/MedecinTraitantDashboard";
import Collaborateurs from "../pages/medecin-traitant/Collaborateurs";
import CollaborateurDetail from "../pages/medecin-traitant/CollaborateurDetail";
import FicheMedicale from "../pages/medecin-traitant/FicheMedicale";
import DocumentsMedicauxPage from "../pages/medecin-traitant/DocumentsMedicauxPage";
import RDV from "../pages/medecin-traitant/RDV";

import MedecinTravailDashboard from "../pages/medecin-travail/MedecinTravailDashboard";
import CollaborateursMedTravail from "../pages/medecin-travail/CollaborateursMedTravail";
import CollaborateurMedicalDetail from "../pages/medecin-travail/CollaborateurMedicalDetail";
import DossierMedicalCompletForm from "../pages/medecin-travail/DossierMedicalCompletForm";

import MedecinControleurDashboard from "../pages/medecin-controleur/MedecinControleurDashboard";
import RechercheCollaborateurMC from "../pages/medecinControleur/RechercheCollaborateurMC";
import ControleMedicalForm from "../pages/medecinControleur/ControleMedicalForm";
import DemandeExpertiseForm from "../pages/medecinControleur/DemandeExpertiseForm";
import HistoriqueMC from "../pages/medecinControleur/HistoriqueMC";

import InfirmierDashboard from "../pages/infirmier/InfirmierDashboard";
import PatientsPage from "../pages/infirmier/PatientsPage";
import PatientDetailPage from "../pages/infirmier/PatientDetailPage";
import IncidentsPage from "../pages/infirmier/IncidentsPage";
import AccidentsPage from "../pages/infirmier/AccidentsPage";
import StockPage from "../pages/infirmier/StockPage";
import RDVPage from "../pages/infirmier/RDVPage";

import RHDashboard from "../pages/rh/RHDashboard";

import HSEEDashboard from "../pages/hsee/HSEEDashboard";
import HSEEStatsPage from "../pages/hsee/HSEEStatsPage";
import HSEEPlanActionPage from "../pages/hsee/HSEEPlanActionPage";

import ProtectedRoute from "../auth/ProtectedRoute";
import RoleRoute from "../auth/RoleRoute";
import { getUserRole, isAuthenticated } from "../auth/auth";

function UnauthorizedPage() {
  return (
    <div className="p-6 text-2xl font-bold text-red-600">
      Accès non autorisé
    </div>
  );
}

export default function AppRouter() {
  const role = getUserRole();
  const authed = isAuthenticated();

  const defaultPath = authed ? "/dashboard" : "/login";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultPath} replace />} />

      <Route
        path="/login"
        element={
          authed && role ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

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
          path="/medecin-traitant/collaborateurs"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT"]}>
              <Collaborateurs />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-traitant/collaborateurs/:id"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT"]}>
              <CollaborateurDetail />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-traitant/collaborateurs/:id/fiche"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT"]}>
              <FicheMedicale />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-traitant/collaborateurs/:id/documents"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT"]}>
              <DocumentsMedicauxPage />
            </RoleRoute>
          }
        />
<Route
  path="/medecin-travail/fiches-aptitude"
  element={
    <RoleRoute allowedRoles={["MEDECIN_TRAVAIL"]}>
      <FichesAptitudePage />
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

        <Route
          path="/medecin-travail"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL"]}>
              <MedecinTravailDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/collaborateurs"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL"]}>
              <CollaborateursMedTravail />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/collaborateurs/:id"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL"]}>
              <CollaborateurMedicalDetail />
            </RoleRoute>
          }
        />

    <Route
  path="/medecin-travail/collaborateurs/:id/dossier"
  element={
    <RoleRoute allowedRoles={["MEDECIN_TRAVAIL"]}>
      <DossierMedicalCompletForm />
    </RoleRoute>
  }
/>

        <Route
          path="/medecin-travail/collaborateurs/:id/fiche-aptitude"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL"]}>
              <FicheAptitudeForm />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/collaborateurs/:id/demande-analyse"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL"]}>
              <DemandeAnalyseForm />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/collaborateurs/:id/examen-complementaire"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL"]}>
              <ExamenComplementaireForm />
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
  path="/medecin-controleur/recherche"
  element={
    <RoleRoute allowedRoles={["MEDECIN_CONTROLEUR"]}>
      <RechercheCollaborateurMC />
    </RoleRoute>
  }
/>

<Route
  path="/medecin-controleur/controle-medical/:id"
  element={
    <RoleRoute allowedRoles={["MEDECIN_CONTROLEUR"]}>
      <ControleMedicalForm />
    </RoleRoute>
  }
/>

<Route
  path="/medecin-controleur/demande-expertise/:id"
  element={
    <RoleRoute allowedRoles={["MEDECIN_CONTROLEUR"]}>
      <DemandeExpertiseForm />
    </RoleRoute>
  }
/>

<Route
  path="/medecin-controleur/historique"
  element={
    <RoleRoute allowedRoles={["MEDECIN_CONTROLEUR"]}>
      <HistoriqueMC />
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
          path="/infirmier/patients"
          element={
            <RoleRoute allowedRoles={["INFIRMIER"]}>
              <PatientsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/patients/:id"
          element={
            <RoleRoute allowedRoles={["INFIRMIER"]}>
              <PatientDetailPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/incidents"
          element={
            <RoleRoute allowedRoles={["INFIRMIER"]}>
              <IncidentsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/accidents"
          element={
            <RoleRoute allowedRoles={["INFIRMIER"]}>
              <AccidentsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/stock"
          element={
            <RoleRoute allowedRoles={["INFIRMIER"]}>
              <StockPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/rdv"
          element={
            <RoleRoute allowedRoles={["INFIRMIER"]}>
              <RDVPage />
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

        <Route
          path="/hsee/statistiques"
          element={
            <RoleRoute allowedRoles={["AGENT_HSEE"]}>
              <HSEEStatsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/hsee/plan-action"
          element={
            <RoleRoute allowedRoles={["AGENT_HSEE"]}>
              <HSEEPlanActionPage />
            </RoleRoute>
          }
        />

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}