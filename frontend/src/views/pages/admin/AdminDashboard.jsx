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
    title: "MEDECINS",
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
    title: "EMPLOYES",
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
    label: "Approuves",
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
    label: "Roles",
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
    title: "Nouveau medecin inscrit",
    time: "Il y a 2h",
    icon: UserPlus,
    iconStyle: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Echec de connexion detecte",
    time: "Il y a 5h",
    icon: ShieldAlert,
    iconStyle: "bg-rose-50 text-rose-700",
  },
];

function StatCard({ title, value, icon: Icon, iconStyle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{title}</p>
          <p className="mt-1 text-[22px] font-bold leading-none text-slate-900">{value}</p>
          <p className="mt-1 text-[10px] text-slate-400">Indicateur admin</p>
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, icon: Icon, iconStyle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg ${iconStyle}`}>
        <Icon size={15} />
      </div>
      <h3 className="text-[13px] font-semibold leading-tight text-slate-900">{label}</h3>
      <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] leading-snug text-slate-500">
        Ouvrir
        <ArrowRight size={11} />
      </p>
    </button>
  );
}

function SectionShell({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="text-[10px] text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const subtitle = useMemo(
    () => "Supervision de la plateforme - Dimanche 12 Avril 2026",
    [],
  );

  return (
    <div className="space-y-2">
      <div className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Shield size={13} />
          Centre de controle administrateur
        </p>
        <h1 className="mt-0.5 text-[22px] font-bold tracking-tight text-slate-900">
          Bonjour Admin
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
        {kpiCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <SectionShell title="Acces rapide" subtitle="Acces direct aux modules administrateur">
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <QuickAction
              key={action.label}
              {...action}
              onClick={() => navigate(action.path)}
            />
          ))}
        </div>
      </SectionShell>

      <div className="grid gap-2 xl:grid-cols-[1fr_0.9fr_1fr]">
        <SectionShell title="Utilisateurs par role" subtitle="Distribution des comptes">
          <div className="space-y-3">
            {roleStats.map((role) => (
              <div key={role.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-medium text-slate-700">{role.label}</span>
                  <span className="text-slate-500">
                    {role.value} ({role.percent}%)
                  </span>
                </div>
                <div className={`h-2 rounded-full ${role.track}`}>
                  <div className={`h-2 rounded-full ${role.bar}`} style={{ width: `${role.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell title="Apercu rendez-vous" subtitle="Statut des demandes">
          <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {appointmentOverview.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.iconStyle}`}>
                    <Icon size={16} />
                  </div>
                  <p className="mt-2 text-[22px] font-bold leading-none text-slate-900">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.label}</p>
                </div>
              );
            })}
          </div>
        </SectionShell>

        <SectionShell title="Alertes & notifications" subtitle="Derniers signaux">
          <div className="space-y-1.5">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div key={alert.title} className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-2">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${alert.iconStyle}`}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-900">{alert.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{alert.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionShell>
      </div>
    </div>
  );
}
