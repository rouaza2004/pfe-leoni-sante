import { useMemo } from "react";
import {
  Activity,
  ArrowRight,
  BellRing,
  BriefcaseMedical,
  CalendarClock,
  CheckCircle2,
  LayoutGrid,
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
    accent: "border-b-sky-400",
    iconStyle: "bg-sky-100 text-sky-700",
  },
  {
    title: "ACTIFS",
    value: "6",
    icon: Activity,
    accent: "border-b-emerald-400",
    iconStyle: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "MÉDECINS",
    value: "4",
    icon: Stethoscope,
    accent: "border-b-violet-400",
    iconStyle: "bg-violet-100 text-violet-700",
  },
  {
    title: "INFIRMIERS",
    value: "3",
    icon: BriefcaseMedical,
    accent: "border-b-amber-400",
    iconStyle: "bg-amber-100 text-amber-700",
  },
  {
    title: "EMPLOYÉS",
    value: "11",
    icon: UserCog,
    accent: "border-b-rose-400",
    iconStyle: "bg-rose-100 text-rose-700",
  },
  {
    title: "VISITES",
    value: "6",
    icon: CalendarClock,
    accent: "border-b-cyan-400",
    iconStyle: "bg-cyan-100 text-cyan-700",
  },
];

const roleStats = [
  {
    label: "Admin",
    value: 2,
    percent: 25,
    bar: "bg-sky-500",
    track: "bg-sky-100",
  },
  {
    label: "RH",
    value: 2,
    percent: 25,
    bar: "bg-emerald-500",
    track: "bg-emerald-100",
  },
  {
    label: "Doctor",
    value: 2,
    percent: 25,
    bar: "bg-violet-500",
    track: "bg-violet-100",
  },
  {
    label: "Nurse",
    value: 2,
    percent: 25,
    bar: "bg-amber-500",
    track: "bg-amber-100",
  },
];

const appointmentOverview = [
  {
    value: "3",
    label: "En attente",
    icon: CalendarClock,
    panelStyle: "bg-amber-50 border-amber-200",
    iconStyle: "bg-amber-100 text-amber-700",
  },
  {
    value: "2",
    label: "Approuvés",
    icon: CheckCircle2,
    panelStyle: "bg-emerald-50 border-emerald-200",
    iconStyle: "bg-emerald-100 text-emerald-700",
  },
];

const quickActions = [
  {
    label: "Utilisateurs",
    icon: Users,
    iconStyle: "bg-sky-100 text-sky-700",
    onClickTarget: "admin-kpis",
  },
  {
    label: "Rôles",
    icon: Shield,
    iconStyle: "bg-violet-100 text-violet-700",
    onClickTarget: "admin-roles",
  },
  {
    label: "Configuration",
    icon: Settings2,
    iconStyle: "bg-amber-100 text-amber-700",
    onClickTarget: "admin-alerts",
  },
  {
    label: "Audit",
    icon: ShieldAlert,
    iconStyle: "bg-rose-100 text-rose-700",
    onClickTarget: "admin-actions",
  },
];

const alerts = [
  {
    title: "3 rendez-vous en attente de validation",
    time: "Il y a 15 min",
    icon: BellRing,
    iconStyle: "bg-amber-100 text-amber-700",
  },
  {
    title: "Nouveau médecin inscrit: Dr. Amina Fassi",
    time: "Il y a 2h",
    icon: UserPlus,
    iconStyle: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Échec de connexion détecté pour Omar Tazi",
    time: "Il y a 5h",
    icon: ShieldAlert,
    iconStyle: "bg-rose-100 text-rose-700",
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
        "rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50",
        className,
      ].join(" ")}
    >
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-4">
          {title ? <h2 className="text-base font-semibold text-slate-900">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function KpiCard({ title, value, icon: Icon, accent, iconStyle }) {
  return (
    <article
      className={[
        "rounded-[24px] border border-slate-200 border-b-4 bg-white p-4 shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-md",
        accent,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-[30px] font-semibold leading-none tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-2xl",
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
  const subtitle = useMemo(
    () => "Supervision de la plateforme · Dimanche 12 Avril 2026",
    []
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <LayoutGrid size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Administration
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Administration
          </h1>
        </div>
      </div>

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 shadow-sm shadow-slate-200/50 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 backdrop-blur">
              <Shield size={14} className="text-sky-700" />
              Centre de contrôle administrateur
            </span>
            <div>
              <h2 className="text-[30px] font-semibold tracking-tight text-slate-900 sm:text-[34px]">
                Bonjour Admin 👋
              </h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => scrollToSection("admin-actions")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ShieldAlert size={16} />
              Audit
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("admin-kpis")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              <UserPlus size={16} />
              Nouvel Utilisateur
            </button>
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

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.9fr_1fr]">
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
                <div className={["h-2.5 rounded-full", role.track].join(" ")}>
                  <div
                    className={["h-2.5 rounded-full", role.bar].join(" ")}
                    style={{ width: `${role.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Aperçu Rendez-vous">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {appointmentOverview.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.label}
                  className={[
                    "rounded-[24px] border p-5 shadow-sm",
                    item.panelStyle,
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-11 w-11 items-center justify-center rounded-2xl",
                      item.iconStyle,
                    ].join(" ")}
                  >
                    <Icon size={20} />
                  </div>
                  <p className="mt-5 text-[30px] font-semibold leading-none tracking-tight text-slate-900">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-600">{item.label}</p>
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
                  onClick={() => scrollToSection(action.onClickTarget)}
                  className="group rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
                >
                  <div
                    className={[
                      "flex h-11 w-11 items-center justify-center rounded-2xl",
                      action.iconStyle,
                    ].join(" ")}
                  >
                    <Icon size={20} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-900">{action.label}</p>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition group-hover:text-slate-700">
                    Ouvrir
                    <ArrowRight size={13} />
                  </div>
                </button>
              );
            })}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[0.92fr_1.08fr]">
        <SurfaceCard id="admin-alerts" title="Alertes & Notifications">
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <article
                  key={alert.title}
                  className="flex items-start gap-4 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div
                    className={[
                      "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
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
              className="text-sm font-medium text-sky-700 transition hover:text-sky-800"
            >
              Voir tout
            </button>
          }
        >
          <div className="divide-y divide-slate-200">
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
                    "inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ring-1",
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
