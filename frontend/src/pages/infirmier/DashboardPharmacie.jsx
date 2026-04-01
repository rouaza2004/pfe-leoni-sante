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

const CONSUMPTION_CATEGORIES = [
  "Antalgiques",
  "Antiseptiques",
  "Pansements",
  "Antibiotiques",
];

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

function normalizeCategory(value) {
  return (value || "").toString().trim().toLowerCase();
}

export default function DashboardPharmacie() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        const [itemsRes, movementsRes] = await Promise.all([
          api.get("/medical/stock/items/"),
          api.get("/medical/stock/movements/"),
        ]);

        if (cancelled) return;

        setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
        setMovements(Array.isArray(movementsRes.data) ? movementsRes.data : []);
      } catch (error) {
        console.error(error);
        if (!cancelled) setErr("Impossible de charger le tableau de bord pharmacie.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = useMemo(() => new Date(), []);

  const medicaments = useMemo(() => {
    return items.filter(
      (item) =>
        String(item.type_article || "").toUpperCase() === "MEDICAMENT" &&
        (item.actif === undefined || item.actif === true)
    );
  }, [items]);

  const parseDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const diffDays = (start, end) =>
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const isExpired = (item) => {
    const exp = parseDate(item.date_expiration);
    return (item.quantite || 0) === 0 || (exp && diffDays(today, exp) < 0);
  };

  const isExpiringSoon = (item) => {
    const exp = parseDate(item.date_expiration);
    if (!exp) return false;
    const days = diffDays(today, exp);
    return days >= 0 && days <= 90;
  };

  const isLowStock = (item) => {
    const qty = item.quantite || 0;
    const min = item.seuil_critique || 0;
    return qty > 0 && qty <= min;
  };

  const metrics = useMemo(() => {
    const total = medicaments.length;
    const disponibles = medicaments.filter((m) => (m.quantite || 0) > 0).length;
    const taux = total ? Math.round((disponibles / total) * 100) : 0;
    const stockAlerts = medicaments.filter(
      (m) => (m.quantite || 0) === 0 || isLowStock(m)
    ).length;
    const expSoon = medicaments.filter((m) => isExpired(m) || isExpiringSoon(m)).length;

    return { total, taux, stockAlerts, expSoon };
  }, [medicaments]);

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
    const base = { inStock: 0, expSoon: 0, low: 0, expired: 0 };
    medicaments.forEach((item) => {
      if (isExpired(item)) {
        base.expired += 1;
        return;
      }
      if (isExpiringSoon(item)) {
        base.expSoon += 1;
        return;
      }
      if (isLowStock(item)) {
        base.low += 1;
        return;
      }
      base.inStock += 1;
    });
    return [
      { name: "En stock", value: base.inStock, color: STOCK_COLORS.inStock },
      { name: "Expire bientôt", value: base.expSoon, color: STOCK_COLORS.expSoon },
      { name: "Stock bas", value: base.low, color: STOCK_COLORS.low },
      { name: "Expiré", value: base.expired, color: STOCK_COLORS.expired },
    ];
  }, [medicaments]);

  const expirationBuckets = useMemo(() => {
    const buckets = {
      expired: 0,
      lt30: 0,
      d30_90: 0,
      d90_180: 0,
      d180_365: 0,
      gt365: 0,
    };

    medicaments.forEach((item) => {
      const exp = parseDate(item.date_expiration);
      if (!exp) return;
      const days = diffDays(today, exp);
      if (days < 0) buckets.expired += 1;
      else if (days <= 30) buckets.lt30 += 1;
      else if (days <= 90) buckets.d30_90 += 1;
      else if (days <= 180) buckets.d90_180 += 1;
      else if (days <= 365) buckets.d180_365 += 1;
      else buckets.gt365 += 1;
    });

    return [
      { label: "Expiré", value: buckets.expired, color: EXP_BUCKET_COLORS.expired },
      { label: "< 30j", value: buckets.lt30, color: EXP_BUCKET_COLORS.lt30 },
      { label: "30-90j", value: buckets.d30_90, color: EXP_BUCKET_COLORS.d30_90 },
      { label: "3-6 mois", value: buckets.d90_180, color: EXP_BUCKET_COLORS.d90_180 },
      { label: "6-12 mois", value: buckets.d180_365, color: EXP_BUCKET_COLORS.d180_365 },
      { label: "> 12 mois", value: buckets.gt365, color: EXP_BUCKET_COLORS.gt365 },
    ];
  }, [medicaments, today]);

  const stockByCategory = useMemo(() => {
    const map = new Map();
    medicaments.forEach((item) => {
      const cat = item.categorie || "Général";
      const current = map.get(cat) || { categorie: cat, stock: 0, seuil: 0 };
      current.stock += item.quantite || 0;
      current.seuil += item.seuil_critique || 0;
      map.set(cat, current);
    });
    return Array.from(map.values())
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 8);
  }, [medicaments]);

  const consumption = useMemo(() => {
    const now = new Date();
    const monthKeys = [];
    const monthLabels = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      monthLabels.push(
        d.toLocaleString("fr-FR", { month: "short" }).replace(".", "")
      );
    }

    const itemCategoryMap = new Map();
    medicaments.forEach((item) => {
      itemCategoryMap.set(item.id, normalizeCategory(item.categorie));
    });

    const totals = {};
    monthKeys.forEach((key) => {
      totals[key] = {
        Antalgiques: 0,
        Antiseptiques: 0,
        Pansements: 0,
        Antibiotiques: 0,
      };
    });

    movements.forEach((mv) => {
      if (String(mv.type_mouvement || "").toUpperCase() !== "SORTIE") return;
      const date = parseDate(mv.created_at);
      if (!date) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!totals[key]) return;

      const rawCat = itemCategoryMap.get(mv.stock_item) || "";
      if (rawCat.includes("antalg")) totals[key].Antalgiques += mv.quantite || 0;
      else if (rawCat.includes("antisept")) totals[key].Antiseptiques += mv.quantite || 0;
      else if (rawCat.includes("pansement")) totals[key].Pansements += mv.quantite || 0;
      else if (rawCat.includes("antibiot")) totals[key].Antibiotiques += mv.quantite || 0;
    });

    const data = monthKeys.map((key, idx) => ({
      month: monthLabels[idx],
      ...totals[key],
    }));

    return { data, categories: CONSUMPTION_CATEGORIES };
  }, [movements, medicaments]);

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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
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
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
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
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
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
