import { rolePermissions } from "./rbac";

export const hasPermission = (role, permission) => {
  const perms = rolePermissions[role] || [];
  return perms.includes(permission);
};