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

function StatCard({ title, value, subtitle, icon, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent}`}>
          {icon}
        </div>
      </div>
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
        subtitle: "—",
        icon: <Pill size={18} className="text-emerald-600" />,
        accent: "bg-emerald-50",
      },
      {
        title: "Taux disponibilité",
        value: `${metrics.taux}%`,
        subtitle: "Produits en stock",
        icon: <TrendingUp size={18} className="text-emerald-600" />,
        accent: "bg-emerald-50",
      },
      {
        title: "Alertes stock",
        value: metrics.stockAlerts,
        subtitle: "Bas + rupture",
        icon: <AlertTriangle size={18} className="text-amber-600" />,
        accent: "bg-amber-50",
      },
      {
        title: "Expirations proches",
        value: metrics.expSoon,
        subtitle: "Expiré ou < 90 j",
        icon: <CalendarClock size={18} className="text-rose-600" />,
        accent: "bg-rose-50",
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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement du tableau pharmacie...</span>
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
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tableau de bord Pharmacie</h1>
            <p className="mt-2 text-sm text-slate-500">
              Analyse des stocks, consommations et tendances
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Répartition des stocks</h2>
          </div>
          <div className="h-64 min-h-[240px] min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={220}
              style={{ minHeight: 220 }}
            >
              <PieChart>
                <Pie
                  data={stockRepartition}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {stockRepartition.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-600">
            {stockRepartition.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Tendances de consommation (6 mois)
            </h2>
          </div>
          <div className="h-64 min-h-[240px] min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={220}
              style={{ minHeight: 220 }}
            >
              <LineChart data={consumption.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                {consumption.categories.map((cat, index) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={LINE_COLORS[index % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Niveaux de stock par catégorie
            </h2>
          </div>
          <div className="h-72 min-h-[260px] min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={220}
              style={{ minHeight: 220 }}
            >
              <BarChart data={stockByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="categorie"
                  width={140}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="stock" fill="#3b82f6" radius={[4, 4, 4, 4]} />
                <Bar dataKey="seuil" fill="#f59e0b" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Échéancier des expirations
            </h2>
          </div>
          <div className="h-72 min-h-[260px] min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={220}
              style={{ minHeight: 220 }}
            >
              <BarChart data={expirationBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {expirationBuckets.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
