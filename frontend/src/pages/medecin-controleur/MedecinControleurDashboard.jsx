import StatCard from "../../components/dashboard/StatCard";
import { AlertTriangle, Calendar } from "lucide-react";

export default function MedecinControleurDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Médecin Contrôleur</h1>
        <p className="text-gray-500 text-sm">Contrôles + dossiers en attente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Contrôles à faire" value="3" icon={<Calendar size={22} />} />
        <StatCard title="Dossiers incomplets" value="1" icon={<AlertTriangle size={22} />} danger />
        <StatCard title="Visites programmées" value="4" icon={<Calendar size={22} />} />
        <StatCard title="Anomalies" value="0" icon={<AlertTriangle size={22} />} />
      </div>
    </div>
  );
}