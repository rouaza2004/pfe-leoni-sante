import { Outlet, useLocation, useNavigate } from "react-router-dom";
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
  Zap,
  Clock,
  UserRoundSearch,
} from "lucide-react";

import { getUserRole, logout as doLogout } from "@/auth/auth";
import { isAdminReadOnlyPath } from "@/auth/readOnlyAccess";
import AppSidebar from "../components/layout/AppSidebar.jsx";
import { getSidebarSections, roleLabel } from "./sidebarConfig.jsx";

const SIDEBAR_EXPANDED_CLASS = "lg:ml-56 xl:ml-60";
const SIDEBAR_COLLAPSED_CLASS = "lg:ml-16";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getUserRole();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const storageKey = `sidebar-collapsed:${getUserRole() || "default"}`;
    return window.localStorage.getItem(storageKey) === "true";
  });
  const [incidentsOpen, setIncidentsOpen] = useState(false);
  const [accidentsOpen, setAccidentsOpen] = useState(false);
  const [mpOpen, setMpOpen] = useState(false);
  const [cnamOpen, setCnamOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState({
    incidents: false,
    accidents: false,
    mp: false,
    cnam: false,
  });
  const incidentType = new URLSearchParams(location.search).get("type") || "with_bon";
  const incidentsRouteActive = location.pathname.startsWith("/infirmier/incidents");
  const accidentsRouteActive =
    location.pathname.startsWith("/infirmier/accidents") ||
    location.pathname.startsWith("/bon-chauffeur") ||
    location.pathname.startsWith("/suivi-transferts");
  const isAdminReadOnly = isAdminReadOnlyPath(location.pathname, role);
  const currentDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  useEffect(() => {
    if (location.pathname.startsWith("/infirmier/incidents")) {
      setSubmenuOpen((prev) => ({ ...prev, incidents: true }));
    }
  }, [location.pathname]);

  useEffect(() => {
    if (
      location.pathname.startsWith("/infirmier/accidents") ||
      location.pathname.startsWith("/infirmier/enquete-initiale") ||
      location.pathname.startsWith("/bon-chauffeur") ||
      location.pathname.startsWith("/suivi-transferts")
    ) {
      setSubmenuOpen((prev) => ({ ...prev, accidents: true }));
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

  const sidebarSections = useMemo(() => getSidebarSections(role), [role]);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      const storageKey = `sidebar-collapsed:${getUserRole() || "default"}`;
      window.localStorage.setItem(storageKey, String(next));
      return next;
    });
  };

  const navItems = useMemo(() => {
    const dashboardLabel = role === "MEDECIN_CONTROLEUR" ? "Tableau de bord" : "Dashboard";
    const common = [
      { to: homePath, label: dashboardLabel, icon: <LayoutDashboard size={18} /> },
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
          label: "Dossiers m\u00E9dicaux",
          icon: <FileText size={18} />,
        },
        {
          to: "/medecin-travail/rdv",
          label: "Rendez-vous",
          icon: <Calendar size={18} />,
        },
        {
          to: "/medecin-travail/collaborateurs?target=examen-complementaire",
          label: "Examens compl\u00E9mentaires",
          icon: <Activity size={18} />,
        },
        {
          to: "/medecin-travail/analyses-labo",
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
          to: "/medecin-controleur/recherche",
          label: "Recherche collaborateur",
          icon: <Users size={18} />,
        },
        {
          to: "/medecin-controleur/controle-medical",
          label: "Contrôle médical",
          icon: <FileText size={18} />,
        },
        {
          to: "/medecin-controleur/demande-expertise",
          label: "Demande d'expertise",
          icon: <ClipboardList size={18} />,
        },
        {
          to: "/medecin-controleur/historique",
          label: "Historique",
          icon: <FileText size={18} />,
        },
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
          to: "/pointage",
          label: "Pointage",
          icon: <Clock size={18} />,
        },
        {
          to: "/infirmier/patients",
          label: "Patients",
          icon: <Users size={18} />,
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
              "/infirmier/enquete-initiale",
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
              to: "/infirmier/enquete-initiale",
              label: "Enquête initiale",
              icon: <FileText size={16} />,
              isActive: (loc) => loc.pathname.startsWith("/infirmier/enquete-initiale"),
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
          to: "/rh/absences-ponctualite",
          label: "Absences & ponctualité",
          icon: <BarChart3 size={18} />,
        },
        {
          to: "/rh/nouveaux-operateurs",
          label: "Nouveaux opérateurs",
          icon: <Users size={18} />,
        },
        {
          to: "/rh/pointage-medecins",
          label: "Pointage médecins",
          icon: <Clock size={18} />,
        },
        {
          to: "/rh/rapports",
          label: "Rapports RH",
          icon: <FileText size={18} />,
        },
      ];
    }

    if (role === "AGENT_HSEE") {
      return [
        ...common,
        {
          to: "/pointage",
          label: "Pointage",
          icon: <Clock size={18} />,
        },
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
              "/infirmier/enquete-initiale",
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
              to: "/infirmier/enquete-initiale",
              label: "Enquête initiale",
              icon: <FileText size={16} />,
              isActive: (loc) => loc.pathname.startsWith("/infirmier/enquete-initiale"),
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
          to: "/pointage",
          label: "Pointage",
          icon: <Clock size={18} />,
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
    <div className="min-h-screen bg-slate-50">
      <AppSidebar
        sections={sidebarSections}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onLogout={handleLogout}
        roleTitle={roleLabel(role)}
        location={location}
        incidentType={incidentType}
        submenuState={{
          ...submenuOpen,
          setOpen: (key) =>
            setSubmenuOpen((prev) => ({
              ...prev,
              [key]: !prev[key],
            })),
        }}
      />

      <main
        className={`min-h-screen min-w-0 overflow-x-hidden transition-[margin] duration-300 ${
          isSidebarCollapsed ? SIDEBAR_COLLAPSED_CLASS : SIDEBAR_EXPANDED_CLASS
        }`}
      >
        <div className="p-4 xl:p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


