import StatCard from "../../components/dashboard/StatCard";
import { Calendar, AlertTriangle, Box, FlaskConical, ShieldCheck } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-gray-500 text-sm">Vue globale (RDV, analyses, stock, conformité)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="RDV ce mois" value="6" icon={<Calendar size={22} />} />
        <StatCard title="RDV aujourd'hui" value="1" icon={<Calendar size={22} />} />
        <StatCard title="Analyses en attente" value="5" icon={<FlaskConical size={22} />} />
        <StatCard title="Visites en retard" value="71%" icon={<AlertTriangle size={22} />} danger />
        <StatCard title="Stock critique" value="3" icon={<Box size={22} />} danger />
        <StatCard title="Conformité visites" value="13%" icon={<ShieldCheck size={22} />} danger />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Rendez-vous par mois</h2>
          <div className="h-44 flex items-center justify-center text-gray-400">
            Chart RDV (Recharts)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Analyses par statut</h2>
          <div className="h-44 flex items-center justify-center text-gray-400">
            Pie chart Analyses
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-semibold mb-4">Activité récente</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span>RDV aujourd’hui: Karraÿ Salma (15:00)</span>
            <span className="text-blue-600">Programmé</span>
          </li>
          <li className="flex justify-between">
            <span className="text-red-600">Alerte: Stock critique (Compresses stériles)</span>
            <span className="text-gray-400">Seuil atteint</span>
          </li>
        </ul>
      </div>
    </div>
  );
}