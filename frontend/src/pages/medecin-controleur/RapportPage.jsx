import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Download,
  FileText,
  Search,
  ShieldAlert,
  TrendingUp,
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
import { jsPDF } from "jspdf";

import { api } from "../../api/api";
import { getUsername } from "../../auth/auth";

const emptyReportData = {
  summary: {
    total_dossiers: 0,
    taux_validation: 0,
    total_controles: 0,
    total_expertises: 0,
  },
  dossiers_par_type: [
    { name: "Contrôle médical", value: 0 },
    { name: "Demande d'expertise", value: 0 },
  ],
  repartition_par_statut: [
    { name: "En attente", value: 0, color: "#F59E0B" },
    { name: "Validés", value: 0, color: "#2563EB" },
    { name: "Refusés", value: 0, color: "#E11D48" },
  ],
  accidents_par_gravite: [
    { name: "Faible", value: 0 },
    { name: "Moyenne", value: 0 },
    { name: "Grave", value: 0 },
    { name: "Critique", value: 0 },
  ],
};

function normalizeReportData(payload) {
  const parStatut = payload?.par_statut || {};
  const parType = payload?.par_type || {};
  const parGravite = payload?.par_gravite || {};

  return {
    summary: {
      total_dossiers: payload?.total_dossiers ?? payload?.summary?.total_dossiers ?? 0,
      taux_validation: payload?.taux_validation ?? payload?.summary?.taux_validation ?? 0,
      total_controles: payload?.total_controles ?? payload?.summary?.total_controles ?? 0,
      total_expertises: payload?.total_expertises ?? payload?.summary?.total_expertises ?? 0,
    },
    dossiers_par_type:
      payload?.dossiers_par_type || [
        { name: "Contrôle médical", value: parType["Contrôle médical"] ?? 0 },
        { name: "Demande d'expertise", value: parType["Demande d'expertise"] ?? 0 },
      ],
    repartition_par_statut:
      payload?.repartition_par_statut || [
        { name: "En attente", value: parStatut["En attente"] ?? 0, color: "#F59E0B" },
        { name: "Validés", value: parStatut["Validés"] ?? 0, color: "#2563EB" },
        { name: "Refusés", value: parStatut["Refusés"] ?? 0, color: "#E11D48" },
      ],
    accidents_par_gravite:
      payload?.accidents_par_gravite || [
        { name: "Faible", value: parGravite["Faible"] ?? 0 },
        { name: "Moyenne", value: parGravite["Moyenne"] ?? 0 },
        { name: "Grave", value: parGravite["Grave"] ?? 0 },
        { name: "Critique", value: parGravite["Critique"] ?? 0 },
      ],
  };
}

function SummaryCard({ title, value, detail }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 text-center shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-4 text-[38px] font-semibold tracking-tight text-sky-800">{value}</p>
      <p className="mt-3 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, icon, children }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function exportReportPdf(username, reportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const summaryStats = [
    {
      title: "Total dossiers",
      value: reportData.summary.total_dossiers,
      detail: "Historique cumulé des contrôles et expertises",
    },
    {
      title: "Taux de validation",
      value: `${reportData.summary.taux_validation}%`,
      detail: "Dossiers validés sur l'ensemble des enregistrements",
    },
    {
      title: "Total contrôles",
      value: reportData.summary.total_controles,
      detail: "Contrôles médicaux enregistrés",
    },
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Rapports & Statistiques", 20, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Analyse de l'activite medicale", 20, 30);
  doc.text(`Utilisateur : ${username || "Médecin contrôleur"}`, 20, 38);

  doc.setFont("helvetica", "bold");
  doc.text("Indicateurs", 20, 52);
  doc.setFont("helvetica", "normal");
  summaryStats.forEach((item, index) => {
    const y = 62 + index * 10;
    doc.text(`${item.title} : ${item.value} (${item.detail})`, 20, y);
  });

  doc.setFont("helvetica", "bold");
  doc.text("Dossiers par type", 20, 98);
  doc.setFont("helvetica", "normal");
  reportData.dossiers_par_type.forEach((item, index) => {
    doc.text(`- ${item.name} : ${item.value}`, 24, 108 + index * 8);
  });

  doc.setFont("helvetica", "bold");
  doc.text("Répartition par statut", 20, 142);
  doc.setFont("helvetica", "normal");
  reportData.repartition_par_statut.forEach((item, index) => {
    doc.text(`- ${item.name} : ${item.value}`, 24, 152 + index * 8);
  });

  doc.setFont("helvetica", "bold");
  doc.text("Accidents par gravité", 20, 186);
  doc.setFont("helvetica", "normal");
  reportData.accidents_par_gravite.forEach((item, index) => {
    doc.text(`- ${item.name} : ${item.value}`, 24, 196 + index * 8);
  });

  doc.save("rapport_statistiques_medicales.pdf");
}

