import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileBadge2,
  FileText,
  FolderClock,
  ShieldAlert,
  Stethoscope,
  Upload,
  UserRound,
} from "lucide-react";

import { api } from "@/api/api";
import { getUsername } from "@/auth/auth";

const fallbackAppointments = [
  {
    id: "rh-rdv-1",
    collaborateur: "Nour Ben Salah",
    matricule: "RH-2048",
    typeVisite: "Visite de reprise",
    date: "2026-04-05",
    heure: "09:00",
    statut: "Confirmé",
    statutTone: "info",
    focus: "Retour après arrêt de 14 jours",
  },
  {
    id: "rh-rdv-2",
    collaborateur: "Karim Jaziri",
    matricule: "RH-1934",
    typeVisite: "Visite périodique",
    date: "2026-04-05",
    heure: "11:15",
    statut: "En attente",
    statutTone: "warning",
    focus: "Convocation non confirmée",
  },
  {
    id: "rh-rdv-3",
    collaborateur: "Meriem Gharbi",
    matricule: "RH-2210",
    typeVisite: "Aptitude sous condition",
    date: "2026-04-06",
    heure: "14:00",
    statut: "À suivre",
    statutTone: "secondary",
    focus: "Aménagement temporaire du poste",
  },
  {
    id: "rh-rdv-4",
    collaborateur: "Yassine Trabelsi",
    matricule: "RH-1755",
    typeVisite: "Contrôle médical",
    date: "2026-04-07",
    heure: "08:45",
    statut: "Planifié",
    statutTone: "success",
    focus: "Arrêt maladie prolongé",
  },
];

const fallbackFollowUps = [
  {
    id: "rh-follow-1",
    collaborateur: "Amel Kooli",
    matricule: "RH-1880",
    motif: "Visite en retard",
    detail: "La visite périodique dépasse la date cible de 12 jours.",
    tone: "danger",
  },
  {
    id: "rh-follow-2",
    collaborateur: "Hichem Saidi",
    matricule: "RH-1764",
    motif: "Reprise à suivre",
    detail: "Reprise prévue le 08/04 avec certificat de reprise attendu.",
    tone: "warning",
  },
  {
    id: "rh-follow-3",
    collaborateur: "Sarra Ben Amor",
    matricule: "RH-2241",
    motif: "Aptitude sous condition",
    detail: "Restriction de manutention à confirmer avec le manager.",
    tone: "secondary",
  },
  {
    id: "rh-follow-4",
    collaborateur: "Walid Gharbi",
    matricule: "RH-1672",
    motif: "Document manquant",
    detail: "Fiche d'aptitude non versée au dossier RH.",
    tone: "info",
  },
];

const fallbackDocuments = [
  {
    id: "rh-doc-1",
    titre: "Fiche d'aptitude",
    collaborateur: "Meriem Gharbi",
    matricule: "RH-2210",
    date: "2026-04-04",
    tone: "success",
  },
  {
    id: "rh-doc-2",
    titre: "Certificat médical",
    collaborateur: "Yassine Trabelsi",
    matricule: "RH-1755",
    date: "2026-04-03",
    tone: "info",
  },
  {
    id: "rh-doc-3",
    titre: "Demande d'expertise",
    collaborateur: "Amel Kooli",
    matricule: "RH-1880",
    date: "2026-04-02",
    tone: "warning",
  },
  {
    id: "rh-doc-4",
    titre: "Contrôle médical",
    collaborateur: "Hichem Saidi",
    matricule: "RH-1764",
    date: "2026-04-01",
    tone: "secondary",
  },
];

const summaryCards = [
  {
    title: "Rendez-vous à venir",
    value: "04",
    detail: "Convocations RH sur les 72 prochaines heures",
    icon: <CalendarDays size={16} />,
    tone: "info",
  },
  {
    title: "Visites en retard",
    value: "03",
    detail: "Dossiers dépassant la date de visite prévue",
    icon: <ShieldAlert size={16} />,
    tone: "danger",
  },
  {
    title: "Aptes avec condition",
    value: "05",
    detail: "Aménagements et restrictions à confirmer",
    icon: <FileBadge2 size={16} />,
    tone: "secondary",
  },
  {
    title: "Arrêts / repos en cours",
    value: "06",
    detail: "Suivi des absences avec reprise attendue",
    icon: <Stethoscope size={16} />,
    tone: "warning",
  },
  {
    title: "Documents générés",
    value: "11",
    detail: "Pièces médicales récentes disponibles",
    icon: <FileText size={16} />,
    tone: "success",
  },
  {
    title: "Dossiers en attente",
    value: "07",
    detail: "Éléments RH à valider ou compléter",
    icon: <FolderClock size={16} />,
    tone: "info",
  },
];

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
  },
  success: {
    icon: "border-emerald-200 bg-emerald-50 text-emerald-700",
    value: "text-emerald-700",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    soft: "border-emerald-100 bg-emerald-50/50",
  },
  warning: {
    icon: "border-amber-200 bg-amber-50 text-amber-700",
    value: "text-amber-700",
    pill: "bg-amber-50 text-amber-700 ring-amber-200",
    soft: "border-amber-100 bg-amber-50/50",
  },
  danger: {
    icon: "border-rose-200 bg-rose-50 text-rose-700",
    value: "text-rose-700",
    pill: "bg-rose-50 text-rose-700 ring-rose-200",
    soft: "border-rose-100 bg-rose-50/50",
  },
  secondary: {
    icon: "border-violet-200 bg-violet-50 text-violet-700",
    value: "text-violet-700",
    pill: "bg-violet-50 text-violet-700 ring-violet-200",
    soft: "border-violet-100 bg-violet-50/50",
  },
};

