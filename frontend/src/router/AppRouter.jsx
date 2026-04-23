import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import LoginPage from "../pages/shared/LoginPage";
import Dashboard from "../pages/shared/Dashboard";
import CollaborateurProfilePage from "../pages/shared/CollaborateurProfilePage";
import FicheAptitudeForm from "../pages/medecin-travail/FicheAptitudeForm";
import AnalysesLaboPage from "../pages/medecin-travail/AnalysesLaboPage";
import ExamenComplementaireForm from "../pages/medecin-travail/ExamenComplementaireForm";
import FichesAptitudePage from "../pages/medecin-travail/FichesAptitudePage";
import AdminDashboard from "../pages/admin/AdminDashboard";

import MedecinTraitantDashboard from "../pages/medecin-traitant/MedecinTraitantDashboard";
import Collaborateurs from "../pages/medecin-traitant/Collaborateurs";
import CollaborateurDetail from "../pages/medecin-traitant/CollaborateurDetail";
import FicheMedicale from "../pages/medecin-traitant/FicheMedicale";
import FicheMedicalePage from "../pages/medecin-traitant/FicheMedicalePage";
import CertificatOrdonnancePage from "../pages/medecin-traitant/CertificatOrdonnancePage";
import DocumentsMedicauxPage from "../pages/medecin-traitant/DocumentsMedicauxPage";
import RDV from "../pages/medecin-traitant/RDV";

import MedecinTravailDashboard from "../pages/medecin-travail/MedecinTravailDashboard";
import CollaborateursMedTravail from "../pages/medecin-travail/CollaborateursMedTravail";
import DossierMedicalCompletForm from "../pages/medecin-travail/DossierMedicalCompletForm";
import RDVMedTravailPage from "../pages/medecin-travail/RDVMedTravailPage";

import MedecinControleurDashboard from "../pages/medecin-controleur/MedecinControleurDashboard";
import RechercheCollaborateurMC from "../pages/medecin-controleur/RechercheCollaborateurMC";
import ControleMedicalForm from "../pages/medecin-controleur/ControleMedicalForm";
import ControleMedicalPdfPage from "../pages/medecin-controleur/ControleMedicalPdfPage";
import DemandeExpertiseForm from "../pages/medecin-controleur/DemandeExpertiseForm";
import DemandeExpertisePdfPage from "../pages/medecin-controleur/DemandeExpertisePdfPage";
import HistoriquePage from "../pages/medecin-controleur/HistoriquePage";
import RendezVousPage from "../pages/medecin-controleur/RendezVousPage";
import RapportPage from "../pages/medecin-controleur/RapportPage";

import InfirmierDashboard from "../pages/infirmier/InfirmierDashboard";
import PatientsPage from "../pages/infirmier/PatientsPage";
import PatientDetailPage from "../pages/infirmier/PatientDetailPage";
import IncidentsHubPage from "../pages/infirmier/IncidentsHubPage";
import AccidentsPage from "../pages/infirmier/AccidentsPage";
import EnqueteInitialePage from "../pages/infirmier/EnqueteInitialePage";
import MaladiesProfessionnellesPage from "../pages/infirmier/MaladiesProfessionnellesPage";
import SuiviMPPage from "../pages/infirmier/SuiviMPPage";
import SuiviDeclarationsCNAMPage from "../pages/infirmier/SuiviDeclarationsCNAMPage";
import StockPage from "../pages/infirmier/StockPage";
import RDVPage from "../pages/infirmier/RDVPage";
import DashboardPharmacie from "../pages/infirmier/DashboardPharmacie";
import BonChauffeurPage from "../pages/infirmier/BonChauffeurPage";
import SuiviTransfertsPage from "../pages/infirmier/SuiviTransfertsPage";

import RHDashboard from "../pages/rh/RHDashboard";
import AbsencesPonctualiteRH from "../pages/rh/AbsencesPonctualiteRH";
import NouveauxOperateursRH from "../pages/rh/NouveauxOperateursRH";
import PointageMedecinsPage from "../pages/rh/PointageMedecinsPage";

