import StatCard from "../../components/dashboard/StatCard";
import { Calendar, AlertTriangle } from "lucide-react";

export default function MedecinTravailDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Médecin du Travail</h1>
        <p className="text-gray-500 text-sm">Visites périodiques + conformité + retards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Visites aujourd'hui" value="2" icon={<Calendar size={22} />} />
        <StatCard title="Visites en retard" value="18" icon={<AlertTriangle size={22} />} danger />
        <StatCard title="Conformité" value="82%" icon={<AlertTriangle size={22} />} />
        <StatCard title="RDV semaine" value="7" icon={<Calendar size={22} />} />
      </div>
    </div>
  );
}