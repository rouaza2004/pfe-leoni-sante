import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Boxes,
  BriefcaseMedical,
  Building2,
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  FlaskConical,
  LayoutDashboard,
  LayoutGrid,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Users,
  UserRound,
  Zap,
} from "lucide-react";

export const roleLabel = (role) => {
  switch (role) {
    case "ADMIN":
      return "Administrateur";
    case "MEDECIN_TRAITANT":
      return "Médecin traitant";
    case "MEDECIN_TRAVAIL":
      return "Médecin du travail";
    case "MEDECIN_CONTROLEUR":
      return "Médecin contrôleur";
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

export const getHomePath = (role) => {
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
};

const incidentsSubmenu = {
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
};

const accidentsSubmenu = {
  type: "submenu",
  submenuKey: "accidents",
  label: "Accidents",
  icon: <ShieldAlert size={18} />,
  isActive: (location) =>
    [
      "/infirmier/accidents",
      "/infirmier/enquete-initiale",
      "/infirmier/transmission-enquetes-hsee",
      "/bon-chauffeur",
      "/suivi-transferts",
    ].some((path) => location.pathname.startsWith(path)),
  children: [
    {
      to: "/infirmier/accidents",
      label: "Déclaration d'accident",
      icon: <FileText size={16} />,
      isActive: (location) => location.pathname.startsWith("/infirmier/accidents"),
    },
    {
      to: "/infirmier/enquete-initiale",
      label: "Enquête initiale",
      icon: <FileText size={16} />,
      isActive: (location) => location.pathname.startsWith("/infirmier/enquete-initiale"),
    },
    {
      to: "/infirmier/transmission-enquetes-hsee",
      label: "Transmission HSEE",
      icon: <Activity size={16} />,
      isActive: (location) =>
        location.pathname.startsWith("/infirmier/transmission-enquetes-hsee"),
    },
    {
      to: "/bon-chauffeur",
      label: "Bon Chauffeur",
      icon: <ClipboardList size={16} />,
      isActive: (location) => location.pathname.startsWith("/bon-chauffeur"),
    },
    {
      to: "/suivi-transferts",
      label: "Suivi des transferts",
      icon: <Activity size={16} />,
      isActive: (location) => location.pathname.startsWith("/suivi-transferts"),
    },
  ],
};

export const getSidebarSections = (role) => {
  const homePath = getHomePath(role);
  const dashboardLabel =
    role === "ADMIN"
      ? "Dashboard"
      : role === "MEDECIN_CONTROLEUR"
      ? "Tableau de bord"
      : "Dashboard";
  const dashboardIcon = role === "ADMIN" ? <LayoutGrid size={18} /> : <LayoutDashboard size={18} />;
  const dashboardItem = {
    to: homePath,
    label: dashboardLabel,
    icon: dashboardIcon,
    end: true,
  };
  const assistantItem = {
    to: "/assistant-ia",
    label: "Assistant IA",
    icon: <Brain size={18} />,
  };

  switch (role) {
    case "ADMIN":
      return [
        {
          items: [
            dashboardItem,
            assistantItem,
            {
              to: "/admin/utilisateurs",
              label: "Utilisateurs",
              icon: <Users size={18} />,
              end: true,
            },
            {
              to: "/admin/services",
              label: "Services",
              icon: <BriefcaseMedical size={18} />,
              end: true,
            },
            {
              to: "/admin/sites",
              label: "Sites",
              icon: <Building2 size={18} />,
              end: true,
            },
          ],
        },
        {
          title: "Espaces métier",
          items: [
            {
              to: "/rh",
              label: "Espace RH",
              icon: <BarChart3 size={18} />,
              end: true,
            },
            {
              to: "/medecin-traitant",
              label: "Médecin traitant",
              icon: <Stethoscope size={18} />,
              end: true,
            },
            {
              to: "/medecin-travail",
              label: "Médecin du travail",
              icon: <Stethoscope size={18} />,
              end: true,
            },
            {
              to: "/medecin-controleur",
              label: "Médecin contrôleur",
              icon: <Stethoscope size={18} />,
              end: true,
            },
            {
              to: "/infirmier",
              label: "Espace Infirmiers",
              icon: <Users size={18} />,
              end: true,
            },
          ],
        },
        {
          title: "Administration",
          items: [
            {
              to: "/admin/roles-permissions",
              label: "Rôles & Permissions",
              icon: <ShieldCheck size={18} />,
              end: true,
            },
            {
              to: "/admin/audit",
              label: "Audit",
              icon: <FileText size={18} />,
              end: true,
            },
            {
              to: "/admin/parametres",
              label: "Paramètres",
              icon: <Settings size={18} />,
              end: true,
            },
            {
              to: "/admin/pointage",
              label: "Pointage",
              icon: <Clock size={18} />,
              end: true,
            },
          ],
        },
      ];
    case "MEDECIN_TRAITANT":
      return [
        {
          items: [
            dashboardItem,
            assistantItem,
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
            {
              to: "/medecin-traitant/notifications",
              label: "Notifications",
              icon: <Bell size={18} />,
            },
          ],
        },
      ];
    case "MEDECIN_TRAVAIL":
      return [
        {
          items: [
            dashboardItem,
            assistantItem,
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
              to: "/medecin-travail/rdv",
              label: "Rendez-vous",
              icon: <Calendar size={18} />,
            },
            {
              to: "/medecin-travail/collaborateurs?target=examen-complementaire",
              label: "Examens complémentaires",
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
          ],
        },
      ];
    case "MEDECIN_CONTROLEUR":
      return [
        {
          items: [
            dashboardItem,
            assistantItem,
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
              to: "/medecin-controleur/notifications",
              label: "Notifications",
              icon: <Bell size={18} />,
            },
            {
              to: "/collaborateur-profile",
              label: "Profil collaborateur",
              icon: <UserRound size={18} />,
            },
          ],
        },
      ];
    case "INFIRMIER":
      return [
        {
          items: [
            dashboardItem,
            assistantItem,
            {
              to: "/infirmier/pointage-medecins",
              label: "Pointage médecin",
              icon: <Clock size={18} />,
            },
            {
              to: "/infirmier/patients",
              label: "Patients",
              icon: <Users size={18} />,
            },
            incidentsSubmenu,
            accidentsSubmenu,
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
              label: "Dashboard pharmacie",
              icon: <BarChart3 size={18} />,
            },
            {
              to: "/infirmier/rdv",
              label: "Rendez-vous",
              icon: <Calendar size={18} />,
            },
          ],
        },
      ];
    case "RESPONSABLE_RH":
      return [
        {
          items: [
            dashboardItem,
            assistantItem,
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
          ],
        },
      ];
    case "AGENT_HSEE":
      return [
        {
          items: [
            dashboardItem,
            assistantItem,
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
              to: "/hsee/enquete-at",
              label: "Enquete HSEE",
              icon: <FileText size={18} />,
            },
            {
              to: "/hsee/enquetes-recues",
              label: "Enquetes recues",
              icon: <Bell size={18} />,
            },
            {
              to: "/hsee/historique-enquetes",
              label: "Historique enquetes",
              icon: <ClipboardList size={18} />,
            },
            {
              to: "/hsee/cartographie-risques",
              label: "Cartographie des risques",
              icon: <ShieldCheck size={18} />,
            },
            {
              to: "/hsee/rapports",
              label: "Rapports",
              icon: <FileText size={18} />,
            },
            incidentsSubmenu,
            accidentsSubmenu,
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
          ],
        },
      ];
    default:
      return [{ items: [dashboardItem] }];
  }
};

