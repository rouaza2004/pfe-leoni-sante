import StatCard from "../../components/dashboard/StatCard";
import { FileCheck, FileSearch, Search, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MedecinControleurDashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard Médecin Contrôleur
        </h1>
        <p className="text-slate-500 text-sm">
          Contrôles médicaux, demandes d’expertise et suivi des dossiers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div onClick={() => navigate("/medecin-controleur/recherche")} className="cursor-pointer">
          <StatCard
            title="Recherche collaborateur"
            value="Accéder"
            icon={<Search size={22} />}
          />
        </div>

        <div onClick={() => navigate("/medecin-controleur/historique")} className="cursor-pointer">
          <StatCard
            title="Contrôles médicaux"
            value="3"
            icon={<FileCheck size={22} />}
          />
        </div>

        <div onClick={() => navigate("/medecin-controleur/historique")} className="cursor-pointer">
          <StatCard
            title="Demandes d’expertise"
            value="1"
            icon={<FileSearch size={22} />}
          />
        </div>

        <div className="cursor-default">
          <StatCard
            title="Dossiers en attente"
            value="2"
            icon={<AlertTriangle size={22} />}
            danger
          />
        </div>
      </div>
    </div>
  );
}