import { useState } from "react";
import {
  BriefcaseBusiness,
  HeartPulse,
  Shield,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

const roleCards = [
  {
    key: "admin",
    name: "Admin",
    description: "Acces complet a la plateforme",
    icon: ShieldCheck,
    iconStyle: "bg-sky-100 text-sky-700",
  },
  {
    key: "rh",
    name: "RH",
    description: "Gestion du personnel et recrutement",
    icon: BriefcaseBusiness,
    iconStyle: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "doctor",
    name: "Doctor",
    description: "Consultations et dossiers medicaux",
    icon: Stethoscope,
    iconStyle: "bg-amber-100 text-amber-700",
  },
  {
    key: "nurse",
    name: "Nurse",
    description: "Soins infirmiers et suivi patients",
    icon: HeartPulse,
    iconStyle: "bg-blue-100 text-blue-700",
  },
  {
    key: "hsee",
    name: "HSEE",
    description: "Supervision HSEE et acces global a la plateforme",
    icon: Shield,
    iconStyle: "bg-violet-100 text-violet-700",
  },
];

const modules = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Gestion Utilisateurs" },
  { key: "personnel", label: "Gestion Personnel" },
  { key: "appointments", label: "Rendez-vous" },
  { key: "medical", label: "Services Medicaux" },
  { key: "roles", label: "Roles & Permissions" },
  { key: "settings", label: "Configuration Systeme" },
  { key: "audit", label: "Journaux d'Audit" },
  { key: "collaborators", label: "Collaborateurs" },
  { key: "medicalRecords", label: "Dossiers medicaux" },
  { key: "workAccidents", label: "Accidents de travail" },
  { key: "incidents", label: "Incidents" },
  { key: "occupationalDiseases", label: "Maladies professionnelles" },
  { key: "pharmacyStock", label: "Stock pharmacie" },
  { key: "reports", label: "Rapports" },
  { key: "dashboards", label: "Tableaux de bord" },
  { key: "notifications", label: "Notifications" },
];

const initialPermissions = {
  dashboard: { admin: true, rh: true, doctor: true, nurse: true, hsee: true },
  users: { admin: true, rh: true, doctor: false, nurse: false, hsee: true },
  personnel: { admin: true, rh: true, doctor: false, nurse: false, hsee: true },
  appointments: { admin: true, rh: true, doctor: true, nurse: true, hsee: true },
  medical: { admin: true, rh: false, doctor: true, nurse: false, hsee: true },
  roles: { admin: true, rh: false, doctor: false, nurse: false, hsee: true },
  settings: { admin: true, rh: false, doctor: false, nurse: false, hsee: true },
  audit: { admin: true, rh: false, doctor: false, nurse: false, hsee: true },
  collaborators: { admin: true, rh: true, doctor: false, nurse: false, hsee: true },
  medicalRecords: { admin: true, rh: false, doctor: true, nurse: false, hsee: true },
  workAccidents: { admin: true, rh: false, doctor: true, nurse: true, hsee: true },
  incidents: { admin: true, rh: false, doctor: true, nurse: true, hsee: true },
  occupationalDiseases: { admin: true, rh: false, doctor: true, nurse: true, hsee: true },
  pharmacyStock: { admin: true, rh: false, doctor: false, nurse: true, hsee: true },
  reports: { admin: true, rh: true, doctor: true, nurse: false, hsee: true },
  dashboards: { admin: true, rh: true, doctor: true, nurse: true, hsee: true },
  notifications: { admin: true, rh: true, doctor: true, nurse: true, hsee: true },
};

const badgeStyles = {
  admin: "bg-sky-50 text-sky-700 ring-sky-200",
  rh: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  doctor: "bg-amber-50 text-amber-700 ring-amber-200",
  nurse: "bg-blue-50 text-blue-700 ring-blue-200",
  hsee: "bg-violet-50 text-violet-700 ring-violet-200",
};

function RoleCard({ name, description, icon: Icon, iconStyle }) {
  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-start gap-4">
        <div
          className={[
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            iconStyle,
          ].join(" ")}
        >
          <Icon size={22} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{name}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </article>
  );
}

function PermissionToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={[
        "relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200",
        checked ? "bg-sky-600" : "bg-slate-200",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

export default function RolesPermissions() {
  const [permissions, setPermissions] = useState(initialPermissions);

  function handleToggle(moduleKey, roleKey) {
    setPermissions((current) => ({
      ...current,
      [moduleKey]: {
        ...current[moduleKey],
        [roleKey]: !current[moduleKey][roleKey],
      },
    }));
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <Shield size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
            Roles & Permissions
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Gerez les droits d&apos;acces de chaque role sur la plateforme
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {roleCards.map((role) => (
          <RoleCard key={role.key} {...role} />
        ))}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Matrice des Permissions</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[880px]">
            <div className="grid grid-cols-[1.7fr_repeat(5,minmax(110px,1fr))] items-center gap-4 rounded-[22px] bg-slate-50/90 px-5 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Module
              </div>

              {roleCards.map((role) => (
                <div key={role.key} className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {role.name}
                  </p>
                  <span
                    className={[
                      "mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1",
                      badgeStyles[role.key],
                    ].join(" ")}
                  >
                    {role.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-[24px] border border-slate-200">
              {modules.map((module) => (
                <div
                  key={module.key}
                  className="grid grid-cols-[1.7fr_repeat(5,minmax(110px,1fr))] items-center gap-4 bg-white px-5 py-4 transition hover:bg-slate-50/60"
                >
                  <div className="text-sm font-medium text-slate-700">{module.label}</div>

                  {roleCards.map((role) => (
                    <div key={`${module.key}-${role.key}`} className="flex justify-center">
                      <PermissionToggle
                        checked={permissions[module.key][role.key]}
                        onChange={() => handleToggle(module.key, role.key)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
