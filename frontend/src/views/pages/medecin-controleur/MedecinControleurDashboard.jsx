import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  CalendarClock,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileSearch,
  ShieldAlert,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";

<<<<<<< HEAD:frontend/src/pages/medecin-controleur/MedecinControleurDashboard.jsx
import { api } from "@/api/api";
import { fixFrenchTextDeep } from "@/utils/fixFrenchText";
import { getUsername } from "../../auth/auth";
=======
import { getUsername } from "@/auth/auth";
>>>>>>> d04145d7f94a17b48901f3e9ce1e1fd12813b923:frontend/src/views/pages/medecin-controleur/MedecinControleurDashboard.jsx

const appointmentTemplates = [
  {
    time: "08:30",
    type: "Contrôle arrêt maladie",
    context: "Visite à domicile ”¢ Quartier industriel",
    status: "Terminé",
    statusTone: "success",
  },
  {
    time: "10:15",
    type: "Reprise travail",
    context: "Validation après 21 jours d'arrêt",
    status: "En cours",
    statusTone: "inProgress",
  },
  {
    time: "13:45",
    type: "Accident de travail",
    context: "Contrôle suite à accident avec arrêt",
    status: "En attente",
    statusTone: "warning",
  },
  {
    time: "15:30",
    type: "Contrôle périodique",
    context: "Suivi d'un dossier récurrent",
    status: "Suivant",
    statusTone: "info",
  },
];

const upcomingPatients = [
  {
    name: "Nadia Chatti",
    time: "16:10",
    type: "Demande d'expertise",
    note: "Avis externe demandé par RH",
    tone: "secondary",
  },
  {
    name: "Hatem Gharbi",
    time: "Demain ”¢ 09:00",
    type: "Reprise travail",
    note: "Contrôle post-hospitalisation",
    tone: "warning",
  },
  {
    name: "Rim Mzoughi",
    time: "Demain ”¢ 11:30",
    type: "Arrêt maladie",
    note: "Vérification de prolongation",
    tone: "info",
  },
];

const alerts = [
  {
    title: "Accident de travail à prioriser",
    detail: "Dossier LEO-0882 en attente de constat complémentaire avant 14:30.",
  },
  {
    title: "Expertise externe à confirmer",
    detail: "Centre d'expertise non renseigné pour Nadia Chatti.",
  },
  {
    title: "Contrôle périodique en retard",
    detail: "Deux suivis trimestriels dépassent la date cible.",
  },
];

const quickStats = [
  { label: "Taux de réalisation", value: "75%", tone: "info" },
  { label: "Décisions de reprise", value: "05", tone: "success" },
  { label: "Arrêts confirmés", value: "02", tone: "warning" },
  { label: "Expertises externes", value: "01", tone: "secondary" },
];

const topOverviewCards = [
  {
    title: "Visites aujourd'hui",
    value: "04",
    icon: <CalendarDays size={16} />,
    tone: "info",
  },
  {
    title: "Visites en retard",
    value: "01",
    icon: <ShieldAlert size={16} />,
    tone: "danger",
  },
  {
    title: "Conformité",
    value: "92%",
    icon: <FileCheck2 size={16} />,
    tone: "success",
  },
  {
    title: "Collaborateurs suivis",
    value: "18",
    icon: <Users size={16} />,
    tone: "info",
  },
];

const notificationsSeed = [
  {
    id: "ctrl-1",
    type: "rendez-vous",
    title: "Nouveau rendez-vous de contrôle médical ajouté",
    description: "Un contrôle supplémentaire a été intégré au planning du jour.",
    relativeTime: "Il y a 5 min",
  },
  {
    id: "ctrl-2",
    type: "expertise",
    title: "Demande d'expertise reçue",
    description: "Un nouveau dossier prioritaire attend votre validation.",
    relativeTime: "Il y a 18 min",
  },
  {
    id: "ctrl-3",
    type: "rendez-vous",
    title: "Rendez-vous imminent aujourd'hui",
    description: "Un collaborateur est attendu dans moins de 30 minutes.",
    relativeTime: "Il y a 42 min",
  },
  {
    id: "ctrl-4",
    type: "dossier",
    title: "Dossier collaborateur mis à jour",
    description: "Des informations complémentaires ont été ajoutées au dossier.",
    relativeTime: "Il y a 1 h",
  },
  {
    id: "ctrl-5",
    type: "controle",
    title: "Contrôle médical terminé",
    description: "Le dernier contrôle a été clôturé avec décision enregistrée.",
    relativeTime: "Il y a 2 h",
  },
];

