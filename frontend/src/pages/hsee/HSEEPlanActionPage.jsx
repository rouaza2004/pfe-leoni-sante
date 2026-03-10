import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  CheckCircle,
  ShieldAlert,
  MapPinned,
  Clock3,
  Loader2,
} from "lucide-react";
import { api } from "@/api/api";

function formatPlanStatut(statut) {
  if (statut === "PLANIFIE") return "Planifié";
  if (statut === "EN_COURS") return "En cours";
  if (statut === "TERMINE") return "Terminé";
  return statut || "—";
}

function badgeColor(statut) {
  if (statut === "TERMINE" || statut === "Terminé") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (statut === "EN_COURS" || statut === "En cours") {
    return "bg-blue-100 text-blue-700";
  }
  return "bg-amber-100 text-amber-700";
}

function SummaryCard({ icon: Icon, title, value, iconBg, iconColor }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function HSEEPlanActionPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await api.get("/medical/hsee/plan-action/");

        if (cancelled) return;
        setPlans(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setErr("Impossible de charger le plan d'action HSEE.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = plans.length;
    const enCours = plans.filter((item) => item.statut === "EN_COURS").length;
    const terminees = plans.filter((item) => item.statut === "TERMINE").length;

    return { total, enCours, terminees };
  }, [plans]);

  const zoneCritique = useMemo(() => {
    if (!plans.length) return "—";
    return plans[0]?.zone || "—";
  }, [plans]);

  const actionPrioritaire = useMemo(() => {
    const enCours = plans.find((item) => item.statut === "EN_COURS");
    return enCours?.action || plans[0]?.action || "—";
  }, [plans]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement du plan d'action HSEE...</span>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
        {err}
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Plan d'action HSEE</h1>
        <p className="mt-2 text-sm text-slate-500">
          Suivi des mesures préventives, des zones à risque et de l’avancement des actions.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Actions totales"
          value={stats.total}
          icon={ClipboardList}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SummaryCard
          title="Actions en cours"
          value={stats.enCours}
          icon={Clock3}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <SummaryCard
          title="Actions terminées"
          value={stats.terminees}
          icon={CheckCircle}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="space-y-4 xl:col-span-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                      <ShieldAlert className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{plan.zone}</h3>
                      <p className="text-sm text-slate-500">Zone concernée</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Risque
                      </p>
                      <p className="mt-1 text-sm text-slate-800">{plan.risque || "—"}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Responsable
                      </p>
                      <p className="mt-1 text-sm text-slate-800">{plan.responsable || "—"}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Action préventive
                      </p>
                      <p className="mt-1 text-sm text-slate-800">{plan.action || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${badgeColor(plan.statut)}`}
                  >
                    {formatPlanStatut(plan.statut)}
                  </span>

                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">Délai :</span>{" "}
                    {plan.delai || "—"}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {plans.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Aucune action HSEE disponible.
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                <MapPinned className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Priorités</h2>
                <p className="text-sm text-slate-500">
                  Axes principaux du plan d’action
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Zone critique</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{zoneCritique}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Action prioritaire</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{actionPrioritaire}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Objectif</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  Réduire les accidents en atelier
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Objectif HSEE</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Réduire durablement les accidents de travail grâce à des actions
              ciblées de prévention, de sensibilisation et d’amélioration continue
              des conditions de sécurité dans les zones à risque.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}