import HSEEDashboard from "../pages/hsee/HSEEDashboard";
import HSEEStatsPage from "../pages/hsee/HSEEStatsPage";
import HSEEPlanActionPage from "../pages/hsee/HSEEPlanActionPage";
import HSEERiskMapPage from "../pages/hsee/HSEERiskMapPage";
import HSEEEnqueteHistoryPage from "../pages/hsee/HSEEEnqueteHistoryPage";
import HSEEEnqueteWizardPage from "../pages/hsee/HSEEEnqueteWizardPage";
import HSEEReceivedInvestigationsPage from "../pages/hsee/HSEEReceivedInvestigationsPage";
import HSEEReportsPage from "../pages/hsee/HSEEReportsPage";

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
          path="/collaborateur-profile"
          element={
            <RoleRoute
              allowedRoles={[
                "ADMIN",
                "INFIRMIER",
                "MEDECIN_TRAITANT",
                "MEDECIN_TRAVAIL",
                "MEDECIN_CONTROLEUR",
                "RESPONSABLE_RH",
                "AGENT_HSEE",
              ]}
            >
              <CollaborateurProfilePage />
            </RoleRoute>
          }
        />

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
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT", "AGENT_HSEE"]}>
              <MedecinTraitantDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-traitant/collaborateurs"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT", "AGENT_HSEE"]}>
              <Collaborateurs />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-traitant/collaborateurs/:id"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT", "AGENT_HSEE"]}>
              <CollaborateurDetail />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-traitant/fiche-medicale"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT", "AGENT_HSEE"]}>
              <FicheMedicalePage />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-traitant/certificat-ordonnance"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT", "AGENT_HSEE"]}>
              <CertificatOrdonnancePage />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-traitant/collaborateurs/:id/fiche"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT", "AGENT_HSEE"]}>
              <FicheMedicale />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-traitant/collaborateurs/:id/documents"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT", "AGENT_HSEE"]}>
              <DocumentsMedicauxPage />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-traitant/rdv"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAITANT", "AGENT_HSEE"]}>
              <RDV />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL", "AGENT_HSEE"]}>
              <MedecinTravailDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/fiches-aptitude"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL", "AGENT_HSEE"]}>
              <FichesAptitudePage />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/collaborateurs"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL", "AGENT_HSEE"]}>
              <CollaborateursMedTravail />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/dossiers-medicaux"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL", "AGENT_HSEE"]}>
              <CollaborateursMedTravail
                forcedTarget="dossier-medical"
                pageTitle="Dossiers médicaux"
                pageDescription="Sélectionnez un collaborateur pour consulter son dossier médical."
              />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/examens-complementaires"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL", "AGENT_HSEE"]}>
              <CollaborateursMedTravail
                forcedTarget="examen-complementaire"
                pageTitle="Examens complémentaires"
                pageDescription="Sélectionnez un collaborateur pour préparer la demande d'examens complémentaires."
              />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/rdv"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL", "AGENT_HSEE"]}>
              <RDVMedTravailPage />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/collaborateurs/:id"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL", "AGENT_HSEE"]}>
              <DossierMedicalCompletForm />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/collaborateurs/:id/dossier"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL", "AGENT_HSEE"]}>
              <DossierMedicalCompletForm />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/collaborateurs/:id/fiche-aptitude"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL", "AGENT_HSEE"]}>
              <FicheAptitudeForm />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/analyses-labo"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL", "AGENT_HSEE"]}>
              <AnalysesLaboPage />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-travail/collaborateurs/:id/examen-complementaire"
          element={
            <RoleRoute allowedRoles={["MEDECIN_TRAVAIL", "AGENT_HSEE"]}>
              <ExamenComplementaireForm />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-controleur"
          element={
            <RoleRoute allowedRoles={["MEDECIN_CONTROLEUR", "AGENT_HSEE"]}>
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
          path="/medecin-controleur/controle-medical"
          element={
            <RoleRoute allowedRoles={["MEDECIN_CONTROLEUR"]}>
              <ControleMedicalPdfPage />
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
          path="/medecin-controleur/demande-expertise"
          element={
            <RoleRoute allowedRoles={["MEDECIN_CONTROLEUR"]}>
              <DemandeExpertisePdfPage />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-controleur/historique"
          element={
            <RoleRoute allowedRoles={["MEDECIN_CONTROLEUR"]}>
              <HistoriquePage />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-controleur/rendez-vous"
          element={
            <RoleRoute allowedRoles={["MEDECIN_CONTROLEUR"]}>
              <RendezVousPage />
            </RoleRoute>
          }
        />

        <Route
          path="/medecin-controleur/rapport"
          element={
            <RoleRoute allowedRoles={["MEDECIN_CONTROLEUR"]}>
              <RapportPage />
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
          path="/infirmier"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <InfirmierDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/pointage-medecins"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <PointageMedecinsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/patients"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <PatientsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/patients/:id"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <PatientDetailPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/incidents"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <IncidentsHubPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/accidents"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <AccidentsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/enquete-initiale"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <EnqueteInitialePage />
            </RoleRoute>
          }
        />

        <Route
          path="/bon-chauffeur"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <BonChauffeurPage />
            </RoleRoute>
          }
        />

        <Route
          path="/suivi-transferts"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <SuiviTransfertsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/maladies-professionnelles"
          element={<Navigate to="/infirmier/mp/declaration" replace />}
        />

        <Route
          path="/infirmier/mp/declaration"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <MaladiesProfessionnellesPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/mp/suivi"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <SuiviMPPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/cnam/suivi"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <SuiviDeclarationsCNAMPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/stock"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <StockPage />
            </RoleRoute>
          }
        />

        <Route
          path="/infirmier/rdv"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <RDVPage />
            </RoleRoute>
          }
        />

        <Route
          path="/dashboard-pharmacie"
          element={
            <RoleRoute allowedRoles={["INFIRMIER", "AGENT_HSEE"]}>
              <DashboardPharmacie />
            </RoleRoute>
          }
        />

        <Route
          path="/rh"
          element={
            <RoleRoute allowedRoles={["RESPONSABLE_RH", "AGENT_HSEE"]}>
              <RHDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/rh/absences-ponctualite"
          element={
            <RoleRoute allowedRoles={["RESPONSABLE_RH", "AGENT_HSEE"]}>
              <AbsencesPonctualiteRH />
            </RoleRoute>
          }
        />

        <Route
          path="/rh/nouveaux-operateurs"
          element={
            <RoleRoute allowedRoles={["RESPONSABLE_RH", "AGENT_HSEE"]}>
              <NouveauxOperateursRH />
            </RoleRoute>
          }
        />

        <Route
          path="/rh/pointage-medecins"
          element={
            <RoleRoute allowedRoles={["RESPONSABLE_RH", "AGENT_HSEE"]}>
              <PointageMedecinsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/pointage"
          element={
            <RoleRoute
              allowedRoles={["ADMIN", "INFIRMIER", "RESPONSABLE_RH", "AGENT_HSEE"]}
            >
              <PointageMedecinsPage />
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
          path="/hsee/enquete-at"
          element={
            <RoleRoute allowedRoles={["AGENT_HSEE"]}>
              <HSEEEnqueteWizardPage />
            </RoleRoute>
          }
        />

        <Route
          path="/hsee/visites-medicales"
          element={
            <RoleRoute allowedRoles={["AGENT_HSEE"]}>
              <RDVPage />
            </RoleRoute>
          }
        />

        <Route
          path="/hsee/inventaire-medical"
          element={
            <RoleRoute allowedRoles={["AGENT_HSEE"]}>
              <StockPage />
            </RoleRoute>
          }
        />

        <Route
          path="/hsee/cartographie-risques"
          element={
            <RoleRoute allowedRoles={["AGENT_HSEE"]}>
              <HSEERiskMapPage />
            </RoleRoute>
          }
        />

        <Route
          path="/hsee/rapports"
          element={
            <RoleRoute allowedRoles={["AGENT_HSEE"]}>
              <HSEEReportsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/hsee/historique-enquetes"
          element={
            <RoleRoute allowedRoles={["AGENT_HSEE"]}>
              <HSEEEnqueteHistoryPage />
            </RoleRoute>
          }
        />

        <Route
          path="/hsee/enquetes-recues"
          element={
            <RoleRoute allowedRoles={["AGENT_HSEE"]}>
              <HSEEReceivedInvestigationsPage />
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
