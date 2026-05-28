import { useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  CalendarClock,
  ClipboardList,
  FileText,
  Filter,
  UserRound,
  XCircle,
} from "lucide-react";

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    category: "rendez-vous",
    type: "Nouveau rendez-vous",
    title: "Nouveau rendez-vous ajouté aujourd'hui",
    description: "Un collaborateur a été ajouté au planning de consultation du jour.",
    timestamp: "Il y a 5 min",
    read: false,
  },
  {
    id: "notif-2",
    category: "rendez-vous",
    type: "Rendez-vous imminent",
    title: "Rendez-vous imminent avec un collaborateur",
    description: "Consultation prévue dans moins de 30 minutes.",
    timestamp: "Il y a 18 min",
    read: false,
  },
  {
    id: "notif-3",
    category: "documents",
    type: "Certificat",
    title: "Certificat médical généré",
    description: "Le document a été préparé et peut être consulté ou imprimé.",
    timestamp: "Il y a 1 h",
    read: true,
  },
  {
    id: "notif-4",
    category: "documents",
    type: "Ordonnance",
    title: "Ordonnance créée",
    description: "Une nouvelle ordonnance a été enregistrée pour un collaborateur suivi.",
    timestamp: "Il y a 2 h",
    read: true,
  },
  {
    id: "notif-5",
    category: "rendez-vous",
    type: "Annulation",
    title: "Rendez-vous annulé",
    description: "Un rendez-vous a été annulé et retiré du planning actif.",
    timestamp: "Il y a 4 h",
    read: false,
  },
  {
    id: "notif-6",
    category: "documents",
    type: "Dossier médical",
    title: "Dossier médical mis à jour",
    description: "Une fiche collaborateur a été modifiée récemment.",
    timestamp: "Hier",
    read: true,
  },
];

const FILTERS = [
  { id: "all", label: "Tous" },
  { id: "unread", label: "Non lus" },
  { id: "rendez-vous", label: "Rendez-vous" },
  { id: "documents", label: "Documents" },
];

const NOTIFICATION_ICON = {
  "Nouveau rendez-vous": {
    icon: Calendar,
    className: "bg-blue-50 text-blue-600",
  },
  "Rendez-vous imminent": {
    icon: CalendarClock,
    className: "bg-amber-50 text-amber-600",
  },
  Certificat: {
    icon: FileText,
    className: "bg-emerald-50 text-emerald-600",
  },
  Ordonnance: {
    icon: ClipboardList,
    className: "bg-indigo-50 text-indigo-600",
  },
  Annulation: {
    icon: XCircle,
    className: "bg-rose-50 text-rose-600",
  },
  "Dossier médical": {
    icon: UserRound,
    className: "bg-slate-100 text-slate-700",
  },
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

export default function NotificationsMedecinTraitant() {
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
      case "documents":
        return notifications.filter((notification) => notification.category === "documents");
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
            <p className="text-xs font-medium text-slate-500">Espace Médecin Traitant</p>
            <h1 className="mt-0.5 text-[22px] font-bold tracking-tight text-slate-900">
              Notifications
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Suivi des alertes et rappels médicaux
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
        subtitle="Alertes récentes liées aux rendez-vous et documents médicaux"
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
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter.id === "all" ? <Filter size={12} /> : null}
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
                NOTIFICATION_ICON[notification.type] || NOTIFICATION_ICON["Dossier médical"];
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
