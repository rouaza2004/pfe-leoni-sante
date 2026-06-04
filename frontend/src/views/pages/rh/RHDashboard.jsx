import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  FileText,
  ShieldCheck,
  Upload,
  UserPlus,
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
    soft: "border-sky-100 bg-sky-50/50",
  },
  success: {
    icon: "border-emerald-200 bg-emerald-50 text-emerald-700",
    value: "text-emerald-700",
    soft: "border-emerald-100 bg-emerald-50/50",
  },
  warning: {
    icon: "border-amber-200 bg-amber-50 text-amber-700",
    value: "text-amber-700",
    soft: "border-amber-100 bg-amber-50/50",
  },
  danger: {
    icon: "border-rose-200 bg-rose-50 text-rose-700",
    value: "text-rose-700",
    soft: "border-rose-100 bg-rose-50/50",
  },
  secondary: {
    icon: "border-violet-200 bg-violet-50 text-violet-700",
    value: "text-violet-700",
    soft: "border-violet-100 bg-violet-50/50",
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
  if (["validated", "termine", "réalisé", "realise", "success"].includes(normalized)) return "success";
  if (["pending", "prevu", "prévu", "reporte", "reporté", "warning"].includes(normalized)) return "warning";
  if (["danger", "annule", "annulé"].includes(normalized)) return "danger";
  if (["sent_to_infirmary", "info"].includes(normalized)) return "info";
  return "secondary";
}

function SummaryCard({ title, value, detail, icon, tone = "info", onClick }) {
  const toneClass = accentClasses[tone] || accentClasses.info;
  const interactiveProps = onClick
    ? {
        role: "button",
        tabIndex: 0,
        onClick,
        onKeyDown: (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition hover:shadow-md ${
        onClick ? "cursor-pointer" : ""
      }`}
      {...interactiveProps}
    >
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
        if (!cancelled) setDashboardData(response?.data || {});
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
  const newOperators = toArray(dashboardData?.new_operators);
  const rhAvailableDocuments = toArray(dashboardData?.rh_available_documents);
  const upcomingControllerAppointments = toArray(dashboardData?.upcoming_controller_appointments);

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
        title: "Nouveaux opérateurs",
        value: toNumber(kpis.new_operators_this_month),
        detail: "Opérateurs importés ce mois-ci",
        icon: <Upload size={16} />,
        tone: "success",
        onClick: () => navigate("/rh/nouveaux-operateurs"),
      },
      {
        title: "Fiches d'aptitude",
        value: toNumber(kpis.aptitude_forms),
        detail: "Présentes dans les documents RH affichés",
        icon: <ShieldCheck size={16} />,
        tone: "secondary",
        onClick: () => navigate("/rh/documents-medecine-travail?document_type=fiche_aptitude"),
      },
      {
        title: "Certificats médecin du travail",
        value: toNumber(kpis.work_doctor_certificates),
        detail: "Présents dans les documents RH affichés",
        icon: <FileText size={16} />,
        tone: "info",
        onClick: () => navigate("/rh/documents-medecine-travail?document_type=certificat_medical"),
      },
      {
        title: "RDV médecin contrôleur",
        value: toNumber(kpis.upcoming_controller_appointments),
        detail: "Rendez-vous contrôleur planifiés à venir",
        icon: <CalendarDays size={16} />,
        tone: "warning",
        onClick: () => navigate("/rh/rdv-medecin-controleur"),
      },
      {
        title: "Certificats médecin contrôleur",
        value: toNumber(kpis.controller_certificates),
        detail: "Présents dans les documents RH affichés",
        icon: <FileText size={16} />,
        tone: "info",
        onClick: () => navigate("/rh/certificats-medecin-controleur"),
      },
      {
        title: "Visites d'embauche à planifier",
        value: toNumber(kpis.hiring_visits_to_schedule),
        detail: "Nouveaux opérateurs sans rendez-vous",
        icon: <UserPlus size={16} />,
        tone: "danger",
        onClick: () => navigate("/rh/nouveaux-operateurs?filter=to-plan"),
      },
    ],
    [
      kpis.aptitude_forms,
      kpis.controller_certificates,
      kpis.hiring_visits_to_schedule,
      kpis.work_doctor_certificates,
      navigate,
      kpis.new_operators_this_month,
      kpis.upcoming_controller_appointments,
    ]
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
                Suivi RH des nouveaux opérateurs, fiches d'aptitude, certificats médicaux et rendez-vous contrôleur.
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

      <div className="grid gap-1.5 xl:grid-cols-[1.05fr_0.95fr]">
        <PanelCard
          id="rh-new-operators"
          title="Nouveaux opérateurs à suivre"
          subtitle="Les 10 derniers opérateurs devant effectuer la visite d'embauche"
          action="Voir tout"
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
            {recentNewOperators.length === 0 ? (
              <EmptyState text={loading ? "Chargement des opérateurs..." : "Aucun nouvel opérateur à suivre."} />
            ) : null}
          </div>
        </PanelCard>

        <PanelCard
          id="rh-controller-rdv"
          title="Rendez-vous médecin contrôleur à venir"
          subtitle="Les 5 prochains rendez-vous contrôleur planifiés"
          action="Ouvrir"
          onAction={() => navigate("/rh/rdv-medecin-controleur")}
        >
          <div className="space-y-1">
            {upcomingControllerAppointments.slice(0, 5).map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-amber-100 bg-amber-50/45 p-2">
                <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">
                      {appointment.collaborateur_nom || "Collaborateur non renseigné"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{appointment.matricule || "N/A"}</p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-600">
                      {formatDateLabel(appointment.date)} - {formatTimeLabel(appointment.heure)}
                    </p>
                  </div>
                  <StatusBadge label={appointment.statut_label} tone={getStatusTone(appointment.statut)} />
                </div>
              </div>
            ))}
            {upcomingControllerAppointments.length === 0 ? (
              <EmptyState text={loading ? "Chargement des rendez-vous..." : "Aucun rendez-vous médecin contrôleur à venir."} />
            ) : null}
          </div>
        </PanelCard>
      </div>

      <PanelCard
        id="rh-documents"
        title="Documents RH disponibles"
        subtitle="Les 5 derniers documents requis par le périmètre RH"
        action="Fiches"
        onAction={() => navigate("/rh/documents-medecine-travail")}
      >
        <div className="space-y-1">
          {rhAvailableDocuments.slice(0, 5).map((doc) => (
            <div key={doc.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2">
              <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[13px] font-medium text-slate-900">
                    {doc.collaborateur_nom || "Collaborateur non renseigné"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {doc.matricule || "N/A"} - {doc.type_document || "Document RH"}
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-600">
                    {formatDateLabel(doc.date_creation)} - {doc.source || "--"}
                  </p>
                </div>
                <StatusBadge label={doc.source || "Document"} tone={doc.source?.includes("contrôleur") ? "info" : "secondary"} />
              </div>
            </div>
          ))}
          {rhAvailableDocuments.length === 0 ? (
            <EmptyState text={loading ? "Chargement des documents..." : "Aucun document RH disponible."} />
          ) : null}
        </div>
      </PanelCard>
    </div>
  );
}
