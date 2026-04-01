import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
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
  },
  {
    title: "Reprises à valider",
    value: "03",
    detail: "Décisions après contrôle",
    icon: <FileCheck2 size={16} />,
  },
  {
    title: "Demandes d'expertise",
    value: "02",
    detail: "1 dossier prioritaire",
    icon: <FileSearch size={16} />,
  },
  {
    title: "Dossiers sensibles",
    value: "04",
    detail: "Arrêts longs à suivre",
    icon: <ShieldAlert size={16} />,
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
    statusTone: "soft",
  },
  {
    id: 2,
    time: "10:15",
    name: "Walid Mansouri",
    matricule: "LEO-1178",
    type: "Reprise travail",
    context: "Validation après 21 jours d'arrêt",
    status: "En cours",
    statusTone: "dark",
  },
  {
    id: 3,
    time: "13:45",
    name: "Asma Jlassi",
    matricule: "LEO-0882",
    type: "Accident de travail",
    context: "Contrôle suite à accident avec arrêt",
    status: "En attente",
    statusTone: "muted",
  },
  {
    id: 4,
    time: "15:30",
    name: "Karim Trabelsi",
    matricule: "LEO-1544",
    type: "Contrôle périodique",
    context: "Suivi d'un dossier récurrent",
    status: "Suivant",
    statusTone: "soft",
  },
];

const upcomingPatients = [
  {
    name: "Nadia Chatti",
    time: "16:10",
    type: "Demande d'expertise",
    note: "Avis externe demandé par RH",
  },
  {
    name: "Hatem Gharbi",
    time: "Demain • 09:00",
    type: "Reprise travail",
    note: "Contrôle post-hospitalisation",
  },
  {
    name: "Rim Mzoughi",
    time: "Demain • 11:30",
    type: "Arrêt maladie",
    note: "Vérification de prolongation",
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
  { label: "Taux de réalisation", value: "75%" },
  { label: "Décisions de reprise", value: "05" },
  { label: "Arrêts confirmés", value: "02" },
  { label: "Expertises externes", value: "01" },
];

const statusClasses = {
  dark: "border-slate-900 bg-slate-900 text-white",
  soft: "border-slate-200 bg-slate-100 text-slate-800",
  muted: "border-slate-200 bg-slate-50 text-slate-700",
};

function SummaryCard({ title, value, detail, icon }) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-3.5 shadow-sm shadow-slate-200/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-1.5 text-[26px] font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-800">
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
    <section className="rounded-[26px] border border-slate-200 bg-white p-3.5 shadow-sm shadow-slate-200/50">
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

  const initials = useMemo(() => {
    const parts = (username || "Médecin Contrôleur")
      .split(/[.\s_-]+/)
      .filter(Boolean)
      .slice(0, 2);

    return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "MC";
  }, [username]);

  const capacityDone = 14;
  const capacityTotal = 20;
  const progressWidth = `${(capacityDone / capacityTotal) * 100}%`;

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
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
                Tableau de bord
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

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm shadow-slate-200/40">
              <button
                type="button"
                onClick={() => navigate("/notifications")}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 transition hover:bg-slate-200"
                title="Notifications"
              >
                <Bell size={16} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              </button>

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-xs font-semibold text-white">
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

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.9fr)_repeat(3,minmax(0,1fr))]">
          <div className="rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm shadow-slate-200/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Capacité du jour</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Maximum 20 patients par jour
                </p>
              </div>
              <p className="min-w-[92px] text-right text-[30px] font-semibold leading-none tracking-tight text-slate-900">
                {capacityDone} / {capacityTotal}
              </p>
            </div>

            <div className="mt-3 h-1.5 rounded-full bg-slate-200">
              <div
                className="h-1.5 rounded-full bg-slate-900"
                style={{ width: progressWidth }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white px-3 py-1.5 text-slate-700 ring-1 ring-slate-200">
                9 terminés
              </span>
              <span className="rounded-full bg-white px-3 py-1.5 text-slate-700 ring-1 ring-slate-200">
                5 restants
              </span>
              <span className="rounded-full bg-slate-900 px-3 py-1.5 text-white">
                En consultation : Khelifi Mourad
              </span>
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40">
            <p className="text-xs text-slate-500">Dossiers urgents</p>
            <p className="mt-1.5 text-[26px] font-semibold text-slate-900">02</p>
            <p className="mt-1 text-xs text-slate-500">
              Accident de travail et expertise
            </p>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40">
            <p className="text-xs text-slate-500">Contrôles terminés</p>
            <p className="mt-1.5 text-[26px] font-semibold text-slate-900">09</p>
            <p className="mt-1 text-xs text-slate-500">Mis à jour avant midi</p>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40">
            <p className="text-xs text-slate-500">Décisions en attente</p>
            <p className="mt-1.5 text-[26px] font-semibold text-slate-900">03</p>
            <p className="mt-1 text-xs text-slate-500">À statuer après visite</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
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
              onClick={() => navigate("/medecin-controleur/historique")}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <FileSearch size={15} />
              Voir l'historique
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
        action="Voir tout"
        onAction={() => navigate("/medecin-controleur/historique")}
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
                  <p className="mt-1 text-xs text-slate-500">{patient.type}</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                  {patient.time}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">{patient.note}</p>
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
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-slate-800" />
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
                <span className="text-sm font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}