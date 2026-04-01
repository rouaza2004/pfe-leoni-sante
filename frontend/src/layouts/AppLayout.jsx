import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Boxes,
  Bell,
  LogOut,
  ShieldAlert,
  BarChart3,
  ClipboardList,
  FileText,
  Activity,
  FlaskConical,
  ShieldCheck,
  UserRoundSearch,
  Zap,
} from "lucide-react";

import { getUserRole, logout as doLogout } from "../auth/auth.js";
import leoniLogo from "../assets/leoni-logo.png";

const roleLabel = (role) => {
  switch (role) {
    case "ADMIN":
      return "Administrateur";
    case "MEDECIN_TRAITANT":
      return "Médecin Traitant";
    case "MEDECIN_TRAVAIL":
      return "Médecin du Travail";
    case "MEDECIN_CONTROLEUR":
      return "Médecin Contrôleur";
    case "INFIRMIER":
      return "Infirmier";
    case "RESPONSABLE_RH":
      return "Responsable RH";
    case "AGENT_HSEE":
      return "Agent HSEE";
    default:
      return role || "Utilisateur";
  }
};

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getUserRole();
  const [incidentsOpen, setIncidentsOpen] = useState(false);
  const [accidentsOpen, setAccidentsOpen] = useState(false);
  const incidentType = new URLSearchParams(location.search).get("type") || "with_bon";

  useEffect(() => {
    if (location.pathname.startsWith("/infirmier/incidents")) {
      setIncidentsOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (
      location.pathname.startsWith("/infirmier/accidents") ||
      location.pathname.startsWith("/bon-chauffeur") ||
      location.pathname.startsWith("/suivi-transferts")
    ) {
      setAccidentsOpen(true);
    }
  }, [location.pathname]);

  const homePath = useMemo(() => {
    switch (role) {
      case "ADMIN":
        return "/admin";
      case "MEDECIN_TRAITANT":
        return "/medecin-traitant";
      case "MEDECIN_TRAVAIL":
        return "/medecin-travail";
      case "MEDECIN_CONTROLEUR":
        return "/medecin-controleur";
      case "INFIRMIER":
        return "/infirmier";
      case "RESPONSABLE_RH":
        return "/rh";
      case "AGENT_HSEE":
        return "/hsee";
      default:
        return "/dashboard";
    }
  }, [role]);

  const navItems = useMemo(() => {
    const common = [
      { to: homePath, label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    ];

    if (role === "MEDECIN_TRAITANT") {
      return [
        ...common,
        {
          to: "/medecin-traitant/collaborateurs",
          label: "Collaborateurs",
          icon: <Users size={18} />,
        },
        {
          to: "/collaborateur-profile",
          label: "Profil collaborateur",
          icon: <UserRoundSearch size={18} />,
        },
        {
          to: "/medecin-traitant/rdv",
          label: "Rendez-vous",
          icon: <Calendar size={18} />,
        },
      ];
    }

    if (role === "MEDECIN_TRAVAIL") {
      return [
        ...common,
        {
          to: "/medecin-travail/collaborateurs",
          label: "Collaborateurs",
          icon: <Users size={18} />,
        },
        {
          to: "/medecin-travail/collaborateurs?target=dossier",
          label: "Dossiers médicaux",
          icon: <FileText size={18} />,
        },
        {
          to: "/medecin-travail/collaborateurs?target=examen-complementaire",
          label: "Examens complémentaires",
          icon: <Activity size={18} />,
        },
        {
          to: "/medecin-travail/collaborateurs?target=demande-analyse",
          label: "Analyses labo",
          icon: <FlaskConical size={18} />,
        },
        {
          to: "/medecin-travail/fiches-aptitude",
          label: "Fiches aptitude",
          icon: <ShieldCheck size={18} />,
        },
      ];
    }

    if (role === "MEDECIN_CONTROLEUR") {
      return [
        ...common,
        {
          to: "/collaborateur-profile",
          label: "Profil collaborateur",
          icon: <UserRoundSearch size={18} />,
        },
      ];
    }

    if (role === "INFIRMIER") {
      return [
        ...common,
        {
          to: "/infirmier/patients",
          label: "Patients",
          icon: <Users size={18} />,
        },
        {
          to: "/collaborateur-profile",
          label: "Profil collaborateur",
          icon: <UserRoundSearch size={18} />,
        },
        {
          type: "submenu",
          submenuKey: "incidents",
          label: "Incidents",
          icon: <Bell size={18} />,
          basePath: "/infirmier/incidents",
          children: [
            {
              to: "/infirmier/incidents?type=with_bon",
              label: "Incidents + Bon",
              icon: <FileText size={16} />,
              type: "with_bon",
            },
            {
              to: "/infirmier/incidents?type=without_bon",
              label: "Incidents sans Bon",
              icon: <Zap size={16} />,
              type: "without_bon",
            },
          ],
        },
        {
          type: "submenu",
          submenuKey: "accidents",
          label: "Accidents",
          icon: <ShieldAlert size={18} />,
          isActive: (loc) =>
            [
              "/infirmier/accidents",
              "/bon-chauffeur",
              "/suivi-transferts",
            ].some((path) => loc.pathname.startsWith(path)),
          children: [
            {
              to: "/infirmier/accidents",
              label: "Déclaration d'accident",
              icon: <FileText size={16} />,
              isActive: (loc) => loc.pathname.startsWith("/infirmier/accidents"),
            },
            {
              to: "/bon-chauffeur",
              label: "Bon Chauffeur",
              icon: <ClipboardList size={16} />,
              isActive: (loc) => loc.pathname.startsWith("/bon-chauffeur"),
            },
            {
              to: "/suivi-transferts",
              label: "Suivi des transferts",
              icon: <Activity size={16} />,
              isActive: (loc) => loc.pathname.startsWith("/suivi-transferts"),
            },
          ],
        },
        {
          to: "/infirmier/maladies-professionnelles",
          label: "Maladies pro.",
          icon: <FileText size={18} />,
        },
        {
          to: "/infirmier/stock",
          label: "Stock",
          icon: <Boxes size={18} />,
        },
        {
          to: "/dashboard-pharmacie",
          label: "Dashboard Pharmacie",
          icon: <BarChart3 size={18} />,
        },
        {
          to: "/infirmier/rdv",
          label: "Rendez-vous",
          icon: <Calendar size={18} />,
        },
      ];
    }

    if (role === "RESPONSABLE_RH") {
      return [
        ...common,
        {
          to: "/collaborateur-profile",
          label: "Profil collaborateur",
          icon: <UserRoundSearch size={18} />,
        },
      ];
    }

    if (role === "AGENT_HSEE") {
      return [
        ...common,
        {
          to: "/hsee",
          label: "Supervision",
          icon: <ShieldAlert size={18} />,
        },
        {
          to: "/hsee/statistiques",
          label: "Statistiques",
          icon: <BarChart3 size={18} />,
        },
        {
          to: "/hsee/plan-action",
          label: "Plan d'action",
          icon: <ClipboardList size={18} />,
        },
        {
          to: "/collaborateur-profile",
          label: "Profil collaborateur",
          icon: <UserRoundSearch size={18} />,
        },
        {
          type: "submenu",
          submenuKey: "incidents",
          label: "Incidents",
          icon: <Bell size={18} />,
          basePath: "/infirmier/incidents",
          children: [
            {
              to: "/infirmier/incidents?type=with_bon",
              label: "Incidents + Bon",
              icon: <FileText size={16} />,
              type: "with_bon",
            },
            {
              to: "/infirmier/incidents?type=without_bon",
              label: "Incidents sans Bon",
              icon: <Zap size={16} />,
              type: "without_bon",
            },
          ],
        },
        {
          type: "submenu",
          submenuKey: "accidents",
          label: "Accidents",
          icon: <ShieldAlert size={18} />,
          isActive: (loc) =>
            [
              "/infirmier/accidents",
              "/bon-chauffeur",
              "/suivi-transferts",
            ].some((path) => loc.pathname.startsWith(path)),
          children: [
            {
              to: "/infirmier/accidents",
              label: "Déclaration d'accident",
              icon: <FileText size={16} />,
              isActive: (loc) => loc.pathname.startsWith("/infirmier/accidents"),
            },
            {
              to: "/bon-chauffeur",
              label: "Bon Chauffeur",
              icon: <ClipboardList size={16} />,
              isActive: (loc) => loc.pathname.startsWith("/bon-chauffeur"),
            },
            {
              to: "/suivi-transferts",
              label: "Suivi des transferts",
              icon: <Activity size={16} />,
              isActive: (loc) => loc.pathname.startsWith("/suivi-transferts"),
            },
          ],
        },
        {
          to: "/infirmier/maladies-professionnelles",
          label: "Maladies pro.",
          icon: <FileText size={18} />,
        },
        {
          to: "/infirmier/stock",
          label: "Stock",
          icon: <Boxes size={18} />,
        },
        {
          to: "/infirmier/rdv",
          label: "Rendez-vous",
          icon: <Calendar size={18} />,
        },
        {
          to: "/medecin-travail/fiches-aptitude",
          label: "Fiches aptitude",
          icon: <ShieldCheck size={18} />,
        },
        {
          to: "/medecin-travail/collaborateurs",
          label: "Dossiers médicaux",
          icon: <FileText size={18} />,
        },
      ];
    }

    if (role === "ADMIN") {
      return [
        ...common,
        {
          to: "/collaborateur-profile",
          label: "Profil collaborateur",
          icon: <UserRoundSearch size={18} />,
        },
      ];
    }

    return common;
  }, [role, homePath]);

  const handleLogout = () => {
    doLogout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="flex w-64 flex-col bg-slate-900 text-slate-100">
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white">
              <img src={leoniLogo} alt="LEONI" className="h-8 w-8 object-contain" />
            </div>

            <div>
              <p className="font-semibold leading-4">Health Management System</p>
              <p className="text-xs text-slate-400">LEONI</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((it, index) => {
            if (it.type === "submenu") {
              const isParentActive = it.isActive
                ? it.isActive(location)
                : location.pathname.startsWith(it.basePath || "");
              const isAccidents = it.submenuKey === "accidents";
              const isIncidents = it.submenuKey === "incidents";
              const isOpen = isAccidents ? accidentsOpen : incidentsOpen;
              const setOpen = isAccidents ? setAccidentsOpen : setIncidentsOpen;
              return (
                <div key={`${it.label}-${index}`} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                      isParentActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800/60"
                    }`}
                  >
                    {it.icon}
                    <span>{it.label}</span>
                  </button>

                  {isOpen && (
                    <div className="space-y-1 pl-6">
                      {it.children?.map((child) => {
                        const isActive = child.isActive
                          ? child.isActive(location)
                          : isIncidents
                          ? location.pathname.startsWith(it.basePath || "") &&
                            incidentType === child.type
                          : location.pathname === child.to;
                        return (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            className={() =>
                              `flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition ${
                                isActive
                                  ? "bg-slate-800 text-white"
                                  : "text-slate-300 hover:bg-slate-800/60"
                              }`
                            }
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={`${it.to}-${index}`}
                to={it.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800/60"
                  }`
                }
              >
                {it.icon}
                <span>{it.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Utilisateur</p>
              <p className="text-xs text-slate-400">{roleLabel(role)}</p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg p-2 hover:bg-slate-800/60"
              title="Logout"
              type="button"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
