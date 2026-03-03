import StatCard from "../../components/dashboard/StatCard";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function HseeDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard HSEE</h1>
        <p className="text-gray-500 text-sm">Alertes + conformité + audits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Alertes non lues" value="8" icon={<AlertTriangle size={22} />} danger />
        <StatCard title="Incidents ouverts" value="1" icon={<AlertTriangle size={22} />} danger />
        <StatCard title="Conformité" value="87%" icon={<ShieldCheck size={22} />} />
        <StatCard title="Audits à faire" value="2" icon={<ShieldCheck size={22} />} />
      </div>
    </div>
  );
}