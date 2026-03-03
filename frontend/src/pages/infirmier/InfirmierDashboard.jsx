import StatCard from "../../components/dashboard/StatCard";
import { Box, Calendar } from "lucide-react";

export default function InfirmierDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Infirmier</h1>
        <p className="text-gray-500 text-sm">Soins + stock + RDV</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Soins aujourd'hui" value="5" icon={<Calendar size={22} />} />
        <StatCard title="Stock critique" value="2" icon={<Box size={22} />} danger />
        <StatCard title="Entrées stock" value="4" icon={<Box size={22} />} />
        <StatCard title="Sorties stock" value="3" icon={<Box size={22} />} />
      </div>
    </div>
  );
}