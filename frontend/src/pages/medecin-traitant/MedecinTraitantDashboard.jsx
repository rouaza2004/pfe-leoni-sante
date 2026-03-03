import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Bell,
  FileText,
  ClipboardList,
  Stethoscope,
  ArrowRight,
} from "lucide-react";

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      </div>
      <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700">
        {icon}
      </div>
    </div>
  </div>
);

const QuickAction = ({ title, desc, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition w-full"
  >
    <div className="flex items-start gap-3">
      <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      </div>
      <div className="mt-1 text-slate-400">
        <ArrowRight size={18} />
      </div>
    </div>
  </button>
);

const Chip = ({ children }) => (
  <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
    {children}
  </span>
);

export default function MedecinTraitantDashboard() {
  const navigate = useNavigate();

  // ✅ Mock data (بعد تولي API)
  const kpi = useMemo(
    () => ({
      rdvToday: 1,
      rdvWeek: 4,
      collaborateursSuivis: 38,
      docsGenerated: 3,
      alertsCount: 2,
    }),
    []
  );

  const prochainsRdv = useMemo(
    () => [
      {
        nom: "Karray Salma",
        type: "Visite périodique",
        heure: "15:00",
        when: "Aujourd'hui",
      },
      {
        nom: "Ben Salah Ali",
        type: "Visite d'embauche",
        heure: "09:00",
        when: "Demain",
      },
    ],
    []
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Bienvenue • Médecin Traitant</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="text-sm">{kpi.alertsCount} alertes</span>
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="RDV aujourd'hui"
          value={kpi.rdvToday}
          icon={<Calendar size={20} />}
        />
        <StatCard
          title="RDV semaine"
          value={kpi.rdvWeek}
          icon={<Calendar size={20} />}
        />
        <StatCard
          title="Collaborateurs suivis"
          value={kpi.collaborateursSuivis}
          icon={<Users size={20} />}
        />
        <StatCard
          title="Documents générés"
          value={kpi.docsGenerated}
          icon={<FileText size={20} />}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <QuickAction
          title="Ouvrir dossier médical"
          desc="Accéder au dossier d’un collaborateur"
          icon={<Stethoscope size={20} />}
          onClick={() => navigate("/medecin-traitant/collaborateurs")}
        />
        <QuickAction
          title="Remplir fiche médicale"
          desc="Créer / mettre à jour la fiche médicale"
          icon={<ClipboardList size={20} />}
          onClick={() => navigate("/medecin-traitant/collaborateurs")}
        />
        <QuickAction
          title="Créer ordonnance / certificat"
          desc="Générer un document médical"
          icon={<FileText size={20} />}
          onClick={() => navigate("/medecin-traitant/rdv")}
        />
      </div>

      {/* Prochains RDV */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Prochains rendez-vous
          </h2>
          <span className="text-sm text-slate-500">Aujourd&apos;hui & demain</span>
        </div>

        {prochainsRdv.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun rendez-vous قريب.</p>
        ) : (
          <div className="space-y-4">
            {prochainsRdv.map((r, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => navigate("/medecin-traitant/rdv")}
                className="w-full text-left flex items-center justify-between rounded-xl p-3 hover:bg-slate-50 transition"
              >
                <div>
                  <p className="font-semibold text-slate-900">{r.nom}</p>
                  <p className="text-sm text-slate-500">
                    {r.type} • {r.heure}
                  </p>
                </div>
                <Chip>{r.when}</Chip>
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/medecin-traitant/rdv")}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition flex items-center gap-2"
          >
            Voir tous les RDV <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}