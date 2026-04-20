import { useEffect, useMemo, useState } from "react";
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
import { api } from "@/api/api";

const DAILY_CAPACITY_MAX = 20;

const StatCard = ({ title, value, icon }) => (
  <div className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 border-t-blue-100 hover:-translate-y-0.5 hover:shadow-md transition duration-200">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">{value}</p>
      </div>
      <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 transition duration-200 group-hover:scale-[1.03]">
        {icon}
      </div>
    </div>
  </div>
);

const QuickAction = ({ title, desc, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group text-left bg-white rounded-2xl p-5 shadow-sm border border-slate-100 border-t-blue-100 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md transition duration-200 w-full"
  >
    <div className="flex items-start gap-3">
      <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 transition duration-200 group-hover:scale-[1.03]">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      </div>
      <div className="mt-1 text-slate-400 transition duration-200 group-hover:translate-x-0.5 group-hover:text-slate-600">
        <ArrowRight size={18} />
      </div>
    </div>
  </button>
);

const Chip = ({ children, className = "" }) => (
  <span
    className={`text-xs px-3 py-1.5 rounded-full ${className}`.trim()}
  >
    {children}
  </span>
);

const formatAppointmentType = (value) => {
  if (value === "Visite périodique") return value;
  if (value === "Visite d'embauche") return value;
  return value || "Consultation";
};

export default function MedecinTraitantDashboard() {
  const navigate = useNavigate();
  const [rdvs, setRdvs] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const [rdvRes, meRes] = await Promise.all([
          api.get("/appointments/rdv/"),
          api.get("/me/"),
        ]);

        if (cancelled) return;

        const allAppointments = Array.isArray(rdvRes.data) ? rdvRes.data : [];
        const currentUserId = Number(meRes?.data?.id);

        const traitantAppointments = allAppointments.filter(
          (item) => item.type_medecin === "TRAITANT"
        );

        const scopedAppointments = Number.isFinite(currentUserId)
          ? traitantAppointments.filter(
              (item) => Number(item.medecin) === currentUserId
            )
          : traitantAppointments;

        setRdvs(scopedAppointments);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setRdvs([]);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }, []);

  const dailyCapacity = useMemo(() => {
    const todayAppointments = rdvs.filter((item) => item.date === today);
    const completed = todayAppointments.filter(
      (item) => item.statut === "TERMINE"
    ).length;
    const inConsultation = 0;
    const remaining = todayAppointments.filter(
      (item) => item.statut === "PREVU"
    ).length;
    const total = completed + inConsultation + remaining;
    const progress = Math.min((total / DAILY_CAPACITY_MAX) * 100, 100);

    return {
      completed,
      inConsultation,
      remaining,
      total,
      progress,
      capacityMax: DAILY_CAPACITY_MAX,
    };
  }, [rdvs, today]);

  const kpi = useMemo(
    () => ({
      rdvToday: dailyCapacity.total,
      rdvWeek: 4,
      collaborateursSuivis: 38,
      docsGenerated: 3,
      alertsCount: 2,
    }),
    [dailyCapacity.total]
  );

  const prochainsRdv = useMemo(() => {
    return rdvs
      .filter((item) => item.date === today || item.date === tomorrow)
      .sort((a, b) => {
        const left = `${a.date || ""}T${a.heure || "00:00:00"}`;
        const right = `${b.date || ""}T${b.heure || "00:00:00"}`;
        return left.localeCompare(right);
      })
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        nom:
          `${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim() ||
          "Collaborateur",
        type: formatAppointmentType(item.motif),
        heure: item.heure?.slice?.(0, 5) || item.heure || "—",
        when: item.date === today ? "Aujourd'hui" : "Demain",
      }));
  }, [rdvs, today, tomorrow]);

  return (
    <div className="p-6 md:p-8 space-y-7">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="RDV aujourd'hui" value={kpi.rdvToday} icon={<Calendar size={20} />} />
        <StatCard title="RDV semaine" value={kpi.rdvWeek} icon={<Calendar size={20} />} />
        <StatCard title="Collaborateurs suivis" value={kpi.collaborateursSuivis} icon={<Users size={20} />} />
        <StatCard title="Documents générés" value={kpi.docsGenerated} icon={<FileText size={20} />} />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-t-blue-100 transition duration-200 hover:shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Capacité du jour</h2>
            <p className="text-sm text-slate-500 mt-1">
              Maximum {dailyCapacity.capacityMax} patients par jour
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tight text-slate-900">
              {dailyCapacity.total} / {dailyCapacity.capacityMax}
            </p>
          </div>
        </div>

        <div className="mt-5 h-3 rounded-full bg-slate-100/80 overflow-hidden">
          <div
            className="h-full rounded-full bg-slate-900 transition-[width] duration-300 ease-out"
            style={{ width: `${dailyCapacity.progress}%` }}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Chip className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            {dailyCapacity.completed} terminés
          </Chip>
          <Chip className="bg-amber-50 text-amber-700 ring-1 ring-amber-200">
            {dailyCapacity.remaining} restants
          </Chip>
          <Chip className="bg-blue-100 text-blue-700 ring-1 ring-blue-200">
            En consultation : {dailyCapacity.inConsultation}
          </Chip>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <QuickAction
          title="Ouvrir dossier médical"
          desc="Accéder au dossier d'un collaborateur"
          icon={<Stethoscope size={20} />}
          onClick={() => navigate("/medecin-traitant/collaborateurs?action=dossier")}
        />
        <QuickAction
          title="Remplir fiche médicale"
          desc="Créer / mettre à jour la fiche médicale"
          icon={<ClipboardList size={20} />}
          onClick={() => navigate("/medecin-traitant/fiche-medicale")}
        />
        <QuickAction
          title="Créer ordonnance / certificat"
          desc="Générer un document médical"
          icon={<FileText size={20} />}
          onClick={() => navigate("/medecin-traitant/certificat-ordonnance")}
        />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-t-blue-100 transition duration-200 hover:shadow-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Prochains rendez-vous</h2>
          <span className="text-sm text-slate-500">Aujourd'hui & demain</span>
        </div>

        {prochainsRdv.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun rendez-vous.</p>
        ) : (
          <div className="space-y-4">
            {prochainsRdv.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => navigate("/medecin-traitant/rdv")}
                className="group w-full text-left flex items-center justify-between rounded-xl p-3 hover:bg-slate-50 transition duration-200"
              >
                <div>
                  <p className="font-semibold text-slate-900">{r.nom}</p>
                  <p className="text-sm text-slate-500">
                    {r.type} • {r.heure}
                  </p>
                </div>
                <Chip className="bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-white">
                  {r.when}
                </Chip>
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/medecin-traitant/rdv")}
            className="group text-sm font-semibold text-slate-700 hover:text-slate-900 transition duration-200 flex items-center gap-2"
          >
            Voir tous les RDV <ArrowRight size={16} className="transition duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
