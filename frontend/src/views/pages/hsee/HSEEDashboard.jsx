import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Package,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import hseeLogo from "@/views/assets/hsee-new-logo.svg";
import { api } from "@/api/api";
import {
  EMPTY_DASHBOARD,
  getHseeDashboardStats,
} from "@/services/hseeDashboardService";
import { SITE_FILTER_OPTIONS } from "@/utils/siteOptions";

const PERIOD_OPTIONS = [
  { label: "6 mois", value: "6m" },
  { label: "12 mois", value: "12m" },
  { label: "Annuel", value: "annual" },
];

const medecinTypeLabel = {
  TRAITANT: "Medecin traitant",
  TRAVAIL: "Medecin du travail",
  CONTROLEUR: "Medecin controleur",
};

const rdvStatusLabel = {
  PREVU: "Prevu",
  TERMINE: "Termine",
  REPORTE: "Reporte",
  ANNULE: "Annule",
};

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR").format(date);
}

function normalizeDateValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function StatCard({ title, value, subtitle, icon, iconClass = "", alert = false }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-2.5 shadow-sm transition hover:shadow-md ${
        alert ? "border-red-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{title}</p>
          <p
            className={`mt-1 text-[22px] font-bold leading-none ${
              alert ? "text-red-600" : "text-slate-900"
            }`}
          >
            {value}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">{subtitle}</p>
        </div>

        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, desc, icon, onClick, iconClass = "" }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ${iconClass}`}
      >
        {icon}
      </div>
      <h3 className="text-[13px] font-semibold leading-tight text-slate-900">{title}</h3>
      <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{desc}</p>
    </button>
  );
}

function SectionShell({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="text-[10px] text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function IncidentBadge({ text }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
      <TriangleAlert size={10} />
      {text || "-"}
    </span>
  );
}

function AccidentBadge({ status }) {
  const toneMap = {
    "Envoye HSEE": "bg-emerald-50 text-emerald-700",
    "En cours": "bg-amber-50 text-amber-700",
    Brouillon: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
        toneMap[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      <CheckCircle2 size={10} />
      {status || "En attente"}
    </span>
  );
}

export default function HSEEDashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    period: "6m",
    department: "",
    site: "all",
  });
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [kpiDetails, setKpiDetails] = useState({
    enquetes_en_cours: 0,
  });
  const [incidents, setIncidents] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [plans, setPlans] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [dashboardData, hseeKpisRes, incidentsRes, stockRes, plansRes, rdvRes] =
          await Promise.all([
            getHseeDashboardStats(
              filters.period,
              filters.department,
              filters.site !== "all" ? filters.site : "",
            ),
            api.get("/medical/hsee/kpis/", {
              params: {
                period: filters.period,
                ...(filters.department ? { department: filters.department } : {}),
                ...(filters.site && filters.site !== "all" ? { site: filters.site } : {}),
              },
            }),
            api.get("/medical/incidents/", {
              params:
                filters.site && filters.site !== "all"
                  ? { site: filters.site }
                  : undefined,
            }),
            api.get("/medical/stock/items/"),
            api.get("/medical/hsee/plan-action/"),
            api.get("/appointments/rdv/", {
              params:
                filters.site && filters.site !== "all"
                  ? { site: filters.site }
                  : undefined,
            }),
          ]);

        if (cancelled) return;

        setDashboard(dashboardData);
        setKpiDetails({
          enquetes_en_cours: Number(hseeKpisRes?.data?.enquetes_en_cours || 0),
        });
        setIncidents(Array.isArray(incidentsRes?.data) ? incidentsRes.data : []);
        setStockItems(Array.isArray(stockRes?.data) ? stockRes.data : []);
        setPlans(Array.isArray(plansRes?.data) ? plansRes.data : []);
        setRdvs(Array.isArray(rdvRes?.data) ? rdvRes.data : []);
      } catch (err) {
        console.error("Erreur chargement dashboard HSEE", err);
        if (cancelled) return;
        setError("Impossible de charger les donnees du tableau de bord HSEE.");
        setDashboard(EMPTY_DASHBOARD);
        setKpiDetails({ enquetes_en_cours: 0 });
        setIncidents([]);
        setStockItems([]);
        setPlans([]);
        setRdvs([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [filters.department, filters.period, filters.site]);

  const departments = dashboard?.filters?.departments || [];
  const sites =
    dashboard?.filters?.sites?.length > 0
      ? [
          { value: "all", label: "Tous les sites" },
          ...dashboard.filters.sites.map((site) => ({ value: site, label: site })),
        ]
      : SITE_FILTER_OPTIONS;
  const accidentsTable = dashboard?.recent_accidents || [];
  const charts = dashboard?.charts || EMPTY_DASHBOARD.charts;

  const incidentsRecent = useMemo(() => {
    return [...incidents]
      .sort((a, b) => {
        const da = `${a.date_incident || ""} ${a.heure_incident || ""}`;
        const db = `${b.date_incident || ""} ${b.heure_incident || ""}`;
        return db.localeCompare(da);
      })
      .slice(0, 4);
  }, [incidents]);

  const accidentsRecent = useMemo(() => accidentsTable.slice(0, 4), [accidentsTable]);

  const stockAlerts = useMemo(
    () => stockItems.filter((item) => Number(item.quantite) <= Number(item.seuil_critique || 0)),
    [stockItems],
  );

  const stockAlertsList = useMemo(() => stockAlerts.slice(0, 4), [stockAlerts]);

  const overduePlans = useMemo(() => {
    return plans.filter((plan) => {
      const dueDate = normalizeDateValue(plan.delai);
      const status = String(plan.statut || "").toUpperCase();
      if (!dueDate) return false;
      if (status === "TERMINE") return false;
      return dueDate < today;
    });
  }, [plans, today]);

  const rdvTodayList = useMemo(
    () => rdvs.filter((rdv) => normalizeDateValue(rdv.date) === today).slice(0, 4),
    [rdvs, today],
  );

  const incidentsToday = useMemo(
    () => incidents.filter((item) => normalizeDateValue(item.date_incident) === today).length,
    [incidents, today],
  );

  const accidentsToday = useMemo(
    () => accidentsTable.filter((item) => normalizeDateValue(item.date) === today).length,
    [accidentsTable, today],
  );

  const dominantVisitType = useMemo(() => {
    if (!charts.medical_visit_types.length) return "Aucune donnee";
    return [...charts.medical_visit_types].sort((a, b) => b.value - a.value)[0]?.name || "Aucune donnee";
  }, [charts.medical_visit_types]);

  const topDepartment = useMemo(() => {
    if (!charts.accidents_by_department.length) return "Aucun departement";
    return [...charts.accidents_by_department].sort((a, b) => b.value - a.value)[0]?.name || "Aucun departement";
  }, [charts.accidents_by_department]);

  const summary = useMemo(
    () => ({
      accidentsToday,
      incidentsToday,
      enquetesEnCours: kpiDetails.enquetes_en_cours || 0,
      overdueActions: overduePlans.length,
      stockCritique: stockAlerts.length,
      totalAccidents: dashboard?.kpis?.accidents_travail || 0,
      totalIncidents: dashboard?.kpis?.incidents || 0,
      visitesMedicales: dashboard?.kpis?.visites_medicales || 0,
    }),
    [accidentsToday, incidentsToday, kpiDetails.enquetes_en_cours, overduePlans.length, stockAlerts.length, dashboard?.kpis],
  );

  return (
    <div className="space-y-2">
      <div className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Espace HSEE</p>
            <h1 className="mt-0.5 text-[22px] font-bold tracking-tight text-slate-900">
              Dashboard HSEE
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Vue d'ensemble des activites HSE et suivi des indicateurs cles.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <img src={hseeLogo} alt="HSEE Logo" className="h-10 w-auto object-contain" />
          </div>
        </div>
      </div>

      <SectionShell title="Filtres" subtitle="Pilotage du tableau de bord HSEE">
        <div className="grid gap-2 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-slate-500">Periode</span>
            <select
              value={filters.period}
              onChange={(event) =>
                setFilters((current) => ({ ...current, period: event.target.value }))
              }
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-slate-500">Departement</span>
            <select
              value={filters.department}
              onChange={(event) =>
                setFilters((current) => ({ ...current, department: event.target.value }))
              }
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            >
              <option value="">Tous les departements</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-slate-500">Site</span>
            <select
              value={filters.site}
              onChange={(event) =>
                setFilters((current) => ({ ...current, site: event.target.value }))
              }
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300"
            >
              {sites.map((site) => (
                <option key={site.value} value={site.value}>
                  {site.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </SectionShell>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Accidents aujourd'hui"
          value={loading ? "..." : summary.accidentsToday}
          subtitle="Accidents HSEE detectes"
          icon={<ShieldAlert size={16} className="text-amber-600" />}
          iconClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Incidents aujourd'hui"
          value={loading ? "..." : summary.incidentsToday}
          subtitle="Signalements recents"
          icon={<TriangleAlert size={16} className="text-rose-600" />}
          iconClass="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Enquetes en cours"
          value={loading ? "..." : summary.enquetesEnCours}
          subtitle="Dossiers a suivre"
          icon={<ClipboardList size={16} className="text-blue-600" />}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Actions en retard"
          value={loading ? "..." : summary.overdueActions}
          subtitle="Plan d'action a relancer"
          icon={<AlertTriangle size={16} className="text-orange-600" />}
          iconClass="bg-orange-50 text-orange-600"
        />
        <StatCard
          title="Stock critique"
          value={loading ? "..." : summary.stockCritique}
          subtitle="Articles sous le seuil"
          icon={<Package size={16} className="text-red-600" />}
          iconClass="bg-red-50 text-red-600"
          alert
        />
      </div>

      <SectionShell title="Actions rapides" subtitle="Acces direct aux operations HSEE">
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <QuickAction
            title="Declarer incident"
            desc="Enregistrer un incident."
            icon={<TriangleAlert size={15} className="text-rose-600" />}
            onClick={() => navigate("/infirmier/incidents")}
            iconClass="bg-rose-50 text-rose-600"
          />
          <QuickAction
            title="Declarer accident"
            desc="Ouvrir la declaration."
            icon={<ShieldAlert size={15} className="text-amber-600" />}
            onClick={() => navigate("/infirmier/accidents")}
            iconClass="bg-amber-50 text-amber-600"
          />
          <QuickAction
            title="Nouvelle enquete"
            desc="Fiche HSEE AT/incident."
            icon={<ClipboardList size={15} className="text-blue-600" />}
            onClick={() => navigate("/hsee/enquete-at")}
            iconClass="bg-blue-50 text-blue-600"
          />
          <QuickAction
            title="Plan d'action"
            desc="Suivre les mesures."
            icon={<CheckCircle2 size={15} className="text-emerald-600" />}
            onClick={() => navigate("/hsee/plan-action")}
            iconClass="bg-emerald-50 text-emerald-600"
          />
          <QuickAction
            title="Rapports"
            desc="Generer ou consulter."
            icon={<FileText size={15} className="text-slate-700" />}
            onClick={() => navigate("/hsee/rapports")}
            iconClass="bg-slate-100 text-slate-700"
          />
          <QuickAction
            title="Stock"
            desc="Voir les alertes stock."
            icon={<Package size={15} className="text-indigo-600" />}
            onClick={() => navigate("/hsee/inventaire-medical")}
            iconClass="bg-indigo-50 text-indigo-600"
          />
        </div>
      </SectionShell>

      <div className="grid gap-2 xl:grid-cols-[1.1fr_1.1fr_0.9fr]">
        <SectionShell
          title="Incidents recents"
          subtitle="Derniers signalements HSE"
          action={
            <button
              onClick={() => navigate("/infirmier/incidents")}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              Voir tout
              <ArrowUpRight size={13} />
            </button>
          }
        >
          {loading ? (
            <div className="py-4 text-center text-slate-500">Chargement...</div>
          ) : incidentsRecent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-1.5 py-1 font-medium">Date</th>
                    <th className="px-1.5 py-1 font-medium">Collaborateur</th>
                    <th className="px-1.5 py-1 font-medium">Matricule</th>
                    <th className="px-1.5 py-1 font-medium">Liaison</th>
                    <th className="px-1.5 py-1 font-medium">Observation</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentsRecent.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-1.5 py-1 text-slate-700">
                        <div>{formatDate(item.date_incident)}</div>
                        <div className="text-[10px] text-slate-400">{item.heure_incident || "--:--"}</div>
                      </td>
                      <td className="px-1.5 py-1 font-medium text-slate-900">
                        {`${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim() || "--"}
                      </td>
                      <td className="px-1.5 py-1 text-slate-700">{item.matricule || "--"}</td>
                      <td className="px-1.5 py-1">
                        <IncidentBadge text={item.mode_lesion || item.segment || "Incident"} />
                      </td>
                      <td className="px-1.5 py-1 text-slate-700">{item.remarque || item.description || "--"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-4 text-center text-slate-500">Aucun incident disponible.</div>
          )}
        </SectionShell>

        <SectionShell
          title="Accidents recents"
          subtitle="Derniers accidents suivis"
          action={
            <button
              onClick={() => navigate("/infirmier/accidents")}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              Voir tout
              <ArrowUpRight size={13} />
            </button>
          }
        >
          {loading ? (
            <div className="py-4 text-center text-slate-500">Chargement...</div>
          ) : accidentsRecent.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-1.5 py-1 font-medium">Date</th>
                    <th className="px-1.5 py-1 font-medium">Collaborateur</th>
                    <th className="px-1.5 py-1 font-medium">Departement</th>
                    <th className="px-1.5 py-1 font-medium">Nature</th>
                    <th className="px-1.5 py-1 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {accidentsRecent.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-1.5 py-1 text-slate-700">{item.date || "--"}</td>
                      <td className="px-1.5 py-1 font-medium text-slate-900">{item.employee || "--"}</td>
                      <td className="px-1.5 py-1 text-slate-700">{item.department || "--"}</td>
                      <td className="px-1.5 py-1 text-slate-700">{item.nature || "--"}</td>
                      <td className="px-1.5 py-1">
                        <AccidentBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-4 text-center text-slate-500">Aucun accident disponible.</div>
          )}
        </SectionShell>

        <div className="space-y-2">
          <SectionShell
            title="Alertes stock"
            subtitle="Articles sous le seuil critique"
            action={<BellRing className="text-red-500" size={14} />}
          >
            {loading ? (
              <div className="text-xs text-slate-500">Chargement...</div>
            ) : stockAlertsList.length > 0 ? (
              <div className="space-y-1.5">
                {stockAlertsList.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-red-100 bg-red-50 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-slate-900">{item.nom}</p>
                        <p className="text-[10px] text-slate-500">
                          Min: {item.seuil_critique} {item.unite}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">{item.quantite}</p>
                        <p className="text-[10px] text-slate-500">{item.unite}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">Aucune alerte stock.</div>
            )}
          </SectionShell>

          <SectionShell
            title="Rendez-vous du jour"
            subtitle="Suivi medical programme"
            action={<CalendarDays size={14} className="text-slate-700" />}
          >
            {loading ? (
              <div className="text-xs text-slate-500">Chargement...</div>
            ) : rdvTodayList.length > 0 ? (
              <div className="space-y-1.5">
                {rdvTodayList.map((rdv) => (
                  <div
                    key={rdv.id}
                    className="rounded-2xl border border-slate-200 p-2 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-slate-900">
                          {`${rdv.collaborateur_prenom || ""} ${rdv.collaborateur_nom || ""}`.trim() || "--"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {medecinTypeLabel[rdv.type_medecin] || rdv.type_medecin || "-"} ·{" "}
                          {rdvStatusLabel[rdv.statut] || rdv.statut || "-"}
                        </p>
                      </div>
                      <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                        {(rdv.heure || "").slice(0, 5) || "--:--"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">Aucun rendez-vous aujourd'hui.</div>
            )}
          </SectionShell>

          <SectionShell title="Resume rapide" subtitle="Indicateurs HSEE utiles">
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-600">Total accidents</span>
                <span className="font-semibold text-slate-900">{loading ? "..." : summary.totalAccidents}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-600">Total incidents</span>
                <span className="font-semibold text-slate-900">{loading ? "..." : summary.totalIncidents}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-600">Visites medicales</span>
                <span className="font-semibold text-slate-900">{loading ? "..." : summary.visitesMedicales}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-600">Departement le plus expose</span>
                <span className="font-semibold text-slate-900">{loading ? "..." : topDepartment}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-600">Type de visite dominant</span>
                <span className="font-semibold text-slate-900">{loading ? "..." : dominantVisitType}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5">
                <span className="text-slate-600">Actions en retard</span>
                <span className="font-semibold text-red-600">{loading ? "..." : summary.overdueActions}</span>
              </div>
            </div>
          </SectionShell>
        </div>
      </div>
    </div>
  );
}



