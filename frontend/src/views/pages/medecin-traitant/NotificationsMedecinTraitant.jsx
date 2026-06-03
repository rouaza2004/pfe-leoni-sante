import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  ClipboardList,
  FileText,
  Filter,
  UserRound,
  XCircle,
} from "lucide-react";
import { api } from "@/api/api";

const FILTERS = [
  { id: "all", label: "Tous" },
  { id: "unread", label: "Non lus" },
  { id: "rendez-vous", label: "Rendez-vous" },
  { id: "documents", label: "Documents" },
];

const TYPE_LABELS = {
  RENDEZ_VOUS: "Rendez-vous",
  DOCUMENT: "Document",
  ALERTE: "Alerte",
  SYSTEME: "Systeme",
};

const NOTIFICATION_ICON = {
  RENDEZ_VOUS: {
    icon: Calendar,
    className: "bg-blue-50 text-blue-600",
  },
  DOCUMENT: {
    icon: FileText,
    className: "bg-emerald-50 text-emerald-600",
  },
  ALERTE: {
    icon: XCircle,
    className: "bg-rose-50 text-rose-600",
  },
  SYSTEME: {
    icon: UserRound,
    className: "bg-slate-100 text-slate-700",
  },
  DEFAULT: {
    icon: ClipboardList,
    className: "bg-indigo-50 text-indigo-600",
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

const formatRelativeTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(1, Math.round(diffMs / 60000));

  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "Hier";
  return `Il y a ${diffDays} j`;
};

const normalizeNotification = (notification) => ({
  id: notification.id,
  type: notification.type || "SYSTEME",
  typeLabel:
    notification.type_display ||
    TYPE_LABELS[notification.type] ||
    TYPE_LABELS.SYSTEME,
  title: notification.title || "Notification",
  description: notification.message || "",
  timestamp: formatRelativeTime(notification.created_at),
  read: Boolean(notification.is_read),
});

export default function NotificationsMedecinTraitant() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadNotifications = async (filter = activeFilter) => {
    try {
      setLoading(true);
      setErr("");
      const response = await api.get("/notifications/", {
        params: { filter },
      });

      const payload = response?.data || {};
      const items = Array.isArray(payload.notifications) ? payload.notifications : [];
      setNotifications(items.map(normalizeNotification));
      setUnreadCount(Number(payload.unread_count ?? 0));
    } catch (error) {
      console.error(error);
      setNotifications([]);
      setUnreadCount(0);
      setErr("Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(activeFilter);
  }, [activeFilter]);

  const filteredNotifications = useMemo(() => notifications, [notifications]);

  const markAllAsRead = async () => {
    try {
      setErr("");
      await api.post("/notifications/mark-all-read/");
      await loadNotifications(activeFilter);
    } catch (error) {
      console.error(error);
      setErr("Impossible de marquer les notifications comme lues.");
    }
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
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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

        {err ? (
          <div className="mb-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {err}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-center">
            <p className="text-sm font-medium text-slate-700">Chargement des notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
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
                NOTIFICATION_ICON[notification.type] || NOTIFICATION_ICON.DEFAULT;
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
                            {notification.typeLabel}
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
                      <p className="mt-1 text-[10px] text-slate-400">
                        {notification.timestamp}
                      </p>
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