export default function RapportPage() {
  const username = getUsername();
  const [reportData, setReportData] = useState(emptyReportData);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadReport = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await api.get("/statistiques/");

        if (isMounted) {
          setReportData(normalizeReportData(response.data));
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage("Impossible de charger les statistiques.");
          setReportData(emptyReportData);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, []);

  const initials = useMemo(() => {
    const parts = (username || "Médecin Contrôleur")
      .split(/[.\s_-]+/)
      .filter(Boolean)
      .slice(0, 2);

    return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "MC";
  }, [username]);

  const summaryStats = useMemo(
    () => [
      {
        title: "Total dossiers",
        value: reportData.summary.total_dossiers,
        detail: "Historique cumulé des contrôles et expertises",
      },
      {
        title: "Taux de validation",
        value: `${reportData.summary.taux_validation}%`,
        detail: "Calculé sur les enregistrements sauvegardés",
      },
      {
        title: "Total contrôles",
        value: reportData.summary.total_controles,
        detail: `${reportData.summary.total_expertises} demande(s) d'expertise en historique`,
      },
    ],
    [reportData]
  );

  const statutTotal = useMemo(
    () => reportData.repartition_par_statut.reduce((sum, item) => sum + item.value, 0),
    [reportData]
  );

  const statusLegend = useMemo(
    () =>
      reportData.repartition_par_statut.map((item) => ({
        ...item,
        percentage: statutTotal ? Math.round((item.value / statutTotal) * 100) : 0,
      })),
    [reportData, statutTotal]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-sky-50/35 to-white p-5 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[30px] font-semibold tracking-tight text-slate-900">
              Rapports & Statistiques
            </h1>
            <p className="mt-2 text-sm text-slate-500">Analyse de l'activite médicale</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:w-[360px]">
            <label className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm shadow-slate-200/40 transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
              <Search size={16} className="text-sky-500" />
              <input
                type="text"
                placeholder="Rechercher un rapport..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm shadow-slate-200/40">
              <button
                type="button"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100"
                title="Notifications"
              >
                <Bell size={16} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              </button>

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-xs font-semibold text-white shadow-sm shadow-sky-900/25">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {username || "Médecin contrôleur"}
                  </p>
                  <p className="text-xs text-slate-500">Médecin contrôleur</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {summaryStats.map((item) => (
          <SummaryCard key={item.title} {...item} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <ChartCard
          title="Dossiers par type"
          subtitle="Répartition des dossiers médicaux enregistrés"
          icon={<FileText size={20} />}
        >
          <div className="h-[320px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={220}
              style={{ minWidth: 0, minHeight: 220 }}
            >
              <BarChart data={reportData.dossiers_par_type} barCategoryGap={28}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: "#F8FAFC" }} />
                <Bar dataKey="value" fill="#2563EB" radius={[10, 10, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Répartition par statut"
          subtitle="Vue globale des formulaires sauvegardés"
          icon={<TrendingUp size={20} />}
        >
          <div className="flex h-[320px] flex-col items-center justify-center gap-4 lg:flex-row">
            <div className="h-[220px] w-full max-w-[240px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={220}
                style={{ minWidth: 0, minHeight: 220 }}
              >
                <PieChart>
                  <Pie
                    data={statusLegend}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                  >
                    {statusLegend.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {statusLegend.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-8 rounded-2xl border border-sky-100 bg-sky-50/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {item.value} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </section>

      <ChartCard
        title="Accidents par gravité"
        subtitle="Distribution calculée à partir de l'historique enregistré"
        icon={<ShieldAlert size={20} />}
      >
        <div className="h-[320px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={220}
            style={{ minWidth: 0, minHeight: 220 }}
          >
            <BarChart data={reportData.accidents_par_gravite} barCategoryGap={34}>
              <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#64748B", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: "#F8FAFC" }} />
              <Bar dataKey="value" fill="#0F172A" radius={[10, 10, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {isLoading ? "Chargement des statistiques..." : "Statistiques issues de l'historique sauvegardé."}
        </p>

        <button
          type="button"
          onClick={() => exportReportPdf(username, reportData)}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm shadow-sky-900/25 transition hover:bg-slate-800"
        >
          <Download size={16} />
          Exporter en PDF
        </button>
      </div>
    </div>
  );
}
