import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CalendarClock,
  Pill,
  Loader2,
} from "lucide-react";
import { api } from "@/api/api";

const LINE_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#ef4444"];

const STOCK_COLORS = {
  inStock: "#22c55e",
  expSoon: "#f59e0b",
  low: "#fbbf24",
  expired: "#ef4444",
};

const EXP_BUCKET_COLORS = {
  expired: "#b91c1c",
  lt30: "#ef4444",
  d30_90: "#f97316",
  d90_180: "#f59e0b",
  d180_365: "#84cc16",
  gt365: "#22c55e",
};

function StatCard({ title, value, subtitle, icon, iconClass = "", alert = false }) {
  return (
    <div
      className={`flex min-h-[78px] rounded-2xl border bg-white px-3 py-2 shadow-sm transition hover:shadow-md ${
        alert ? "border-red-200" : "border-slate-200"
      }`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] leading-4 text-slate-500">{title}</p>
          <p
            className={`mt-1 text-[18px] font-bold leading-none ${
              alert ? "text-red-600" : "text-slate-900"
            }`}
          >
            {value}
          </p>
          {subtitle ? <p className="mt-1 text-[10px] leading-3.5 text-slate-400">{subtitle}</p> : null}
        </div>

        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            alert ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"
          } ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionShell({ title, subtitle, icon, children, className = "", bodyClassName = "" }) {
  return (
    <div
      className={`flex h-[248px] min-h-[248px] flex-col rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200 ${className}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold leading-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="text-[11px] leading-4 text-slate-500">{subtitle}</p> : null}
        </div>
        {icon ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            {icon}
          </div>
        ) : null}
      </div>
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

function LegendList({ items }) {
  return (
    <div className="grid gap-1 text-[11px] text-slate-600">
      {items.map((entry) => (
        <div
          key={entry.name}
          className="flex h-6 items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1"
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="truncate">{entry.name}</span>
          </div>
          <span className="shrink-0 font-semibold text-slate-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPharmacie() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        const accessToken = localStorage.getItem("access");
        const res = await api.get(
          "/medical/stock/dashboard/",
          accessToken
            ? {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            : undefined
        );
        if (cancelled) return;
        setDashboard(res.data || null);
      } catch (error) {
        console.error(error);
        if (!cancelled) setErr("Impossible de charger le tableau de bord pharmacie.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const handleFocus = () => load();
    const interval = setInterval(load, 60000);
    window.addEventListener("focus", handleFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  const metrics = useMemo(() => {
    return (
      dashboard?.kpis || {
        total: 0,
        taux: 0,
        stockAlerts: 0,
        expSoon: 0,
      }
    );
  }, [dashboard]);

  const kpiCards = useMemo(
    () => [
      {
        title: "Total médicaments",
        value: metrics.total,
        subtitle: "Articles suivis",
        icon: <Pill size={13} className="text-emerald-600" />,
        iconClass: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "Taux disponibilité",
        value: `${metrics.taux}%`,
        subtitle: "Produits en stock",
        icon: <TrendingUp size={13} className="text-blue-600" />,
        iconClass: "bg-blue-50 text-blue-600",
      },
      {
        title: "Alertes stock",
        value: metrics.stockAlerts,
        subtitle: "Bas + rupture",
        icon: <AlertTriangle size={13} />,
        alert: true,
      },
      {
        title: "Expirations proches",
        value: metrics.expSoon,
        subtitle: "Expiré ou < 90 j",
        icon: <CalendarClock size={13} className="text-amber-600" />,
        iconClass: "bg-amber-50 text-amber-600",
      },
    ],
    [metrics]
  );

  const stockRepartition = useMemo(() => {
    const base = dashboard?.stockRepartition || {};
    return [
      { name: "En stock", value: base.inStock || 0, color: STOCK_COLORS.inStock },
      { name: "Expire bientôt", value: base.expSoon || 0, color: STOCK_COLORS.expSoon },
      { name: "Stock bas", value: base.low || 0, color: STOCK_COLORS.low },
      { name: "Expiré", value: base.expired || 0, color: STOCK_COLORS.expired },
    ];
  }, [dashboard]);

  const expirationBuckets = useMemo(() => {
    const buckets = dashboard?.expirationBuckets || {};
    return [
      { label: "Expiré", value: buckets.expired || 0, color: EXP_BUCKET_COLORS.expired },
      { label: "< 30j", value: buckets.lt30 || 0, color: EXP_BUCKET_COLORS.lt30 },
      { label: "30-90j", value: buckets.d30_90 || 0, color: EXP_BUCKET_COLORS.d30_90 },
      { label: "3-6 mois", value: buckets.d90_180 || 0, color: EXP_BUCKET_COLORS.d90_180 },
      { label: "6-12 mois", value: buckets.d180_365 || 0, color: EXP_BUCKET_COLORS.d180_365 },
      { label: "> 12 mois", value: buckets.gt365 || 0, color: EXP_BUCKET_COLORS.gt365 },
    ];
  }, [dashboard]);

  const stockByCategory = useMemo(() => {
    return Array.isArray(dashboard?.stockByCategory) ? dashboard.stockByCategory : [];
  }, [dashboard]);

  const consumption = useMemo(() => {
    return dashboard?.consumption || { data: [], categories: [] };
  }, [dashboard]);

  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Chargement du tableau pharmacie...</span>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
        {err}
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-visible">
      <div className="rounded-3xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
        <div className="flex min-h-[68px] flex-col justify-center">
          <p className="text-[11px] font-medium leading-4 text-slate-500">Espace Pharmacie</p>
          <h1 className="mt-0.5 text-[18px] font-bold leading-5 tracking-tight text-slate-900">
            Tableau de bord Pharmacie
          </h1>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
            Vue compacte des stocks, consommations et expirations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <SectionShell
          title="Répartition des stocks"
          subtitle="Vue globale par état"
          icon={<BarChart3 size={11} />}
          bodyClassName="space-y-1"
        >
          <div className="h-[140px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={stockRepartition}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                >
                  {stockRepartition.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <LegendList items={stockRepartition} />
        </SectionShell>

        <SectionShell
          title="Tendances de consommation"
          subtitle="Historique des 6 derniers mois"
          icon={<TrendingUp size={11} />}
        >
          <div className="h-[145px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart
                data={consumption.data}
                margin={{ top: 2, right: 2, left: -28, bottom: -8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip />
                {consumption.categories.map((cat, index) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={LINE_COLORS[index % LINE_COLORS.length]}
                    strokeWidth={1.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionShell>

        <SectionShell
          title="Niveaux de stock par catégorie"
          subtitle="Stock actuel vs seuil"
          icon={<BarChart3 size={11} />}
        >
          <div className="h-[145px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={stockByCategory}
                layout="vertical"
                margin={{ top: 2, right: 2, left: -8, bottom: -8 }}
                barCategoryGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="categorie"
                  width={82}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                />
                <Tooltip />
                <Bar dataKey="stock" fill="#3b82f6" radius={[3, 3, 3, 3]} />
                <Bar dataKey="seuil" fill="#f59e0b" radius={[3, 3, 3, 3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionShell>

        <SectionShell
          title="Échéancier des expirations"
          subtitle="Répartition des dates de péremption"
          icon={<CalendarClock size={11} />}
        >
          <div className="h-[145px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={expirationBuckets}
                margin={{ top: 2, right: 2, left: -22, bottom: -8 }}
                barCategoryGap={10}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {expirationBuckets.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionShell>
      </div>
    </div>
  );
}
