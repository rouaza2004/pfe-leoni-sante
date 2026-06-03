import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Bell,
  FileText,
  ClipboardList,
  Stethoscope,
  ArrowRight,
  CalendarClock,
  UserRound,
  XCircle,
  Clock3,
} from "lucide-react";
import { api } from "@/api/api";
import { getUserRole, getUsername } from "@/auth/auth";

const DAILY_CAPACITY_MAX = 20;

const StatCard = ({ title, value, subtitle, icon, iconClass = "" }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:shadow-md">
    <div className="flex items-start justify-between gap-2.5">
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{title}</p>
        <p className="mt-1 text-[22px] font-bold leading-none text-slate-900">{value}</p>
        <p className="mt-1 text-[10px] text-slate-400">{subtitle}</p>
      </div>

      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ${iconClass}`}
      >
        {icon}
      </div>
    </div>
  </div>
);

const QuickAction = ({ title, desc, icon, onClick, iconClass = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div
      className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ${iconClass}`}
    >
      {icon}
    </div>
    <h3 className="text-[13px] font-semibold leading-tight text-slate-900">{title}</h3>
    <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{desc}</p>
  </button>
);

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

const Chip = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${className}`.trim()}
  >
    {children}
  </span>
);

const NOTIFICATION_STYLES = {
  new_rdv: {
    icon: Calendar,
    iconClass: "bg-blue-50 text-blue-600",
  },
  imminent: {
    icon: Clock3,
    iconClass: "bg-amber-50 text-amber-600",
  },
  certificat: {
    icon: FileText,
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  ordonnance: {
    icon: ClipboardList,
    iconClass: "bg-indigo-50 text-indigo-600",
  },
  attente: {
    icon: UserRound,
    iconClass: "bg-slate-100 text-slate-700",
  },
  annule: {
    icon: XCircle,
    iconClass: "bg-rose-50 text-rose-600",
  },
};

const ROLE_LABELS = {
  MEDECIN_TRAITANT: "Médecin Traitant",
  MEDECIN_TRAVAIL: "Médecin du Travail",
  MEDECIN_CONTROLEUR: "Médecin Contrôleur",
};

const formatAppointmentType = (value) => {
  if (value === "Visite périodique") return value;
  if (value === "Visite d'embauche") return value;
  return value || "Consultation";
};

const parseStoredObject = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getDisplayNameFromUser = (user, fallbackUsername, role) => {
  if (!user || typeof user !== "object") {
    return fallbackUsername || ROLE_LABELS[role] || "Médecin";
  }

  const first =
    user.first_name ||
    user.firstName ||
    user.prenom ||
    user?.user?.prenom ||
    "";
  const last =
    user.last_name ||
    user.lastName ||
    user.nom ||
    user?.user?.nom ||
    "";
  const full =
    user.full_name ||
    user.fullName ||
    user.name ||
    user.username ||
    user.doctor_name ||
    user.medecin_name ||
    user?.profile?.name ||
    "";

  const combined = `${first} ${last}`.trim();
  const baseName = full || combined || fallbackUsername || ROLE_LABELS[role] || "Médecin";
  if (!baseName) return "Médecin";

  if (/\bdr\.?\b/i.test(baseName)) return baseName;
  if (role === "MEDECIN_TRAITANT") return `Dr. ${baseName}`;
  return baseName;
};

const getRelativeTime = (date) => {
  const value = date instanceof Date ? date.getTime() : new Date(date).getTime();
  if (!Number.isFinite(value)) return "À l'instant";

  const diffMs = Date.now() - value;
  const diffMin = Math.max(1, Math.round(diffMs / 60000));

  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `Il y a ${diffDays} j`;
};

export default function MedecinTraitantDashboard() {
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  const [rdvs, setRdvs] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const role = getUserRole();
  const fallbackUsername = getUsername();

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const [dashboardRes, meRes] = await Promise.all([
          api.get("/appointments/rdv/medecin-traitant-dashboard/"),
          api.get("/me/"),
        ]);

        if (cancelled) return;

        const data = dashboardRes?.data || {};
        const me = meRes?.data || null;

        setCurrentUser(me);
        setDashboardData(data);
        setRdvs(Array.isArray(data.next_appointments) ? data.next_appointments : []);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setCurrentUser(null);
          setDashboardData(null);
          setRdvs([]);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
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

  const storedUser = useMemo(
    () => parseStoredObject("user") || parseStoredObject("profile") || parseStoredObject("currentUser"),
    []
  );

  const displayName = useMemo(
    () => getDisplayNameFromUser(currentUser || storedUser, fallbackUsername, role),
    [currentUser, storedUser, fallbackUsername, role]
  );

  const headerSubtitle = useMemo(() => {
    if (displayName && displayName !== ROLE_LABELS[role]) {
      return `Connecté en tant que : ${displayName}`;
    }
    if (fallbackUsername) {
      return `Connecté en tant que : ${fallbackUsername}`;
    }
    return `Connecté en tant que : ${ROLE_LABELS[role] || "Médecin Traitant"}`;
  }, [displayName, fallbackUsername, role]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }, []);

  const dailyCapacity = useMemo(() => {
    const capacity = dashboardData?.daily_capacity || {};
    const completed = Number(capacity.completed ?? 0);
    const inConsultation = Number(capacity.in_consultation ?? 0);
    const remaining = Number(capacity.remaining ?? 0);
    const total = Number(capacity.total ?? 0);
    const capacityMax = Number(capacity.capacity_max ?? DAILY_CAPACITY_MAX) || DAILY_CAPACITY_MAX;
    const progress = Math.min((total / capacityMax) * 100, 100);

    return {
      completed,
      inConsultation,
      remaining,
      total,
      progress,
      capacityMax,
    };
  }, [dashboardData]);

  const notifications = useMemo(() => {
    const now = Date.now();
    const todayAppointments = rdvs.filter((item) => item.date === today);
    const tomorrowAppointments = rdvs.filter((item) => item.date === tomorrow);
    const imminentToday = todayAppointments
      .filter((item) => item.statut === "PREVU")
      .slice(0, 2);
    const cancelled = rdvs.filter((item) => item.statut === "ANNULE").slice(0, 1);

    const items = [
      ...todayAppointments.slice(0, 1).map((item, index) => ({
        id: `new-rdv-${item.id || index}`,
        type: "new_rdv",
        title: "Nouveau rendez-vous ajouté",
        description: `${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim() || "Collaborateur",
        createdAt: new Date(now - 5 * 60000),
      })),
      ...imminentToday.map((item, index) => ({
        id: `imminent-${item.id || index}`,
        type: "imminent",
        title: "Rendez-vous imminent aujourd'hui",
        description: `${item.heure?.slice?.(0, 5) || item.heure || "--"} ”¢ ${
          `${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim() || "Collaborateur"
        }`,
        createdAt: new Date(now - (index + 1) * 18 * 60000),
      })),
      {
        id: "certificat-mock",
        type: "certificat",
        title: "Certificat généré",
        description: "Dernier document médical préparé avec succès.",
        createdAt: new Date(now - 55 * 60000),
      },
      {
        id: "ordonnance-mock",
        type: "ordonnance",
        title: "Ordonnance créée",
        description: "Document prêt pour impression ou consultation.",
        createdAt: new Date(now - 2 * 3600000),
      },
      ...tomorrowAppointments.slice(0, 1).map((item, index) => ({
        id: `attente-${item.id || index}`,
        type: "attente",
        title: "Collaborateur en attente",
        description: `${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim() || "Collaborateur",
        createdAt: new Date(now - 3 * 3600000),
      })),
      ...cancelled.map((item, index) => ({
        id: `cancelled-${item.id || index}`,
        type: "annule",
        title: "Rendez-vous annulé",
        description: `${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim() || "Collaborateur",
        createdAt: new Date(now - 5 * 3600000),
      })),
    ];

    return items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6);
  }, [rdvs, today, tomorrow]);

  const unreadNotificationsCount = notifications.length;

  const kpi = useMemo(
    () => ({
      rdvToday: Number(dashboardData?.rdv_today_count ?? 0),
      rdvWeek: Number(dashboardData?.rdv_week_count ?? 0),
      collaborateursSuivis: Number(dashboardData?.collaborateurs_suivis_count ?? 0),
      docsGenerated: Number(dashboardData?.documents_generated_count ?? 0),
    }),
    [dashboardData]
  );

  const prochainsRdv = useMemo(() => {
    const appointments = Array.isArray(dashboardData?.next_appointments)
      ? dashboardData.next_appointments
      : [];

    return appointments
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        nom:
          `${item.collaborateur_prenom || ""} ${item.collaborateur_nom || ""}`.trim() ||
          "Collaborateur",
        type: formatAppointmentType(item.motif),
        heure: item.heure?.slice?.(0, 5) || item.heure || "””",
        when: item.date === today ? "Aujourd'hui" : "Demain",
      }));
  }, [dashboardData, today]);

  return (
    <div className="space-y-2">
      <div className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Espace Médecin Traitant</p>
            <h1 className="mt-0.5 text-[22px] font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">{headerSubtitle}</p>
          </div>

          <div className="relative self-start" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              title="Notifications"
            >
              <Bell size={14} />
              <span>Notifications</span>
              {unreadNotificationsCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {unreadNotificationsCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[320px] max-w-[85vw] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                <div className="mb-1 flex items-center justify-between px-1 py-1">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Notifications médicales</p>
                    <p className="text-[10px] text-slate-500">Activité récente du tableau de bord</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                    {unreadNotificationsCount}
                  </span>
                </div>

                <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
                  {notifications.map((notification) => {
                    const style = NOTIFICATION_STYLES[notification.type] || NOTIFICATION_STYLES.attente;
                    const Icon = style.icon;

                    return (
                      <div
                        key={notification.id}
                        className="rounded-2xl border border-slate-200 bg-white p-2 transition hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.iconClass}`}
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
                              {getRelativeTime(notification.createdAt)}
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
                      navigate("/medecin-traitant/notifications");
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                  >
                    Voir toutes les notifications
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="RDV aujourd'hui"
          value={kpi.rdvToday}
          subtitle="Charge du jour"
          icon={<Calendar size={16} className="text-blue-600" />}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="RDV semaine"
          value={kpi.rdvWeek}
          subtitle="Planning hebdo"
          icon={<CalendarClock size={16} className="text-indigo-600" />}
          iconClass="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Collaborateurs suivis"
          value={kpi.collaborateursSuivis}
          subtitle="Patients accessibles"
          icon={<Users size={16} className="text-emerald-600" />}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Documents générés"
          value={kpi.docsGenerated}
          subtitle="Certificats & ordonnances"
          icon={<FileText size={16} className="text-amber-600" />}
          iconClass="bg-amber-50 text-amber-600"
        />
      </div>

      <SectionShell
        title="Capacité du jour"
        subtitle={`Maximum ${dailyCapacity.capacityMax} patients par jour`}
        action={
          <span className="text-[18px] font-bold leading-none text-slate-900">
            {dailyCapacity.total} / {dailyCapacity.capacityMax}
          </span>
        }
      >
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900 transition-[width] duration-300 ease-out"
            style={{ width: `${dailyCapacity.progress}%` }}
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            {dailyCapacity.completed} terminés
          </Chip>
          <Chip className="bg-amber-50 text-amber-700 ring-1 ring-amber-200">
            {dailyCapacity.remaining} restants
          </Chip>
          <Chip className="bg-blue-50 text-blue-700 ring-1 ring-blue-200">
            En consultation : {dailyCapacity.inConsultation}
          </Chip>
        </div>
      </SectionShell>

      <SectionShell title="Actions rapides" subtitle="Accès direct aux tâches fréquentes">
        <div className="grid gap-1.5 md:grid-cols-3">
          <QuickAction
            title="Ouvrir dossier médical"
            desc="Accéder au dossier d'un collaborateur."
            icon={<Stethoscope size={15} className="text-emerald-600" />}
            iconClass="bg-emerald-50 text-emerald-600"
            onClick={() => navigate("/medecin-traitant/collaborateurs?action=dossier")}
          />
          <QuickAction
            title="Remplir fiche médicale"
            desc="Créer ou mettre à jour la fiche."
            icon={<ClipboardList size={15} className="text-blue-600" />}
            iconClass="bg-blue-50 text-blue-600"
            onClick={() => navigate("/medecin-traitant/fiche-medicale")}
          />
          <QuickAction
            title="Créer ordonnance / certificat"
            desc="Générer un document médical."
            icon={<FileText size={15} className="text-amber-600" />}
            iconClass="bg-amber-50 text-amber-600"
            onClick={() => navigate("/medecin-traitant/certificat-ordonnance")}
          />
        </div>
      </SectionShell>

      <SectionShell
        title="Prochains rendez-vous"
        subtitle="Aujourd'hui & demain"
        action={
          <button
            type="button"
            onClick={() => navigate("/medecin-traitant/rdv")}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
          >
            Voir tous
            <ArrowRight size={13} />
          </button>
        }
      >
        {prochainsRdv.length === 0 ? (
          <p className="text-xs text-slate-500">Aucun rendez-vous.</p>
        ) : (
          <div className="space-y-1.5">
            {prochainsRdv.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => navigate("/medecin-traitant/rdv")}
                className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 p-2 text-left transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-slate-900">{r.nom}</p>
                  <p className="text-[10px] text-slate-500">
                    {r.type} ”¢ {r.heure}
                  </p>
                </div>
                <Chip className="bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                  {r.when}
                </Chip>
              </button>
            ))}
          </div>
        )}
      </SectionShell>
    </div>
  );
}


