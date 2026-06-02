import { useMemo, useState } from "react";
import {
  Bell,
  CalendarClock,
  FileSearch,
  Stethoscope,
  UserRound,
} from "lucide-react";

const INITIAL_NOTIFICATIONS = [
  {
    id: "mc-notif-1",
    category: "rendez-vous",
    type: "Rendez-vous",
    title: "Nouveau rendez-vous de contrôle médical ajouté",
    description: "Un nouveau contrôle a été planifié pour la journée en cours.",
    timestamp: "Il y a 5 min",
    read: false,
  },
  {
    id: "mc-notif-2",
    category: "expertise",
    type: "Expertise",
    title: "Demande d'expertise reçue",
    description: "Un dossier prioritaire nécessite une validation rapide.",
    timestamp: "Il y a 18 min",
    read: false,
  },
  {
    id: "mc-notif-3",
    category: "rendez-vous",
    type: "Rendez-vous",
    title: "Rendez-vous imminent aujourd'hui",
    description: "Un collaborateur doit être reçu dans moins de 30 minutes.",
    timestamp: "Il y a 42 min",
    read: true,
  },
  {
    id: "mc-notif-4",
    category: "controle",
    type: "Contrôle médical",
    title: "Contrôle médical terminé",
    description: "Le dernier contrôle a été clôturé avec mise à jour du statut.",
    timestamp: "Il y a 1 h",
    read: true,
  },
  {
    id: "mc-notif-5",
    category: "controle",
    type: "Dossier",
    title: "Dossier collaborateur mis à jour",
    description: "De nouvelles informations ont été ajoutées au dossier sensible.",
    timestamp: "Il y a 3 h",
    read: false,
  },
];

const FILTERS = [
  { id: "all", label: "Tous" },
  { id: "unread", label: "Non lus" },
  { id: "rendez-vous", label: "Rendez-vous" },
  { id: "expertise", label: "Expertise" },
  { id: "controle", label: "Contrôle médical" },
];

const NOTIFICATION_ICON = {
  "Rendez-vous": { icon: CalendarClock, className: "bg-blue-50 text-blue-600" },
  Expertise: { icon: FileSearch, className: "bg-violet-50 text-violet-700" },
  "Contrôle médical": { icon: Stethoscope, className: "bg-emerald-50 text-emerald-700" },
  Dossier: { icon: UserRound, className: "bg-slate-100 text-slate-700" },
};

function SectionShell({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="text-[10px] text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function NotificationsMedecinControleur() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return notifications.filter((notification) => !notification.read);
      case "rendez-vous":
        return notifications.filter((notification) => notification.category === "rendez-vous");
      case "expertise":
        return notifications.filter((notification) => notification.category === "expertise");
      case "controle":
        return notifications.filter((notification) => notification.category === "controle");
      default:
        return notifications;
    }
  }, [activeFilter, notifications]);

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true }))
    );
  };

  return (
    <div className="space-y-2">
      <div className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Espace Médecin contrôleur</p>
            <h1 className="mt-0.5 text-[22px] font-bold tracking-tight text-slate-900">
              Notifications
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Suivi des alertes et rappels du médecin contrôleur
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">
            <Bell size={14} />
            <span>{unreadCount} non lues</span>
          </div>
        </div>
      </div>

      <SectionShell
        title="Centre de notifications"
        subtitle="Alertes récentes liées aux contrôles, expertises et rendez-vous"
        action={
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Marquer tout comme lu
          </button>
        }
      >
        <div className="mb-2 flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => {
            const active = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-center">
            <p className="text-sm font-medium text-slate-700">Aucune notification</p>
            <p className="mt-1 text-xs text-slate-500">
              Aucun élément ne correspond au filtre sélectionné.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredNotifications.map((notification) => {
              const iconConfig =
                NOTIFICATION_ICON[notification.type] || NOTIFICATION_ICON["Dossier"];
              const Icon = iconConfig.icon;

              return (
                <div
                  key={notification.id}
                  className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconConfig.className}`}
                    >
                      <Icon size={14} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-900">
                            {notification.title}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {notification.type}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            notification.read
                              ? "bg-slate-100 text-slate-600"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {notification.read ? "Lu" : "Non lu"}
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] text-slate-600">
                        {notification.description}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">{notification.timestamp}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionShell>
    </div>
  );
}

