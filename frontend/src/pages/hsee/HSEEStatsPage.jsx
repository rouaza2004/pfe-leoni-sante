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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

export default function HSEEStatsPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [kpis, setKpis] = useState(null);
  const [segments, setSegments] = useState([]);
  const [gravites, setGravites] = useState([]);
  const [mois, setMois] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setErr("");

        const [kpisRes, segmentsRes, gravitesRes, moisRes] = await Promise.all([
          api.get("/medical/hsee/kpis/"),
          api.get("/medical/hsee/accidents-par-segment/"),
          api.get("/medical/hsee/accidents-par-gravite/"),
          api.get("/medical/hsee/accidents-par-mois/"),
        ]);

        if (cancelled) return;

        setKpis(kpisRes.data || {});
        setSegments(Array.isArray(segmentsRes.data) ? segmentsRes.data : []);
        setGravites(Array.isArray(gravitesRes.data) ? gravitesRes.data : []);
        setMois(Array.isArray(moisRes.data) ? moisRes.data : []);
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

  const segmentCritique = useMemo(() => {
    if (!segments.length) return "—";
    return [...segments].sort((a, b) => b.value - a.value)[0]?.segment || "—";
  }, [segments]);

  const graviteDominante = useMemo(() => {
    if (!gravites.length) return "—";
    return [...gravites].sort((a, b) => b.value - a.value)[0]?.name || "—";
  }, [gravites]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
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
    <div className="bg-slate-50">
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Statistiques HSEE</h1>
        <p className="mt-2 text-sm text-slate-500">
          Analyse des accidents par segment, par gravité et par évolution mensuelle.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Total accidents"
          value={kpis?.accidents_declares ?? 0}
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Accidents par segment
              </h2>
              <p className="text-sm text-slate-500">
                Répartition selon les zones de travail
              </p>
            </div>
          </div>

          <div className="h-80 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <BarChart data={segments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {segments.length === 0 && (
            <div className="pt-4 text-sm text-slate-500">
              Aucune statistique par segment disponible.
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
              <PieChartIcon className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Accidents par gravité
              </h2>
              <p className="text-sm text-slate-500">
                Classification selon le niveau de gravité
              </p>
            </div>
          </div>

          <div className="h-80 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <PieChart>
                <Pie
                  data={gravites}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {gravites.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {gravites.length === 0 && (
            <div className="pt-4 text-sm text-slate-500">
              Aucune statistique par gravité disponible.
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Évolution mensuelle des accidents
            </h2>
            <p className="text-sm text-slate-500">
              Vue d’ensemble sur les derniers mois
            </p>
          </div>
        </div>

        <div className="h-80 min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <BarChart data={mois}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="accidents" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {mois.length === 0 && (
          <div className="pt-4 text-sm text-slate-500">
            Aucune évolution mensuelle disponible.
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Lecture rapide</h2>
            <p className="text-sm text-slate-500">
              Résumé analytique des données HSEE
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Zone prioritaire</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{segmentCritique}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Gravité dominante</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{graviteDominante}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Jours perdus</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {kpis?.jours_perdus ?? 0}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
