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

function normalizeText(value, fallback) {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function normalizeStatus(value) {
  const raw = String(value || "").trim().toUpperCase();

  if (["TERMINE", "TERMINEE", "TERMINÉ", "TERMINÉE", "DONE", "CLOSED"].includes(raw)) {
    return "Terminée";
  }
  if (["EN_COURS", "EN COURS", "IN_PROGRESS", "IN PROGRESS", "ONGOING"].includes(raw)) {
    return "En cours";
  }
  if (["PLANIFIE", "PLANIFIEE", "PLANIFIÉ", "PLANIFIÉE", "PLANNED"].includes(raw)) {
    return "Planifiée";
  }
  return normalizeText(value, "En cours");
}

function normalizePriority(value) {
  const raw = String(value || "").trim().toUpperCase();

  if (["HAUTE", "HIGH", "URGENTE", "CRITIQUE"].includes(raw)) return "Haute";
  if (["BASSE", "LOW", "FAIBLE"].includes(raw)) return "Basse";
  if (["MOYENNE", "MEDIUM", "NORMAL"].includes(raw)) return "Moyenne";
  return normalizeText(value, "Moyenne");
}

function formatEcheance(value) {
  if (!value) return "Non spécifiée";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusBadgeClass(statut) {
  if (statut === "Terminée") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (statut === "En cours") return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function priorityBadgeClass(priorite) {
  if (priorite === "Haute") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (priorite === "Basse") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function SummaryCard({ icon: Icon, title, value, iconBg, iconColor }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{title}</p>
          <p className="mt-1 text-[20px] font-bold leading-none text-slate-900">{value}</p>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
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
          setErr("Impossible de charger le plan d’action HSEE.");
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

  const normalizedPlans = useMemo(() => {
    return plans.map((item) => ({
      id: item.id,
      action: normalizeText(
        item.action || item.titre || item.nom || item.description,
        "Action non spécifiée"
      ),
      zone: normalizeText(
        item.zone || item.zone_critique || item.segment || item.site,
        "Non spécifiée"
      ),
      priorite: normalizePriority(item.priorite || item.priority),
      statut: normalizeStatus(item.statut || item.status),
      echeance: formatEcheance(item.echeance || item.date_echeance || item.deadline || item.delai),
      risque: normalizeText(item.risque, "Non spécifié"),
      responsable: normalizeText(item.responsable, "Non spécifié"),
      createdAt: item.created_at || null,
    }));
  }, [plans]);

  const stats = useMemo(() => {
    const total = normalizedPlans.length;
    const enCours = normalizedPlans.filter((item) => item.statut === "En cours").length;
    const terminees = normalizedPlans.filter((item) => item.statut === "Terminée").length;

    return { total, enCours, terminees };
  }, [normalizedPlans]);

  const zoneCritique = useMemo(() => {
    if (!normalizedPlans.length) return "Non spécifiée";

    const counts = new Map();
    normalizedPlans.forEach((item) => {
      counts.set(item.zone, (counts.get(item.zone) || 0) + 1);
    });

    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Non spécifiée";
  }, [normalizedPlans]);

  const actionPrioritaire = useMemo(() => {
    if (!normalizedPlans.length) return "Action non spécifiée";

    const haute = normalizedPlans.find((item) => item.priorite === "Haute");
    if (haute) return haute.action;

    const enCours = normalizedPlans.find((item) => item.statut === "En cours");
    if (enCours) return enCours.action;

    return normalizedPlans[0]?.action || "Action non spécifiée";
  }, [normalizedPlans]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement du plan d’action HSEE...</span>
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
    <div className="space-y-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">Espace HSEE</p>
          <h1 className="mt-0.5 text-[20px] font-bold tracking-tight text-slate-900">
            Plan d’action HSEE
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Suivi compact des actions, des zones à risque et des priorités HSEE.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
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

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1.7fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-2.5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <ClipboardList className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Actions récentes</h2>
              <p className="text-[10px] text-slate-500">
                Suivi opérationnel des actions HSEE en cours et terminées
              </p>
            </div>
          </div>

          {normalizedPlans.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-xs text-slate-500">
              Aucune action HSEE disponible.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[2fr_1.2fr_0.9fr_0.9fr_1fr] gap-2 border-b border-slate-200 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <span>Action</span>
                  <span>Zone critique</span>
                  <span>Priorité</span>
                  <span>Statut</span>
                  <span>Échéance</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {normalizedPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="grid grid-cols-[2fr_1.2fr_0.9fr_0.9fr_1fr] gap-2 px-2 py-2.5 text-[11px] text-slate-700"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{plan.action}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Risque : {plan.risque} • Responsable : {plan.responsable}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className="truncate">{plan.zone}</span>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${priorityBadgeClass(plan.priorite)}`}
                        >
                          {plan.priorite}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${statusBadgeClass(plan.statut)}`}
                        >
                          {plan.statut}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span>{plan.echeance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <MapPinned className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Priorités</h2>
                <p className="text-[10px] text-slate-500">Axes principaux du plan d’action</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="rounded-2xl bg-slate-50 p-2.5">
                <p className="text-xs font-medium text-slate-700">Zone critique</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{zoneCritique}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-2.5">
                <p className="text-xs font-medium text-slate-700">Action prioritaire</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{actionPrioritaire}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-2.5">
                <p className="text-xs font-medium text-slate-700">Objectif</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  Réduire les accidents en atelier
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <ShieldAlert className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Objectif HSEE</h2>
                <p className="text-[10px] text-slate-500">Vision d’amélioration continue</p>
              </div>
            </div>

            <p className="text-[11px] leading-5 text-slate-600">
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
