import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlarmClock,
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  FolderClock,
  RotateCcw,
  Stethoscope,
  Upload,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";

import { api } from "@/api/api";
import { getUsername } from "@/auth/auth";

const statusClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  secondary: "border-violet-200 bg-violet-50 text-violet-700",
};

const accentClasses = {
  info: {
    icon: "border-sky-200 bg-sky-50 text-sky-700",
    value: "text-sky-700",
    pill: "bg-sky-50 text-sky-700 ring-sky-200",
    soft: "border-sky-100 bg-sky-50/50",
    bar: "bg-sky-500",
  },
  success: {
    icon: "border-emerald-200 bg-emerald-50 text-emerald-700",
    value: "text-emerald-700",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    soft: "border-emerald-100 bg-emerald-50/50",
    bar: "bg-emerald-500",
  },
  warning: {
    icon: "border-amber-200 bg-amber-50 text-amber-700",
    value: "text-amber-700",
    pill: "bg-amber-50 text-amber-700 ring-amber-200",
    soft: "border-amber-100 bg-amber-50/50",
    bar: "bg-amber-400",
  },
  danger: {
    icon: "border-rose-200 bg-rose-50 text-rose-700",
    value: "text-rose-700",
    pill: "bg-rose-50 text-rose-700 ring-rose-200",
    soft: "border-rose-100 bg-rose-50/50",
    bar: "bg-rose-400",
  },
  secondary: {
    icon: "border-violet-200 bg-violet-50 text-violet-700",
    value: "text-violet-700",
    pill: "bg-violet-50 text-violet-700 ring-violet-200",
    soft: "border-violet-100 bg-violet-50/50",
    bar: "bg-violet-500",
  },
};

function formatDateLabel(dateValue) {
  if (!dateValue) return "--";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTimeLabel(timeValue) {
  if (!timeValue) return "--:--";
  return String(timeValue).slice(0, 5);
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getDateTime(value) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getStatusTone(status) {
  const normalized = String(status || "").toLowerCase();
  if (["validated", "termine", "réalisé", "realise", "active", "success"].includes(normalized)) return "success";
  if (["pending", "prevu", "prévu", "reporte", "reporté", "warning"].includes(normalized)) return "warning";
  if (["overdue", "danger", "annule", "annulé"].includes(normalized)) return "danger";
  if (["sent_to_infirmary", "scheduled", "info"].includes(normalized)) return "info";
  return "secondary";
}

function SummaryCard({ title, value, detail, icon, tone = "info" }) {
  const toneClass = accentClasses[tone] || accentClasses.info;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{title}</p>
          <p className={`mt-1 text-[22px] font-bold leading-none ${toneClass.value}`}>
            {value}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${toneClass.icon}`}>
          {icon}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ label, tone = "info" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        statusClasses[tone] || statusClasses.info
      }`}
    >
      {label || "--"}
    </span>
  );
}

