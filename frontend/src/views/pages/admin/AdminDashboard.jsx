import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BellRing,
  BriefcaseMedical,
  CalendarClock,
  CheckCircle2,
  Settings2,
  Shield,
  ShieldAlert,
  Stethoscope,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

const kpiCards = [
  {
    title: "UTILISATEURS",
    value: "8",
    icon: Users,
    iconStyle: "bg-cyan-50 text-cyan-700",
  },
  {
    title: "ACTIFS",
    value: "6",
    icon: Activity,
    iconStyle: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "MÉDECINS",
    value: "4",
    icon: Stethoscope,
    iconStyle: "bg-violet-50 text-violet-700",
  },
  {
    title: "INFIRMIERS",
    value: "3",
    icon: BriefcaseMedical,
    iconStyle: "bg-amber-50 text-amber-700",
  },
  {
    title: "EMPLOYÉS",
    value: "11",
    icon: UserCog,
    iconStyle: "bg-rose-50 text-rose-700",
  },
  {
    title: "VISITES",
    value: "6",
    icon: CalendarClock,
    iconStyle: "bg-cyan-50 text-cyan-700",
  },
];

const roleStats = [
  {
    label: "Admin",
    value: 2,
    percent: 25,
    bar: "bg-slate-700",
    track: "bg-slate-100",
  },
  {
    label: "RH",
    value: 2,
    percent: 25,
    bar: "bg-slate-700",
    track: "bg-slate-100",
  },
  {
    label: "Doctor",
    value: 2,
    percent: 25,
    bar: "bg-slate-700",
    track: "bg-slate-100",
  },
  {
    label: "Nurse",
    value: 2,
    percent: 25,
    bar: "bg-slate-700",
    track: "bg-slate-100",
  },
];

const appointmentOverview = [
  {
    value: "3",
    label: "En attente",
    icon: CalendarClock,
    iconStyle: "bg-amber-50 text-amber-700",
  },
  {
    value: "2",
    label: "Approuvés",
    icon: CheckCircle2,
    iconStyle: "bg-emerald-50 text-emerald-700",
  },
];

const quickActions = [
  {
    label: "Utilisateurs",
    icon: Users,
    iconStyle: "bg-cyan-50 text-cyan-700",
    path: "/admin/utilisateurs",
  },
  {
    label: "Rôles",
    icon: Shield,
    iconStyle: "bg-violet-50 text-violet-700",
    path: "/admin/roles-permissions",
  },
  {
    label: "Configuration",
    icon: Settings2,
    iconStyle: "bg-amber-50 text-amber-700",
    path: "/admin/parametres",
  },
  {
    label: "Audit",
    icon: ShieldAlert,
    iconStyle: "bg-rose-50 text-rose-700",
    path: "/admin/audit",
  },
];
const alerts = [
  {
    title: "3 rendez-vous en attente de validation",
    time: "Il y a 15 min",
    icon: BellRing,
    iconStyle: "bg-amber-50 text-amber-700",
  },
  {
    title: "Nouveau médecin inscrit",
    time: "Il y a 2h",
    icon: UserPlus,
    iconStyle: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Échec de connexion détecté",
    time: "Il y a 5h",
    icon: ShieldAlert,
    iconStyle: "bg-rose-50 text-rose-700",
  },
];
const recentActions = [
  {
    title: "Création utilisateur",
    meta: "Ahmed Benali · 2026-04-12 09:30",
    status: "Success",
    statusStyle: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    title: "Modification rôle",
    meta: "Sara Mansouri · 2026-04-12 08:50",
    status: "Success",
    statusStyle: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    title: "Suppression service",
    meta: "Ahmed Benali · 2026-04-11 17:00",
    status: "Warning",
    statusStyle: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  {
    title: "Réinitialisation MDP",
    meta: "Leila Bennani · 2026-04-11 15:20",
    status: "Success",
    statusStyle: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    title: "Connexion",
    meta: "Ahmed Benali · 2026-04-11 14:00",
    status: "Success",
    statusStyle: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
];

function scrollToSection(sectionId) {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function SurfaceCard({ id, title, action, children, className = "" }) {
  return (
    <section
      id={id}
      className={[
        "rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200",
        className,
      ].join(" ")}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function KpiCard({ title, value, icon: Icon, iconStyle }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
            iconStyle,
          ].join(" ")}
        >
          <Icon size={22} />
        </div>
      </div>
    </article>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const subtitle = useMemo(
    () => "Supervision de la plateforme · Dimanche 12 Avril 2026",
    [],
  );

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              <Shield size={13} />
              Centre de contrôle administrateur
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Bonjour Admin
            </h2>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>

          
        </div>
      </section>

      <section
        id="admin-kpis"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
      >
        {kpiCards.map((card) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.9fr_1fr]">
        <SurfaceCard id="admin-roles" title="Utilisateurs par Rôle">
          <div className="space-y-4">
            {roleStats.map((role) => (
              <div key={role.label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-700">{role.label}</span>
                  <span className="text-slate-500">
                    {role.value} ({role.percent}%)
                  </span>
                </div>
                <div className={["h-2 rounded-full", role.track].join(" ")}>
                  <div
                    className={["h-2 rounded-full", role.bar].join(" ")}
                    style={{ width: `${role.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Aperçu Rendez-vous">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {appointmentOverview.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-2xl",
                      item.iconStyle,
                    ].join(" ")}
                  >
                    <Icon size={20} />
                  </div>
                  <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                </article>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Accès Rapide">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className={[
                      "mb-3 flex h-9 w-9 items-center justify-center rounded-xl",
                      action.iconStyle,
                    ].join(" ")}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{action.label}</h3>
                  <div className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                    Ouvrir
                    <ArrowRight size={13} />
                  </div>
                </button>
              );
            })}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[0.92fr_1.08fr]">
        <SurfaceCard id="admin-alerts" title="Alertes & Notifications">
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <article
                  key={alert.title}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50"
                >
                  <div
                    className={[
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                      alert.iconStyle,
                    ].join(" ")}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{alert.time}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard
          id="admin-actions"
          title="Actions Récentes"
          action={
            <button
              type="button"
              className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
            >
              Voir tout
            </button>
          }
        >
          <div className="divide-y divide-slate-100">
            {recentActions.map((action) => (
              <article
                key={`${action.title}-${action.meta}`}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{action.meta}</p>
                </div>
                <span
                  className={[
                    "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                    action.statusStyle,
                  ].join(" ")}
                >
                  {action.status}
                </span>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}

