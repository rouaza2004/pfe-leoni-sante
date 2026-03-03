// src/lib/rbac.js
import { Permission } from "./permissions";

export const rolePermissions = {
  ADMIN: Object.values(Permission),

  INFIRMIER: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_COLLABORATEURS,
    Permission.VIEW_RDV,
    Permission.VIEW_ANALYSES,
    Permission.VIEW_STOCK,
    Permission.VIEW_NOTIFICATIONS,
    Permission.VIEW_DOSSIER_MEDICAL,
  ],

  MEDECIN_TRAVAIL: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_COLLABORATEURS,
    Permission.VIEW_RDV,
    Permission.VIEW_ANALYSES,
    Permission.VIEW_NOTIFICATIONS,
    Permission.VIEW_DOSSIER_MEDICAL,
  ],

  MEDECIN_TRAITANT: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_COLLABORATEURS,
    Permission.VIEW_RDV,
    Permission.VIEW_ANALYSES,
    Permission.VIEW_NOTIFICATIONS,
    Permission.VIEW_DOSSIER_MEDICAL,
  ],

  MEDECIN_CONTROLEUR: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_COLLABORATEURS,
    Permission.VIEW_ANALYSES,
    Permission.VIEW_NOTIFICATIONS,
    Permission.VIEW_DOSSIER_MEDICAL,
  ],

  RESPONSABLE_RH: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_COLLABORATEURS,
  ],

  AGENT_HSEE: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_AUDIT,
  ],
};