function formatDateLabel(dateValue) {
  if (!dateValue) return "--";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function normalizeApiAppointment(item) {
  const firstName = item?.collaborateur_prenom || "";
  const lastName = item?.collaborateur_nom || "";
  const collaborateur = `${firstName} ${lastName}`.trim() || "Collaborateur non renseigné";
  const matricule = item?.matricule || item?.collaborateur_matricule || "N/A";
  const motif = item?.motif || "Visite médicale";
  const statut = item?.statut || "";
  const upperStatus = statut.toUpperCase();

  let mappedStatus = "Confirmé";
  let statutTone = "info";

  if (upperStatus === "TERMINE") {
    mappedStatus = "Réalisé";
    statutTone = "success";
  } else if (upperStatus === "ANNULE") {
    mappedStatus = "Annulé";
    statutTone = "danger";
  } else if (upperStatus === "REPORTE") {
    mappedStatus = "En attente";
    statutTone = "warning";
  }

  return {
    id: item?.id || `${matricule}-${item?.date}-${item?.heure}`,
    collaborateur,
    matricule,
    typeVisite: motif,
    date: item?.date || "",
    heure: (item?.heure || "").slice(0, 5),
    statut: mappedStatus,
    statutTone,
    focus: item?.type_medecin
      ? `Médecin ${String(item.type_medecin).toLowerCase()}`
      : "Suivi RH du rendez-vous",
  };
}

function SummaryCard({ title, value, detail, icon, tone = "info" }) {
  const toneClass = accentClasses[tone] || accentClasses.info;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{title}</p>
          <p
            className={`mt-1 text-[22px] font-bold leading-none ${toneClass.value}`}
          >
            {value}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
        </div>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${toneClass.icon}`}
        >
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
      {label}
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

export default function RHDashboard() {
  const navigate = useNavigate();
  const username = getUsername();
  const sessionIdentifier = username || "responsable-rh";
  const unreadNotificationsCount = 3;
  const [appointments, setAppointments] = useState(fallbackAppointments);
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAppointments = async () => {
      try {
        const response = await api.get("/appointments/rdv/");
        if (cancelled) return;

        const payload = Array.isArray(response?.data) ? response.data : [];
        if (payload.length > 0) {
          setAppointments(payload.map(normalizeApiAppointment).slice(0, 6));
        }
      } catch (error) {
        console.error("Erreur chargement dashboard RH", {
          endpoint: "/api/appointments/rdv/",
          message: error?.message,
          status: error?.response?.status,
        });
      }
    };

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments;
  }, [appointments]);

  const filteredFollowUps = useMemo(() => {
    return fallbackFollowUps;
  }, []);

  const filteredDocuments = useMemo(() => {
    return fallbackDocuments;
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
    if (currentHour < 12) {
      return "Bonjour";
    }

    if (currentHour < 18) {
      return "Bon après-midi";
    }

    return "Bonsoir";
  }, [currentHour]);

  const quickActions = [
    {
      title: "Vue d'ensemble",
      description: "Accès au dossier RH via matricule ou fiche collaborateur.",
      icon: <CalendarDays size={16} />,
      onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
      tone: "info",
    },
    {
      title: "Rendez-vous",
      description: "Afficher les convocations et visites à venir.",
      icon: <CalendarDays size={16} />,
      onClick: () => {
        document.getElementById("rh-rendez-vous")?.scrollIntoView({ behavior: "smooth" });
      },
      tone: "success",
    },
    {
      title: "Historique",
      description: "Retrouver le suivi médical utile au périmètre RH.",
      icon: <Clock3 size={16} />,
      onClick: () => {
        document.getElementById("rh-follow-up")?.scrollIntoView({ behavior: "smooth" });
      },
      tone: "warning",
    },
    {
      title: "Documents",
      description: "Consulter les fiches, certificats et contrôles récents.",
      icon: <FileText size={16} />,
      onClick: () => {
        document.getElementById("rh-documents")?.scrollIntoView({ behavior: "smooth" });
      },
      tone: "secondary",
    },
    {
      title: "Import nouveaux opérateurs",
      description: "Préparer le suivi médical des nouveaux entrants.",
      icon: <Upload size={16} />,
      onClick: () => navigate("/rh/nouveaux-operateurs"),
      tone: "info",
    },
  ];

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
      description: "Accéder aux rapports RH liés au suivi médical des collaborateurs.",
      icon: <FileText size={16} />,
      route: "/rh/rapports",
      cta: "Voir les rapports",
      tone: "secondary",
    },
  ];

  const featureCards = rhModules;

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
                Pilotage RH des rendez-vous, absences médicales et documents de suivi.
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
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border ${toneClass.icon}`}
                >
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

      <section
        id="rh-rendez-vous"
        className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm ring-1 ring-slate-200"
      >
        <div className="mb-2 flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Prochains rendez-vous</h2>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Convocations médicales à venir et points de suivi pour le service RH.
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

        <div className="space-y-1.5">
          {filteredAppointments.map((appointment) => (
            <article
              key={appointment.id}
              className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2 transition hover:border-slate-300 lg:grid-cols-[76px_minmax(0,1fr)_auto]"
            >
              <div className="rounded-xl bg-white px-2 py-2 text-center shadow-sm ring-1 ring-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Horaire
                </p>
                <p className="mt-0.5 text-[16px] font-semibold tracking-tight text-slate-900">
                  {appointment.heure || "--:--"}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {formatDateLabel(appointment.date)}
                </p>
              </div>

              <div className="min-w-0">
                <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">
                      {appointment.collaborateur}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {appointment.matricule} ”¢ {appointment.typeVisite}
                    </p>
                  </div>
                  <StatusBadge label={appointment.statut} tone={appointment.statutTone} />
                </div>
                <p className="mt-1 text-[11px] leading-4 text-slate-600">{appointment.focus}</p>
              </div>

              <div className="flex flex-col justify-between gap-1.5 sm:flex-row lg:flex-col lg:items-end">
                <span className="text-[10px] text-slate-500">Suivi RH</span>
                <button
                  type="button"
                  onClick={() => navigate("/rh")}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Retour RH
                  <ChevronRight size={12} />
                </button>
              </div>
            </article>
          ))}

          {filteredAppointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-4 text-xs text-slate-600">
              Aucun rendez-vous ne correspond à la recherche en cours.
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-1.5 xl:grid-cols-[1.15fr_0.85fr]">
        <PanelCard
          id="rh-follow-up"
          title="Collaborateurs à suivre"
          subtitle="Visites en retard, reprises, aptitudes sous condition et documents manquants"
        >
          <div className="space-y-1">
            {filteredFollowUps.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-2 ${(
                  accentClasses[item.tone] || accentClasses.info
                ).soft}`}
              >
                <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{item.collaborateur}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {item.matricule} ”¢ {item.motif}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                      (accentClasses[item.tone] || accentClasses.info).pill
                    }`}
                  >
                    Action RH
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-slate-600">{item.detail}</p>
              </div>
            ))}

            {filteredFollowUps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-4 text-xs text-slate-600">
                Aucun collaborateur à suivre pour ce filtre.
              </div>
            ) : null}
          </div>
        </PanelCard>

        <PanelCard
          id="rh-documents"
          title="Documents récents"
          subtitle="Fiches d'aptitude, certificats et pièces médicales accessibles au suivi RH"
        >
          <div className="space-y-1">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{doc.titre}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {doc.collaborateur} ”¢ {doc.matricule}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                      (accentClasses[doc.tone] || accentClasses.info).pill
                    }`}
                  >
                    {formatDateLabel(doc.date)}
                  </span>
                </div>
              </div>
            ))}

            {filteredDocuments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-4 text-xs text-slate-600">
                Aucun document récent ne correspond à la recherche.
              </div>
            ) : null}
          </div>
        </PanelCard>
      </div>

      <PanelCard
        title="Modules RH"
        subtitle="Accès direct aux fonctionnalités RH déjà disponibles dans l'application"
      >
        <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => navigate(card.route)}
              className="rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-sm shadow-slate-200/30 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                  (accentClasses[card.tone] || accentClasses.info).icon
                }`}
              >
                {card.icon}
              </div>
              <p className="mt-1.5 text-[12px] font-semibold text-slate-900">{card.title}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{card.description}</p>
            </button>
          ))}
        </div>
      </PanelCard>

      <PanelCard
        title="Accès rapide"
        subtitle="Entrées principales du workflow RH pour la recherche, le suivi et les documents"
      >
        <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-5">
          {quickActions.map((action) => (
            <button
              key={action.title}
              type="button"
              onClick={action.onClick}
              className="rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-sm shadow-slate-200/30 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                  (accentClasses[action.tone] || accentClasses.info).icon
                }`}
              >
                {action.icon}
              </div>
              <p className="mt-1.5 text-[12px] font-semibold text-slate-900">{action.title}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{action.description}</p>
            </button>
          ))}
        </div>
      </PanelCard>
    </div>
  );
}



