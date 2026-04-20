import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BriefcaseMedical,
  Download,
  Filter,
  Flame,
  HeartPulse,
  Loader2,
  ShieldAlert,
  Siren,
  Stethoscope,
  TimerReset,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import hseeLogo from "@/assets/hsee-new-logo.svg";
import HSEEPageHeader from "@/components/hsee/HSEEPageHeader";
import {
  EMPTY_DASHBOARD,
  getHseeDashboardStats,
} from "@/services/hseeDashboardService";

const PERIOD_OPTIONS = [
  { label: "6 mois", value: "6m" },
  { label: "12 mois", value: "12m" },
  { label: "Annuel", value: "annual" },
];

const KPI_META = [
  {
    key: "accidents_travail",
    label: "Accidents de Travail",
    icon: ShieldAlert,
    subtext: "Cas HSEE sur la periode",
    tone: "bg-rose-50 border-rose-100",
    iconTone: "bg-white text-rose-600",
  },
  {
    key: "incidents",
    label: "Incidents",
    icon: TriangleAlert,
    subtext: "Signalements remontes",
    tone: "bg-orange-50 border-orange-100",
    iconTone: "bg-white text-orange-600",
  },
  {
    key: "taux_frequence_tf",
    label: "Taux de Frequence TF",
    icon: TrendingUp,
    subtext: "Calcule sur les donnees disponibles",
    tone: "bg-violet-50 border-violet-100",
    iconTone: "bg-white text-violet-600",
  },
  {
    key: "taux_gravite_tg",
    label: "Taux de Gravite TG",
    icon: TimerReset,
    subtext: "Calcule sur les donnees disponibles",
    tone: "bg-blue-50 border-blue-100",
    iconTone: "bg-white text-blue-600",
  },
  {
    key: "jours_perdus",
    label: "Jours Perdus",
    icon: Flame,
    subtext: "Arrets cumules",
    tone: "bg-amber-50 border-amber-100",
    iconTone: "bg-white text-amber-600",
  },
  {
    key: "transferts_urgence",
    label: "Transferts d'Urgence",
    icon: Siren,
    subtext: "Transports enregistres",
    tone: "bg-red-50 border-red-100",
    iconTone: "bg-white text-red-600",
  },
  {
    key: "visites_medicales",
    label: "Visites Medicales",
    icon: Stethoscope,
    subtext: "Fiches d'aptitude sur la periode",
    tone: "bg-sky-50 border-sky-100",
    iconTone: "bg-white text-sky-600",
  },
  {
    key: "maladies_professionnelles",
    label: "Maladies Professionnelles",
    icon: BriefcaseMedical,
    subtext: "Cas enregistres",
    tone: "bg-emerald-50 border-emerald-100",
    iconTone: "bg-white text-emerald-600",
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatNumber(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "0";
  if (Number.isInteger(numberValue)) return String(numberValue);
  return numberValue.toFixed(2);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      {label ? <p className="text-xs font-medium text-slate-500">{label}</p> : null}
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {formatNumber(payload[0]?.value)}
      </p>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function ChartCard({ title, subtitle, children, action }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {action}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ChartFrame({ loading, error, empty, emptyMessage, children }) {
  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  if (empty) {
    return <EmptyState message={emptyMessage} />;
  }

  return children;
}

function KpiCard({ item, index, value, loading }) {
  const Icon = item.icon;

  return (
    <div
      className={classNames(
        "rounded-2xl border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md",
        item.tone,
      )}
      style={{
        animation: `hseeFadeIn 0.5s ease-out ${index * 70}ms both`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{item.label}</p>
          {loading ? (
            <div className="mt-3 h-9 w-24 animate-pulse rounded-lg bg-white/80" />
          ) : (
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {formatNumber(value)}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">{item.subtext}</p>
        </div>

        <div
          className={classNames(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm",
            item.iconTone,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const tones = {
    "En attente": "bg-slate-200 text-slate-700",
    "En cours": "bg-amber-100 text-amber-700",
    "Terminee": "bg-emerald-100 text-emerald-700",
    "Terminée": "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={classNames(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        tones[status] || "bg-slate-100 text-slate-700",
      )}
    >
      {status}
    </span>
  );
}

export default function HSEEDashboard() {
  const [filters, setFilters] = useState({
    period: "6m",
    department: "",
  });
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getHseeDashboardStats(filters.period, filters.department);
        if (cancelled) return;

        setDashboard(data);
      } catch (err) {
        console.error("Erreur chargement dashboard HSEE", err);
        if (!cancelled) {
          setError("Impossible de charger les donnees du tableau de bord HSEE.");
          setDashboard(EMPTY_DASHBOARD);
        }
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
  }, [filters.department, filters.period]);

  const departments = dashboard?.filters?.departments || [];
  const kpis = dashboard?.kpis || EMPTY_DASHBOARD.kpis;
  const charts = dashboard?.charts || EMPTY_DASHBOARD.charts;
  const accidentsTable = dashboard?.recent_accidents || [];

  const chartRenderKey = useMemo(
    () => `${filters.period}-${filters.department || "all"}`,
    [filters.department, filters.period],
  );

  const totalTrackedAccidents = accidentsTable.length;
  const hasData =
    Object.values(kpis).some((value) => Number(value) > 0) ||
    Object.values(charts).some((value) => Array.isArray(value) && value.length > 0) ||
    accidentsTable.length > 0;

  const dominantVisitType = useMemo(() => {
    if (!charts.medical_visit_types.length) return "Aucune donnee";
    return [...charts.medical_visit_types].sort((a, b) => b.value - a.value)[0]?.name || "Aucune donnee";
  }, [charts.medical_visit_types]);

  const mostExposedInjury = useMemo(() => {
    if (!charts.injury_types.length) return "Aucune donnee";
    return [...charts.injury_types].sort((a, b) => b.value - a.value)[0]?.name || "Aucune donnee";
  }, [charts.injury_types]);

  const topDepartment = useMemo(() => {
    if (!charts.accidents_by_department.length) return "Aucun departement";
    return [...charts.accidents_by_department].sort((a, b) => b.value - a.value)[0]?.name || "Aucun departement";
  }, [charts.accidents_by_department]);

  return (
    <div className="space-y-6 bg-slate-50 pb-6">
      <style>{`
        @keyframes hseeFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <HSEEPageHeader
        eyebrow={null}
        title="Tableau de Bord HSEE"
        subtitle="Indicateurs de performance en Hygiene, Securite, Environnement & Ergonomie."
        leading={
          <img
            src={hseeLogo}
            alt="HSEE Logo"
            className="block h-16 w-auto object-contain"
          />
        }
        actions={
          <>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              Filtres
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Exporter Rapport
            </button>
          </>
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Periode
            </span>
            <select
              value={filters.period}
              onChange={(event) =>
                setFilters((current) => ({ ...current, period: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Departement
            </span>
            <select
              value={filters.department}
              onChange={(event) =>
                setFilters((current) => ({ ...current, department: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
            >
              <option value="">Tous les departements</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      {!loading && !error && !hasData ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
          Aucune donnee disponible pour les filtres selectionnes.
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {KPI_META.map((item, index) => (
          <KpiCard
            key={item.key}
            item={item}
            index={index}
            value={kpis[item.key]}
            loading={loading}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <ChartCard
            title="Accidents par departement"
            subtitle="Repartition des cas declares"
            action="Donut chart"
          >
            <ChartFrame
              loading={loading}
              error={error}
              empty={!charts.accidents_by_department.length}
              emptyMessage="Aucun accident par departement sur cette periode."
            >
              <>
                <div className="h-80 min-w-0">
                  <ResponsiveContainer
                    key={`${chartRenderKey}-departments`}
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={240}
                    style={{ minWidth: 0, minHeight: 240 }}
                  >
                    <PieChart>
                      <Pie
                        data={charts.accidents_by_department}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                      >
                        {charts.accidents_by_department.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {charts.accidents_by_department.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            </ChartFrame>
          </ChartCard>
        </div>

        <div className="xl:col-span-4">
          <ChartCard
            title="Types de lesions"
            subtitle="Analyse des cas les plus frequents"
            action="Bar chart"
          >
            <ChartFrame
              loading={loading}
              error={error}
              empty={!charts.lesion_types.length}
              emptyMessage="Aucun type de lesion disponible."
            >
              <div className="h-80 min-w-0">
                <ResponsiveContainer
                  key={`${chartRenderKey}-lesions`}
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={240}
                  style={{ minWidth: 0, minHeight: 240 }}
                >
                  <BarChart data={charts.lesion_types} barCategoryGap={24}>
                    <CartesianGrid stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartFrame>
          </ChartCard>
        </div>

        <div className="xl:col-span-4">
          <ChartCard
            title="Types de visites medicales"
            subtitle="Volume des visites programmees"
            action="Bar chart"
          >
            <ChartFrame
              loading={loading}
              error={error}
              empty={!charts.medical_visit_types.length}
              emptyMessage="Aucune visite medicale disponible."
            >
              <div className="h-80 min-w-0">
                <ResponsiveContainer
                  key={`${chartRenderKey}-visits`}
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={240}
                  style={{ minWidth: 0, minHeight: 240 }}
                >
                  <BarChart data={charts.medical_visit_types} barCategoryGap={28}>
                    <CartesianGrid stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartFrame>
          </ChartCard>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <ChartCard
            title="Types de blessures"
            subtitle="Localisation la plus exposee"
            action="Horizontal bar"
          >
            <ChartFrame
              loading={loading}
              error={error}
              empty={!charts.injury_types.length}
              emptyMessage="Aucune blessure disponible."
            >
              <div className="h-80 min-w-0">
                <ResponsiveContainer
                  key={`${chartRenderKey}-injuries`}
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={240}
                  style={{ minWidth: 0, minHeight: 240 }}
                >
                  <BarChart data={charts.injury_types} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid stroke="#E2E8F0" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={90}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#f97316" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartFrame>
          </ChartCard>
        </div>

        <div className="xl:col-span-7">
          <ChartCard
            title="Jours perdus par mois"
            subtitle="Evolution mensuelle des arrets"
            action="Bar chart"
          >
            <ChartFrame
              loading={loading}
              error={error}
              empty={!charts.lost_days_by_month.length}
              emptyMessage="Aucun jour perdu sur la periode."
            >
              <div className="h-80 min-w-0">
                <ResponsiveContainer
                  key={`${chartRenderKey}-lost-days`}
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={240}
                  style={{ minWidth: 0, minHeight: 240 }}
                >
                  <BarChart data={charts.lost_days_by_month} barCategoryGap={24}>
                    <CartesianGrid stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#eab308" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartFrame>
          </ChartCard>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tableau des accidents</h2>
            <p className="mt-1 text-sm text-slate-500">
              Suivi des derniers accidents declares et de leur statut de traitement.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <Users className="h-4 w-4" />
            {loading ? "Chargement..." : `${totalTrackedAccidents} dossiers suivis`}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <EmptyState message={error} />
        ) : accidentsTable.length === 0 ? (
          <EmptyState message="Aucun accident recent pour les filtres selectionnes." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left">
                  {["N°", "Date", "Employe", "Departement", "Nature", "Jours", "Statut"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {accidentsTable.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/80">
                    <td className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-900">
                      {row.id}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
                      {row.date}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 text-slate-800">
                      {row.employee}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
                      {row.department}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 text-slate-600">
                      {row.nature}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4 text-slate-800">
                      {row.days}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Voir le registre complet
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Focus Sante</h3>
              <p className="text-sm text-slate-500">Suivi prevention & visites</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Le type de visite le plus represente sur la periode est{" "}
            <span className="font-semibold text-slate-900">{dominantVisitType}</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Point de vigilance</h3>
              <p className="text-sm text-slate-500">Blessures les plus exposees</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            La zone corporelle la plus exposee est{" "}
            <span className="font-semibold text-slate-900">{mostExposedInjury}</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Tendance</h3>
              <p className="text-sm text-slate-500">Pilotage du semestre</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Le departement le plus expose est{" "}
            <span className="font-semibold text-slate-900">{topDepartment}</span> sur
            les donnees filtrees.
          </p>
        </div>
      </section>
    </div>
  );
}