function PanelCard({ id, title, subtitle, action, onAction, children }) {
  return (
    <section
      id={id}
      className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm ring-1 ring-slate-200"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-[10px] text-slate-500">{subtitle}</p>
        </div>
        {action ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 transition hover:text-slate-900"
          >
            {action}
            <ChevronRight size={12} />
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-4 text-xs text-slate-600">
      {text}
    </div>
  );
}

function CompactBarChart({ rows, labelKey, valueKey, emptyText, tone = "info" }) {
  const data = toArray(rows);
  const maxValue = Math.max(...data.map((item) => toNumber(item?.[valueKey])), 0);
  const toneClass = accentClasses[tone] || accentClasses.info;

  if (data.length === 0 || maxValue === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="space-y-1.5">
      {data.slice(0, 8).map((item) => {
        const label = item?.[labelKey] || "Non défini";
        const value = toNumber(item?.[valueKey]);
        const width = `${Math.max((value / maxValue) * 100, 6)}%`;

        return (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate font-medium text-slate-700">{label}</span>
              <span className="font-semibold text-slate-900">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-100">
              <div className={`h-full rounded-full ${toneClass.bar}`} style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AbsenceDelayChart({ rows }) {
  const data = toArray(rows);
  const maxValue = Math.max(
    ...data.flatMap((item) => [toNumber(item?.absences), toNumber(item?.retards), toNumber(item?.retours)]),
    0
  );

  if (data.length === 0 || maxValue === 0) {
    return <EmptyState text="Aucune absence ou retour attendu à afficher." />;
  }

  const series = [
    { key: "absences", label: "Absences", color: "bg-rose-400" },
    { key: "retards", label: "Retards", color: "bg-sky-500" },
    { key: "retours", label: "Retours", color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-[10px]">
        {series.map((item) => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600"
          >
            <span className={`h-2 w-2 rounded-full ${item.color}`} />
            {item.label}
          </span>
        ))}
      </div>

      <div className="grid gap-1.5">
        {data.slice(0, 6).map((department) => (
          <div key={department.department || "Non défini"} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
            <p className="mb-1 text-[11px] font-medium text-slate-700">
              {department.department || "Non défini"}
            </p>
            <div className="grid gap-1">
              {series.map((serie) => {
                const value = toNumber(department?.[serie.key]);
                const width = `${Math.max((value / maxValue) * 100, value ? 6 : 0)}%`;
                return (
                  <div key={serie.key} className="grid grid-cols-[64px_minmax(0,1fr)_28px] items-center gap-2 text-[10px] text-slate-500">
                    <span>{serie.label}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-100">
                      <div className={`h-full rounded-full ${serie.color}`} style={{ width }} />
                    </div>
                    <span className="text-right font-semibold text-slate-700">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RHDashboard() {
  const navigate = useNavigate();
  const username = getUsername();
  const sessionIdentifier = username || "responsable-rh";
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/rh/kpi/");
        if (!cancelled) {
          setDashboardData(response?.data || {});
        }
      } catch (err) {
        if (!cancelled) {
          setError("Impossible de charger les indicateurs RH.");
          setDashboardData(null);
        }
        console.error("Erreur chargement dashboard RH", {
          endpoint: "/api/rh/kpi/",
          message: err?.message,
          status: err?.response?.status,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadNotifications = async () => {
      try {
        const response = await api.get("/notifications/");
        if (cancelled) return;

        const payload = Array.isArray(response?.data) ? response.data : [];
        setUnreadNotificationsCount(payload.filter((item) => !item?.is_read).length);
      } catch (err) {
        console.error("Erreur chargement notifications RH", {
          endpoint: "/api/notifications/",
          message: err?.message,
          status: err?.response?.status,
        });
      }
    };

    loadDashboard();
    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = dashboardData?.kpis || {};
  const upcomingVisits = toArray(dashboardData?.upcoming_visits);
  const overdueVisits = toArray(dashboardData?.overdue_visits);
  const newOperators = toArray(dashboardData?.new_operators);
  const activeSickLeaves = toArray(dashboardData?.active_sick_leaves);
  const returnsThisWeek = toArray(dashboardData?.returns_this_week);
  const recentNewOperators = useMemo(
    () =>
      [...newOperators]
        .sort((a, b) => {
          const importDateDiff = getDateTime(b?.date_import) - getDateTime(a?.date_import);
          if (importDateDiff !== 0) return importDateDiff;
          return getDateTime(b?.created_at) - getDateTime(a?.created_at);
        })
        .slice(0, 10),
    [newOperators]
  );

  const summaryCards = useMemo(
    () => [
      {
        title: "Collaborateurs actifs",
        value: toNumber(kpis.total_active_collaborators),
        detail: "Collaborateurs actifs dans la base RH",
        icon: <Users size={16} />,
        tone: "info",
      },
      {
        title: "Nouveaux opérateurs",
        value: toNumber(kpis.new_operators_this_month),
        detail: "Importés ou intégrés ce mois-ci",
        icon: <Upload size={16} />,
        tone: "success",
      },
      {
        title: "Visites à venir",
        value: upcomingVisits.length,
        detail: "Rendez-vous planifiés à partir d'aujourd'hui",
        icon: <CalendarDays size={16} />,
        tone: "info",
      },
      {
        title: "Visites en retard",
        value: overdueVisits.length,
        detail: "Planifiées avant aujourd'hui et non réalisées",
        icon: <AlarmClock size={16} />,
        tone: "danger",
      },
      {
        title: "Repos actifs",
        value: activeSickLeaves.length,
        detail: "Arrêts ou repos médicaux en cours",
        icon: <Stethoscope size={16} />,
        tone: "warning",
      },
      {
        title: "Retours cette semaine",
        value: returnsThisWeek.length,
        detail: "Repos se terminant dans les 7 prochains jours",
        icon: <RotateCcw size={16} />,
        tone: "success",
      },
    ],
    [activeSickLeaves.length, kpis.new_operators_this_month, kpis.total_active_collaborators, overdueVisits.length, returnsThisWeek.length, upcomingVisits.length]
  );

  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    []
  );

  const greeting = useMemo(() => {
    if (currentHour < 12) return "Bonjour";
    if (currentHour < 18) return "Bon après-midi";
    return "Bonsoir";
  }, [currentHour]);

  const rhModules = [
    {
      id: "absences-ponctualite",
      title: "Absences & ponctualité",
      description: "Suivre les absences, congés maladie et indicateurs de ponctualité.",
      icon: <FolderClock size={16} />,
      route: "/rh/absences-ponctualite",
      cta: "Ouvrir",
      tone: "warning",
    },
    {
      id: "nouveaux-operateurs",
      title: "Nouveaux opérateurs",
      description: "Importer les nouveaux entrants et préparer leur suivi médical.",
      icon: <Upload size={16} />,
      route: "/rh/nouveaux-operateurs",
      cta: "Importer",
      tone: "info",
    },
    {
      id: "pointage-medecins",
      title: "Pointage médecins",
      description: "Consulter les présences, absences et pointages des médecins.",
      icon: <Clock3 size={16} />,
      route: "/rh/pointage-medecins",
      cta: "Consulter",
      tone: "success",
    },
    {
      id: "rapports-rh",
      title: "Rapports RH",
      description: "Accéder aux rapports RH liés au suivi des collaborateurs.",
      icon: <UserCheck size={16} />,
      route: "/rh/rapports",
      cta: "Voir les rapports",
      tone: "secondary",
    },
  ];

  return (
    <div className="space-y-1.5">
      <section className="rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
                <CalendarDays size={12} className="text-slate-700" />
                {currentDate}
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Espace RH</p>
              <h1 className="mt-0.5 text-[20px] font-bold tracking-tight text-slate-900">
                {`${greeting}, ${sessionIdentifier}`}
              </h1>
              <p className="mt-0.5 max-w-2xl text-xs text-slate-500">
                Pilotage RH des collaborateurs, visites à planifier, repos médicaux et retours au travail.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/rh")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Bell size={12} />
            <span>Notifications</span>
            <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 py-0 text-[9px] font-semibold text-white">
              {unreadNotificationsCount}
            </span>
          </button>
        </div>

        {error ? (
          <div className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <SummaryCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <PanelCard
        id="rh-modules"
        title="Espaces RH"
        subtitle="Accès direct aux fonctionnalités RH déjà disponibles dans l'application"
      >
        <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
          {rhModules.map((module) => {
            const toneClass = accentClasses[module.tone] || accentClasses.info;
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => navigate(module.route)}
                className="rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-sm shadow-slate-200/30 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${toneClass.icon}`}>
                  {module.icon}
                </div>
                <p className="mt-1.5 text-[12px] font-semibold text-slate-900">{module.title}</p>
                <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{module.description}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-slate-700">
                  {module.cta}
                  <ChevronRight size={12} />
                </div>
              </button>
            );
          })}
        </div>
      </PanelCard>

      <div className="grid gap-1.5 xl:grid-cols-3">
        <PanelCard
          title="Collaborateurs par département"
          subtitle="Répartition des collaborateurs actifs"
        >
          <CompactBarChart
            rows={dashboardData?.collaborateurs_par_departement}
            labelKey="departement"
            valueKey="total"
            emptyText={loading ? "Chargement des départements..." : "Aucun collaborateur actif à afficher."}
            tone="info"
          />
        </PanelCard>

        <PanelCard
          title="Collaborateurs par site"
          subtitle="Répartition des collaborateurs actifs"
        >
          <CompactBarChart
            rows={dashboardData?.collaborateurs_par_site}
            labelKey="site"
            valueKey="total"
            emptyText={loading ? "Chargement des sites..." : "Aucun site à afficher."}
            tone="success"
          />
        </PanelCard>

        <PanelCard
          title="Absences et retours"
          subtitle="Repos médicaux et retours attendus par département"
        >
          <AbsenceDelayChart rows={dashboardData?.absences_retards_par_departement} />
        </PanelCard>
      </div>

      <section
        id="rh-rendez-vous"
        className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm ring-1 ring-slate-200"
      >
        <div className="mb-2 flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Visites et rendez-vous</h2>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Visites à venir et visites planifiées en retard pour les collaborateurs actifs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/rh")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <UserRound size={13} />
            Tableau de bord RH
          </button>
        </div>

        <div className="grid gap-1.5 xl:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-700">À venir</p>
            {upcomingVisits.map((visit) => (
              <article key={visit.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2">
                <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">
                      {visit.collaborateur_nom || "Collaborateur non renseigné"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {visit.matricule || "N/A"} - {visit.type_visite || "Visite médicale"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {formatDateLabel(visit.date)} - {formatTimeLabel(visit.heure)}
                    </p>
                  </div>
                  <StatusBadge label={visit.statut_label} tone={getStatusTone(visit.statut)} />
                </div>
              </article>
            ))}
            {upcomingVisits.length === 0 ? <EmptyState text={loading ? "Chargement des visites..." : "Aucune visite à venir."} /> : null}
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-700">En retard</p>
            {overdueVisits.map((visit) => (
              <article key={visit.id} className="rounded-2xl border border-rose-100 bg-rose-50/45 p-2">
                <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">
                      {visit.collaborateur_nom || "Collaborateur non renseigné"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {visit.matricule || "N/A"} - {visit.type_visite || "Visite médicale"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {formatDateLabel(visit.date)} - {formatTimeLabel(visit.heure)}
                    </p>
                  </div>
                  <StatusBadge label="En retard" tone="danger" />
                </div>
              </article>
            ))}
            {overdueVisits.length === 0 ? <EmptyState text={loading ? "Chargement des visites..." : "Aucune visite en retard."} /> : null}
          </div>
        </div>
      </section>

      <div className="grid gap-1.5 xl:grid-cols-[1.05fr_0.95fr]">
        <PanelCard
          id="rh-new-operators"
          title="Nouveaux opérateurs à suivre"
          subtitle="Collaborateurs actifs créés ou importés pendant le mois courant"
          action="Ouvrir"
          onAction={() => navigate("/rh/nouveaux-operateurs")}
        >
          <div className="space-y-1">
            {recentNewOperators.map((item) => (
              <div key={item.id} className={`rounded-2xl border p-2 ${(accentClasses[item.tone] || accentClasses.info).soft}`}>
                <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{item.collaborateur_nom || "--"}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {item.matricule || "N/A"} - {item.departement || "Non défini"}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-600">
                      {item.poste || "Non défini"} - Import: {formatDateLabel(item.date_import)}
                    </p>
                  </div>
                  <StatusBadge label={item.statut_label} tone={item.tone || getStatusTone(item.statut)} />
                </div>
              </div>
            ))}
            {recentNewOperators.length === 0 ? <EmptyState text={loading ? "Chargement des opérateurs..." : "Aucun nouvel opérateur ce mois-ci."} /> : null}
            {newOperators.length > 0 ? (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => navigate("/rh/nouveaux-operateurs")}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 transition hover:text-slate-900"
                >
                  Voir tout
                  <ChevronRight size={12} />
                </button>
              </div>
            ) : null}
          </div>
        </PanelCard>

        <PanelCard
          id="rh-sick-leaves"
          title="Arrêts et repos actifs"
          subtitle="Repos médicaux en cours et retours attendus cette semaine"
          action="Absences"
          onAction={() => navigate("/rh/absences-ponctualite")}
        >
          <div className="space-y-1">
            {activeSickLeaves.map((item) => (
              <div key={item.id} className="rounded-2xl border border-amber-100 bg-amber-50/45 p-2">
                <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{item.collaborateur_nom || "--"}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{item.matricule || "N/A"}</p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-600">
                      {formatDateLabel(item.date_debut)} - {formatDateLabel(item.date_fin_prevue)}
                    </p>
                  </div>
                  <StatusBadge label={item.statut_label || "En cours"} tone="warning" />
                </div>
              </div>
            ))}
            {activeSickLeaves.length === 0 ? <EmptyState text={loading ? "Chargement des repos..." : "Aucun arrêt ou repos actif."} /> : null}
          </div>
        </PanelCard>
      </div>

      <PanelCard
        title="Modules RH"
        subtitle="Accès direct aux fonctionnalités RH déjà disponibles dans l'application"
      >
        <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
          {rhModules.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => navigate(card.route)}
              className="rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-sm shadow-slate-200/30 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${(accentClasses[card.tone] || accentClasses.info).icon}`}>
                {card.icon}
              </div>
              <p className="mt-1.5 text-[12px] font-semibold text-slate-900">{card.title}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{card.description}</p>
            </button>
          ))}
        </div>
      </PanelCard>

    </div>
  );
}
