import { Navigate } from "react-router-dom";
import { getUserRole, isAuthenticated } from "../../auth/auth";

import AdminDashboard from "../admin/AdminDashboard";
import MedecinTraitantDashboard from "../medecin-traitant/MedecinTraitantDashboard";
import MedecinTravailDashboard from "../medecin-travail/MedecinTravailDashboard";
import MedecinControleurDashboard from "../medecin-controleur/MedecinControleurDashboard";
import InfirmierDashboard from "../infirmier/InfirmierDashboard";
import RHDashboard from "../rh/RHDashboard";
import HSEEDashboard from "../hsee/HSEEDashboard";

export default function Dashboard() {
  const authed = isAuthenticated();
  const role = getUserRole();

  if (!authed) return <Navigate to="/login" replace />;
  if (!role) return <Navigate to="/login" replace />;

  switch (role) {
    case "ADMIN":
      return <AdminDashboard />;

    case "MEDECIN_TRAITANT":
      return <MedecinTraitantDashboard />;

    case "MEDECIN_TRAVAIL":
      return <MedecinTravailDashboard />;

    case "MEDECIN_CONTROLEUR":
      return <MedecinControleurDashboard />;

    case "INFIRMIER":
      return <InfirmierDashboard />;

    case "RESPONSABLE_RH":
      return <RHDashboard />;

    case "AGENT_HSEE":
      return <HSEEDashboard />;

    default:
      return <Navigate to="/login" replace />;
  }
}