const statusClasses = {
  inProgress: "border-slate-300 bg-slate-900 text-white",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

const accentClasses = {
  info: {
    icon: "bg-sky-50 text-sky-700",
    value: "text-sky-700",
    pill: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  success: {
    icon: "bg-emerald-50 text-emerald-700",
    value: "text-emerald-700",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  warning: {
    icon: "bg-amber-50 text-amber-700",
    value: "text-amber-700",
    pill: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  danger: {
    icon: "bg-rose-50 text-rose-700",
    value: "text-rose-700",
    pill: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  secondary: {
    icon: "bg-violet-50 text-violet-700",
    value: "text-violet-700",
    pill: "bg-violet-50 text-violet-700 ring-violet-200",
  },
};

const notificationTypeConfig = {
  "rendez-vous": {
    icon: CalendarClock,
    className: "bg-blue-50 text-blue-600",
  },
  expertise: {
    icon: FileSearch,
    className: "bg-violet-50 text-violet-700",
  },
  dossier: {
    icon: UserRound,
    className: "bg-slate-100 text-slate-700",
  },
  controle: {
    icon: Stethoscope,
    className: "bg-emerald-50 text-emerald-700",
  },
};

function normalizeCollaborateurList(payload) {
  return fixFrenchTextDeep(Array.isArray(payload) ? payload : payload?.results || []);
}

function buildAppointmentFromCollaborateur(collaborateur, index) {
  const template = appointmentTemplates[index % appointmentTemplates.length];
  const name = `${collaborateur.prenom || ""} ${collaborateur.nom || ""}`.trim() || "--";

  return {
    ...template,
    id: `collaborateur-${collaborateur.id}`,
    collaborateurId: collaborateur.id,
    name,
    matricule: collaborateur.matricule || "--",
  };
}

function getAppointmentCollaborateurId(appointment) {
  const candidate =
    appointment?.collaborateur?.id ??
    appointment?.collaborateur_id ??
    appointment?.collaborateurId ??
    appointment?.employe?.id ??
    appointment?.employe_id ??
    appointment?.employeId ??
    appointment?.collaborateur ??
    null;

  return ["number", "string"].includes(typeof candidate) ? candidate : null;
}

function SummaryCard({ title, value, detail, icon, tone = "info" }) {
  const toneClass = accentClasses[tone] || accentClasses.info;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{title}</p>
          <p className={`mt-1 text-[22px] font-bold leading-none ${toneClass.value}`}>{value}</p>
          <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${toneClass.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ label, tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function SectionShell({ title, subtitle, children, action, className = "" }) {
  return (
    <section className={`rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200 ${className}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[10px] text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function MedecinControleurDashboard() {
  const navigate = useNavigate();
  const username = getUsername();
  const sessionIdentifier = username || "medecin-controleur";
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const notificationRef = useRef(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchCollaborateurs = async () => {
      try {
        setAppointmentsLoading(true);
        setAppointmentsError("");
        const response = await api.get("/collaborateurs/");
        if (cancelled) return;
        setCollaborateurs(normalizeCollaborateurList(response.data));
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setCollaborateurs([]);
          setAppointmentsError("Impossible de charger les collaborateurs.");
        }
      } finally {
        if (!cancelled) {
          setAppointmentsLoading(false);
        }
      }
    };

    fetchCollaborateurs();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const capacityTotal = 20;
  const capacityCompleted = 0;
  const capacityRemaining = 1;
  const capacityCurrent = capacityCompleted + capacityRemaining;
  const progressWidth = `${(capacityCurrent / capacityTotal) * 100}%`;
  const appointments = useMemo(
    () =>
      collaborateurs
        .filter((collaborateur) => collaborateur?.id)
        .slice(0, appointmentTemplates.length)
        .map(buildAppointmentFromCollaborateur),
    [collaborateurs]
  );
  const activeConsultation =
    appointments.find((appointment) => appointment.statusTone === "inProgress")?.name || "--";
  const unreadNotificationsCount = notificationsSeed.length;

  const handleOpenDossier = (appointment) => {
    const params = new URLSearchParams({ tab: "dossier" });
    const collaborateurId = getAppointmentCollaborateurId(appointment);

    if (collaborateurId) {
      params.set("collaborateurId", String(collaborateurId));
    }

    if (appointment.matricule) {
      params.set("matricule", appointment.matricule);
    }

    if (appointment.name) {
      params.set("search", appointment.name);
    }

    navigate(`/medecin-controleur/recherche?${params.toString()}`);
  };

  return (
    <div className="space-y-2">
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
              <p className="text-xs font-medium text-slate-500">Espace Médecin contrôleur</p>
              <h1 className="mt-0.5 text-[20px] font-bold tracking-tight text-slate-900">
                {`${greeting}, ${sessionIdentifier}`}
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Suivi des contrôles médicaux, reprises travail, arrêts maladie et expertises.
              </p>
            </div>
          </div>

          <div className="relative shrink-0 self-start" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <Bell size={12} />
                <span>Notifications</span>
                <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 py-0 text-[9px] font-semibold text-white">
                  {unreadNotificationsCount}
                </span>
              </button>

              {notificationsOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[320px] max-w-[85vw] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="mb-1 flex items-center justify-between px-1 py-1">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Notifications</p>
                      <p className="text-[10px] text-slate-500">Activité récente du médecin contrôleur</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {unreadNotificationsCount}
                    </span>
                  </div>

                  <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
                    {notificationsSeed.map((notification) => {
                      const config =
                        notificationTypeConfig[notification.type] || notificationTypeConfig.dossier;
                      const Icon = config.icon;

                      return (
                        <div
                          key={notification.id}
                          className="rounded-2xl border border-slate-200 bg-white p-2 transition hover:bg-slate-50"
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.className}`}
                            >
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold text-slate-900">
                                {notification.title}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-500">
                                {notification.description}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-400">
                                {notification.relativeTime}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate("/medecin-controleur/notifications");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                    >
                      Voir tout
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {topOverviewCards.map((card) => (
          <SummaryCard
            key={card.title}
            title={card.title}
            value={card.value}
            detail="Vue rapide"
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>

      <SectionShell
        title="Capacité du jour"
        subtitle="Maximum 20 patients par jour"
        action={
          <span className="text-[18px] font-bold leading-none text-slate-900">
            {capacityRemaining} / {capacityTotal}
          </span>
        }
      >
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-slate-900" style={{ width: progressWidth }} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 ring-1 ring-emerald-200">
            {capacityCompleted} terminées
          </span>
          <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700 ring-1 ring-amber-200">
            {capacityRemaining} restants
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 ring-1 ring-slate-200">
            En consultation : {activeConsultation}
          </span>
        </div>
      </SectionShell>

      <SectionShell
        title="Rendez-vous du jour"
        subtitle="Contrôles médicaux, validations de reprise et dossiers à traiter"
        action={
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => navigate("/medecin-controleur/recherche")}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-slate-800"
            >
              <Users size={13} />
              Recherche
            </button>
            <button
              type="button"
              onClick={() => navigate("/medecin-controleur/controle-medical")}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <FileSearch size={13} />
              Contrôle
            </button>
          </div>
        }
      >
        <div className="space-y-1.5">
          {appointmentsLoading ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-500">
              Chargement des collaborateurs...
            </p>
          ) : appointmentsError ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-700">
              {appointmentsError}
            </p>
          ) : appointments.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-500">
              Aucun collaborateur disponible pour afficher les rendez-vous.
            </p>
          ) : (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition hover:border-slate-300 md:grid-cols-[64px_minmax(0,1fr)_auto]"
            >
              <div className="rounded-xl bg-white px-2 py-2 text-center shadow-sm ring-1 ring-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Heure
                </p>
                <p className="mt-0.5 text-[15px] font-semibold tracking-tight text-slate-900">
                  {appointment.time}
                </p>
              </div>

              <div className="min-w-0">
                <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-slate-900">
                      {appointment.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {appointment.matricule} ”¢ {appointment.type}
                    </p>
                  </div>
                  <StatusBadge label={appointment.status} tone={appointment.statusTone} />
                </div>
                <p className="mt-1 text-[11px] leading-5 text-slate-600">{appointment.context}</p>
              </div>

              <div className="flex flex-col justify-between gap-1.5 md:items-end">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <UserRound size={12} />
                  Contrôle médical
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenDossier(appointment)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Ouvrir dossier
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))
          )}
        </div>
      </SectionShell>

      <div className="grid gap-2 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionShell
          title="Prochains patients"
          subtitle="Files de contrôle à venir"
          action={
            <button
              type="button"
              onClick={() => navigate("/medecin-controleur/controle-medical")}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 transition hover:text-slate-900"
            >
              Ouvrir
              <ChevronRight size={13} />
            </button>
          }
        >
          <div className="space-y-1.5">
            {upcomingPatients.map((patient) => (
              <div
                key={`${patient.name}-${patient.time}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-900">{patient.name}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                    {patient.time}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                      (accentClasses[patient.tone] || accentClasses.info).pill
                    }`}
                  >
                    {patient.type}
                  </span>
                  <p className="text-[10px] leading-5 text-slate-600">{patient.note}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell title="Alertes" subtitle="Points à traiter aujourd'hui">
          <div className="space-y-1.5">
            {alerts.map((alert) => (
              <div
                key={alert.title}
                className="rounded-2xl border border-rose-200 bg-rose-50 p-2.5"
              >
                <div className="flex items-start gap-2">
                  <ShieldAlert size={14} className="mt-0.5 shrink-0 text-rose-700" />
                  <div>
                    <p className="text-[11px] font-medium text-slate-900">{alert.title}</p>
                    <p className="mt-0.5 text-[10px] leading-5 text-slate-600">
                      {alert.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionShell>
      </div>

      <SectionShell title="Résumé rapide" subtitle="Indicateurs du poste">
        <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2"
            >
              <span className="text-[11px] text-slate-600">{item.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
                  (accentClasses[item.tone] || accentClasses.info).pill
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}



