import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  PieChart as PieChartIcon,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "@/api/api";

const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-[20px] font-bold leading-none text-slate-900">{value}</p>
      <p className="mt-1 text-[10px] text-slate-400">{subtitle}</p>
    </div>
  );
}

function ChartShell({ icon: Icon, iconClass, title, subtitle, children, empty }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-2.5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight text-slate-900">{title}</h2>
          <p className="text-[10px] text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
      {empty ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center text-xs text-slate-500">
          {empty}
        </div>
      ) : null}
    </section>
  );
}

function normalizeLabel(value, fallback) {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function normalizeSegment(accident) {
  return normalizeLabel(
    accident?.segment ||
      accident?.zone ||
      accident?.departement ||
      accident?.activite_service ||
      accident?.service,
    "Non spécifié"
  );
}

function normalizeGravite(accident) {
  const raw =
    accident?.gravite_display ||
    accident?.gravite ||
    accident?.gravity ||
    accident?.niveau_gravite ||
    "";

  const normalized = String(raw).trim();
  if (!normalized) return "Non spécifiée";

  const upper = normalized.toUpperCase();
  if (upper === "FAIBLE") return "Faible";
  if (upper === "MOYENNE" || upper === "MOYEN") return "Moyenne";
  if (upper === "GRAVE") return "Grave";
  return normalized;
}

function normalizeDate(accident) {
  return accident?.date_accident || accident?.date || accident?.created_at || null;
}

function normalizeJoursPerdus(accident) {
  const raw = accident?.jours_perdus ?? accident?.jours_arret ?? accident?.duree_arret ?? 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function buildCountSeries(items, getKey, outputKey) {
  const counts = new Map();

  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, value], index) => ({
      [outputKey]: label,
      value,
      color: COLORS[index % COLORS.length],
    }))
    .sort(
      (a, b) =>
        b.value - a.value ||
        String(a[outputKey]).localeCompare(String(b[outputKey]), "fr")
    );
}

function buildMonthlySeries(items) {
  const counts = new Map();

  items.forEach((item) => {
    const rawDate = normalizeDate(item);
    if (!rawDate) return;

    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return;

    const year = parsed.getFullYear();
    const month = parsed.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => {
      const [year, month] = key.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);

      return {
        mois: new Intl.DateTimeFormat("fr-FR", {
          month: "short",
          year: "numeric",
        }).format(date),
        accidents: value,
      };
    });
}

export default function HSEEStatsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [accidents, setAccidents] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setErr("");

        const response = await api.get("/medical/accidents-travail/");
        if (cancelled) return;

        setAccidents(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setErr("Impossible de charger les statistiques HSEE.");
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

  const kpis = useMemo(() => {
    const total = accidents.length;
    const joursPerdus = accidents.reduce(
      (sum, accident) => sum + normalizeJoursPerdus(accident),
      0
    );

    return {
      accidents_declares: total,
      jours_perdus: joursPerdus,
    };
  }, [accidents]);

  const segments = useMemo(
    () => buildCountSeries(accidents, normalizeSegment, "segment"),
    [accidents]
  );

  const gravites = useMemo(
    () => buildCountSeries(accidents, normalizeGravite, "name"),
    [accidents]
  );

  const mois = useMemo(() => buildMonthlySeries(accidents), [accidents]);

  const segmentCritique = useMemo(() => {
    if (!segments.length) return "-";
    return segments[0]?.segment || "-";
  }, [segments]);

  const graviteDominante = useMemo(() => {
    if (!gravites.length) return "-";
    return gravites[0]?.name || "-";
  }, [gravites]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement des statistiques HSEE...</span>
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
            Statistiques HSEE
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Analyse des accidents, des segments exposés et de l’évolution mensuelle.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <StatCard
          title="Total accidents"
          value={kpis.accidents_declares}
          subtitle="Période enregistrée"
        />
        <StatCard
          title="Segment critique"
          value={segmentCritique}
          subtitle="Zone la plus exposée"
        />
        <StatCard
          title="Gravité dominante"
          value={graviteDominante}
          subtitle="Niveau le plus fréquent"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <ChartShell
          icon={BarChart3}
          iconClass="bg-blue-50 text-blue-600"
          title="Accidents par segment"
          subtitle="Répartition selon les zones de travail"
          empty={segments.length === 0 ? "Aucune statistique disponible." : ""}
        >
          <div className="h-[165px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={segments} margin={{ top: 2, right: 4, left: -16, bottom: -4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="segment" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        <ChartShell
          icon={PieChartIcon}
          iconClass="bg-rose-50 text-rose-600"
          title="Accidents par gravité"
          subtitle="Classification selon le niveau de gravité"
          empty={gravites.length === 0 ? "Aucune statistique disponible." : ""}
        >
          <div className="h-[165px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={gravites}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={58}
                  innerRadius={24}
                  paddingAngle={2}
                  label
                >
                  {gravites.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>
      </div>

      <ChartShell
        icon={TrendingUp}
        iconClass="bg-emerald-50 text-emerald-600"
        title="Évolution mensuelle des accidents"
        subtitle="Vue d’ensemble sur les derniers mois"
        empty={mois.length === 0 ? "Aucune statistique disponible." : ""}
      >
        <div className="h-[165px] min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={mois} margin={{ top: 2, right: 4, left: -16, bottom: -4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mois" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="accidents" radius={[6, 6, 0, 0]} fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartShell>

      <section className="rounded-3xl border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Lecture rapide</h2>
            <p className="text-[10px] text-slate-500">Résumé analytique des données HSEE</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-2.5">
            <p className="text-xs font-medium text-slate-700">Zone prioritaire</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{segmentCritique}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-2.5">
            <p className="text-xs font-medium text-slate-700">Gravité dominante</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{graviteDominante}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-2.5">
            <p className="text-xs font-medium text-slate-700">Jours perdus</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{kpis.jours_perdus}</p>
          </div>
        </div>
      </section>
    </div>
  );
}


