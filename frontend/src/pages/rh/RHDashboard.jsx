import StatCard from "../../components/dashboard/StatCard";
import { Calendar, AlertTriangle } from "lucide-react";

export default function RhDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard RH</h1>
        <p className="text-gray-500 text-sm">Suivi CNAM + visites + retards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="CNAM en attente" value="25%" icon={<AlertTriangle size={22} />} />
        <StatCard title="Visites en retard" value="12" icon={<AlertTriangle size={22} />} danger />
        <StatCard title="RDV semaine" value="9" icon={<Calendar size={22} />} />
        <StatCard title="Documents générés" value="3" icon={<Calendar size={22} />} />
      </div>
    </div>
  );
}