import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileSearch,
  Search,
  ShieldAlert,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";

import { getUsername } from "../../auth/auth";

const summaryCards = [
  {
    title: "Contrôles planifiés",
    value: "08",
    detail: "2 visites terrain cet après-midi",
    icon: <Stethoscope size={16} />,
    tone: "info",
  },
  {
    title: "Reprises à valider",
    value: "03",
    detail: "Décisions après contrôle",
    icon: <FileCheck2 size={16} />,
    tone: "warning",
  },
  {
    title: "Demandes d'expertise",
    value: "02",
    detail: "1 dossier prioritaire",
    icon: <FileSearch size={16} />,
    tone: "secondary",
  },
  {
    title: "Dossiers sensibles",
    value: "04",
    detail: "Arrêts longs à suivre",
    icon: <ShieldAlert size={16} />,
    tone: "danger",
  },
];

const appointments = [
  {
    id: 1,
    time: "08:30",
    name: "Sonia Ben Salem",
    matricule: "LEO-0421",
    type: "Contrôle arrêt maladie",
    context: "Visite à domicile • Quartier industriel",
    status: "Terminé",
    statusTone: "success",
  },
  {
    id: 2,
    time: "10:15",
    name: "Walid Mansouri",
    matricule: "LEO-1178",
    type: "Reprise travail",
    context: "Validation après 21 jours d'arrêt",
    status: "En cours",
    statusTone: "inProgress",
  },
  {
    id: 3,
    time: "13:45",
    name: "Asma Jlassi",
    matricule: "LEO-0882",
    type: "Accident de travail",
    context: "Contrôle suite à accident avec arrêt",
    status: "En attente",
    statusTone: "warning",
  },
  {
    id: 4,
    time: "15:30",
    name: "Karim Trabelsi",
    matricule: "LEO-1544",
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
    time: "Demain • 09:00",
    type: "Reprise travail",
    note: "Contrôle post-hospitalisation",
    tone: "warning",
  },
  {
    name: "Rim Mzoughi",
    time: "Demain • 11:30",
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

const statusClasses = {
  inProgress: "border-slate-300 bg-slate-900 text-white",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

const accentClasses = {
  info: {
    icon: "border-sky-200 bg-sky-50 text-sky-700",
    value: "text-sky-700",
    pill: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  success: {
    icon: "border-emerald-200 bg-emerald-50 text-emerald-700",
    value: "text-emerald-700",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  warning: {
    icon: "border-amber-200 bg-amber-50 text-amber-700",
    value: "text-amber-700",
    pill: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  danger: {
    icon: "border-rose-200 bg-rose-50 text-rose-700",
    value: "text-rose-700",
    pill: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  secondary: {
    icon: "border-violet-200 bg-violet-50 text-violet-700",
    value: "text-violet-700",
    pill: "bg-violet-50 text-violet-700 ring-violet-200",
  },
};

const topCardClasses = {
  info: "border-sky-200/90 shadow-sky-100/40",
  success: "border-emerald-200/90 shadow-emerald-100/40",
  warning: "border-amber-200/90 shadow-amber-100/40",
  danger: "border-rose-200/90 shadow-rose-100/40",
  secondary: "border-violet-200/90 shadow-violet-100/40",
};

function SummaryCard({ title, value, detail, icon, tone = "info" }) {
  const toneClass = accentClasses[tone] || accentClasses.info;

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-3.5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p
            className={`mt-1.5 text-[26px] font-semibold tracking-tight ${toneClass.value}`}
          >
            {value}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${toneClass.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ label, tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function PanelCard({ title, subtitle, children, action, onAction }) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-3.5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        {action ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 transition hover:text-slate-900"
          >
            {action}
            <ChevronRight size={14} />
          </button>
        ) : null}
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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60 * 1000);

    return () => window.clearInterval(intervalId);
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

  const greeting = useMemo(
    () => {
      if (currentHour < 12) {
        return "Bonjour";
      }

      if (currentHour < 18) {
        return "Bon après-midi";
      }

      return "Bonsoir";
    },
    [currentHour]
  );

  const capacityTotal = 20;
  const capacityCompleted = 0;
  const capacityRemaining = 1;
  const capacityCurrent = capacityCompleted + capacityRemaining;
  const progressWidth = `${(capacityCurrent / capacityTotal) * 100}%`;
  const activeConsultation = "Mahdi Ayadi";

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                <CalendarDays size={14} className="text-slate-700" />
                {currentDate}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 font-medium text-white">
                <Clock3 size={14} />4 rendez-vous planifiés
              </span>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                LEONI
              </p>
              <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">
                {`${greeting}, ${sessionIdentifier}`}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-600">
                Suivi des contrôles médicaux, reprises travail, arrêts maladie et
                demandes d'expertise du médecin contrôleur.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row xl:w-[320px] xl:flex-col">
            <label className="flex h-10.5 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 shadow-sm shadow-slate-200/40 transition focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un dossier..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {topOverviewCards.map((card) => {
              const toneClass = accentClasses[card.tone] || accentClasses.info;
              const topCardClass = topCardClasses[card.tone] || topCardClasses.info;

              return (
                <article
                  key={card.title}
                  className={`rounded-[22px] border bg-white p-3 shadow-sm ${topCardClass}`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div>
                      <p className="text-xs font-medium text-slate-500">{card.title}</p>
                      <p
                        className={`mt-2 text-[24px] font-semibold leading-none tracking-tight ${toneClass.value}`}
                      >
                        {card.value}
                      </p>
                    </div>
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${toneClass.icon}`}
                    >
                      {card.icon}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white px-4 py-3.5 shadow-sm shadow-slate-200/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Capacité du jour</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Maximum 20 patients par jour
                </p>
              </div>
              <p className="min-w-[92px] text-right text-[30px] font-semibold leading-none tracking-tight text-slate-900">
                {capacityRemaining} / {capacityTotal}
              </p>
            </div>

            <div className="mt-3 h-1.5 rounded-full bg-slate-200">
              <div
                className="h-1.5 rounded-full bg-slate-900"
                style={{ width: progressWidth }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-200">
                {capacityCompleted} terminées
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 ring-1 ring-amber-200">
                {capacityRemaining} restants
              </span>
              <span className="rounded-full bg-slate-900 px-3 py-1.5 text-white">
                En consultation : {activeConsultation}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Rendez-vous du jour</h2>
            <p className="mt-1 text-xs text-slate-500">
              Contrôles médicaux, validations de reprise et dossiers à traiter.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/medecin-controleur/recherche")}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Users size={15} />
              Recherche collaborateur
            </button>
            <button
              type="button"
              onClick={() => navigate("/medecin-controleur/controle-medical")}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <FileSearch size={15} />
              Contrôle médical
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-3 transition hover:border-slate-300 lg:grid-cols-[74px_minmax(0,1fr)_auto]"
            >
              <div className="rounded-2xl bg-white px-3 py-2.5 text-center shadow-sm ring-1 ring-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Heure
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                  {appointment.time}
                </p>
              </div>

              <div className="min-w-0">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {appointment.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {appointment.matricule} • {appointment.type}
                    </p>
                  </div>
                  <StatusBadge
                    label={appointment.status}
                    tone={appointment.statusTone}
                  />
                </div>
                <p className="mt-2 text-sm leading-5 text-slate-600">
                  {appointment.context}
                </p>
              </div>

              <div className="flex flex-col justify-between gap-2 sm:flex-row lg:flex-col lg:items-end">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <UserRound size={14} />
                  Contrôle médical
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/medecin-controleur/recherche")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Ouvrir dossier
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PanelCard
        title="Prochains patients"
        subtitle="Files de contrôle à venir"
        action="Ouvrir"
        onAction={() => navigate("/medecin-controleur/controle-medical")}
      >
        <div className="space-y-2">
          {upcomingPatients.map((patient) => (
            <div
              key={`${patient.name}-${patient.time}`}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{patient.name}</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                  {patient.time}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                    (accentClasses[patient.tone] || accentClasses.info).pill
                  }`}
                >
                  {patient.type}
                </span>
                <p className="text-xs leading-5 text-slate-600">{patient.note}</p>
              </div>
            </div>
          ))}
        </div>
      </PanelCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <PanelCard title="Alertes" subtitle="Points à traiter aujourd'hui">
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.title}
                className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3"
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-rose-700" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {alert.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title="Résumé rapide" subtitle="Indicateurs du poste">
          <div className="space-y-2">
            {quickStats.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5"
              >
                <span className="text-xs text-slate-600">{item.label}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-sm font-medium ring-1 ${
                    (accentClasses[item.tone] || accentClasses.info).pill
                  }`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
