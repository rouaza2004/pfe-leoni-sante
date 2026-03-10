import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  ShieldAlert,
  Activity,
  CalendarDays,
  TrendingUp,
  MapPinned,
  Loader2,
} from "lucide-react";
import { api } from "@/api/api";

function KpiCard({ title, value, subtitle, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

function Badge({ children, color = "slate" }) {
  const styles = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[color]}`}>
      {children}
    </span>
  );
}

function graviteColor(gravite) {
  if (gravite === "Grave") return "red";
  if (gravite === "Moyenne") return "yellow";
  return "green";
}

function enqueteColor(enquete) {
  if (enquete === "Terminée") return "green";
  if (enquete === "En cours") return "blue";
  return "yellow";
}

function statutColor(statut) {
  if (statut === "Terminé") return "green";
  if (statut === "En cours") return "blue";
  return "yellow";
}

export default function HSEEDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [kpis, setKpis] = useState(null);
  const [accidentsRecents, setAccidentsRecents] = useState([]);
  const [topCauses, setTopCauses] = useState([]);
  const [plansAction, setPlansAction] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setErr("");

        const [kpisRes, accidentsRes, causesRes, plansRes] = await Promise.all([
          api.get("/medical/hsee/kpis/"),
          api.get("/medical/hsee/accidents/"),
          api.get("/medical/hsee/top-causes/"),
          api.get("/medical/hsee/plan-action/"),
        ]);

        if (cancelled) return;

        setKpis(kpisRes.data || {});
        setAccidentsRecents(Array.isArray(accidentsRes.data) ? accidentsRes.data : []);
        setTopCauses(Array.isArray(causesRes.data) ? causesRes.data : []);
        setPlansAction(Array.isArray(plansRes.data) ? plansRes.data : []);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setErr("Impossible de charger les données HSEE.");
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

  const maxCauseValue = useMemo(
    () => Math.max(...topCauses.map((item) => item.value || 0), 1),
    [topCauses]
  );

  const kpiCards = [
    {
      title: "Accidents déclarés",
      value: kpis?.accidents_declares ?? 0,
      subtitle: "Total enregistré",
      icon: AlertTriangle,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
    {
      title: "Taux de fréquence",
      value: kpis?.taux_frequence ?? 0,
      subtitle: "Indicateur TF",
      icon: Activity,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Taux de gravité",
      value: kpis?.taux_gravite ?? 0,
      subtitle: "Indicateur TG",
      icon: ShieldAlert,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      title: "Jours perdus",
      value: kpis?.jours_perdus ?? 0,
      subtitle: "Cumul annuel",
      icon: CalendarDays,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement du dashboard HSEE...</span>
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
    <div className="min-h-screen bg-slate-50">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            LEONI • HSEE
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Dashboard HSEE
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Supervision des accidents de travail, analyse des causes, suivi des enquêtes
            et pilotage du plan d’action préventif.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">Accidents graves</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {kpis?.accidents_graves ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">Enquêtes actives</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {kpis?.enquetes_en_cours ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">Zones à risque</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {kpis?.zones_risque ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((item) => (
          <KpiCard
            key={item.title}
            title={item.title}
            value={item.value}
            subtitle={item.subtitle}
            icon={item.icon}
            iconBg={item.iconBg}
            iconColor={item.iconColor}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Supervision des accidents
                </h2>
                <p className="text-sm text-slate-500">
                  Liste récente des accidents déclarés et état des enquêtes
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-3 font-medium">Collaborateur</th>
                    <th className="py-3 font-medium">Date</th>
                    <th className="py-3 font-medium">Type</th>
                    <th className="py-3 font-medium">Zone</th>
                    <th className="py-3 font-medium">Gravité</th>
                    <th className="py-3 font-medium">Enquête</th>
                  </tr>
                </thead>
                <tbody>
                  {accidentsRecents.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-4 font-medium text-slate-800">
                        {`${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim() || item.collaborateur_nom}
                      </td>
                      <td className="py-4 text-slate-600">{item.date_accident}</td>
                      <td className="py-4 text-slate-600">{item.type_accident}</td>
                      <td className="py-4 text-slate-600">{item.zone}</td>
                      <td className="py-4">
                        <Badge color={graviteColor(item.gravite_display)}>
                          {item.gravite_display}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Badge color={enqueteColor(item.enquete_display)}>
                          {item.enquete_display}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {accidentsRecents.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-500">
                  Aucun accident disponible.
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Analyse des causes
                  </h2>
                  <p className="text-sm text-slate-500">
                    Top causes fréquentes des accidents
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {topCauses.map((cause) => {
                  const width = (cause.value / maxCauseValue) * 100;

                  return (
                    <div key={cause.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          {cause.label}
                        </span>
                        <span className="text-sm text-slate-500">{cause.value}</span>
                      </div>

                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-800"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {topCauses.length === 0 && (
                  <div className="text-sm text-slate-500">Aucune cause disponible.</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Tendances
                  </h2>
                  <p className="text-sm text-slate-500">
                    Lecture rapide des indicateurs
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">
                    Segment le plus exposé
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {topCauses.length > 0 ? "Voir statistiques" : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">
                    Cause dominante
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {topCauses[0]?.label || "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">
                    Priorité du mois
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    Réduction des accidents en atelier
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <ClipboardList className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Plan d’action</h2>
                <p className="text-sm text-slate-500">
                  Suivi des actions préventives par zone à risque
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {plansAction.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">{item.zone}</h3>
                      <p className="mt-1 text-xs text-slate-400">Zone surveillée</p>
                    </div>
                    <Badge color={statutColor(item.statut === "PLANIFIE" ? "Planifié" : item.statut)}>
                      {item.statut === "PLANIFIE"
                        ? "Planifié"
                        : item.statut === "EN_COURS"
                        ? "En cours"
                        : item.statut === "TERMINE"
                        ? "Terminé"
                        : item.statut}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-800">Risque :</span>{" "}
                      {item.risque}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-800">Action :</span>{" "}
                      {item.action}
                    </p>
                  </div>
                </div>
              ))}

              {plansAction.length === 0 && (
                <div className="text-sm text-slate-500">Aucune action disponible.</div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                <MapPinned className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Résumé rapide</h2>
                <p className="text-sm text-slate-500">
                  Vue synthétique des priorités HSEE
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">Accidents graves</span>
                <span className="text-sm font-semibold text-slate-900">
                  {kpis?.accidents_graves ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">Enquêtes en cours</span>
                <span className="text-sm font-semibold text-slate-900">
                  {kpis?.enquetes_en_cours ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">Zones à risque identifiées</span>
                <span className="text-sm font-semibold text-slate-900">
                  {kpis?.zones_risque ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">Actions terminées</span>
                <span className="text-sm font-semibold text-slate-900">
                  {plansAction.filter((item) => item.statut === "TERMINE").length}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}