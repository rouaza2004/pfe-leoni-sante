import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { getUserRole, logout as doLogout } from "../auth/auth.js";
import { isAdminReadOnlyPath } from "../auth/readOnlyAccess.js";
import AppSidebar from "../components/layout/AppSidebar.jsx";
import { getSidebarSections, roleLabel } from "./sidebarConfig.jsx";

const SIDEBAR_EXPANDED_CLASS = "lg:ml-56 xl:ml-60";
const SIDEBAR_COLLAPSED_CLASS = "lg:ml-16";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getUserRole();

  const storageKey = `sidebar-collapsed:${role || "default"}`;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return window.localStorage.getItem(storageKey) === "true";
  });
  const [submenuOpen, setSubmenuOpen] = useState({
    incidents: false,
    accidents: false,
  });

  const incidentType = new URLSearchParams(location.search).get("type") || "with_bon";
  const sidebarSections = useMemo(() => getSidebarSections(role), [role]);
  const isAdminReadOnly = isAdminReadOnlyPath(location.pathname, role);

  useEffect(() => {
    window.localStorage.setItem(storageKey, String(isSidebarCollapsed));
  }, [isSidebarCollapsed, storageKey]);

  useEffect(() => {
    if (location.pathname.startsWith("/infirmier/incidents")) {
      setSubmenuOpen((prev) => ({ ...prev, incidents: true }));
    }
  }, [location.pathname]);

  useEffect(() => {
    if (
      location.pathname.startsWith("/infirmier/accidents") ||
      location.pathname.startsWith("/infirmier/enquete-initiale") ||
      location.pathname.startsWith("/infirmier/transmission-enquetes-hsee") ||
      location.pathname.startsWith("/bon-chauffeur") ||
      location.pathname.startsWith("/suivi-transferts")
    ) {
      setSubmenuOpen((prev) => ({ ...prev, accidents: true }));
    }
  }, [location.pathname]);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((current) => !current);
  };

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
        {isAdminReadOnly ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
            Mode administrateur lecture seule sur cet espace.
          </div>
        ) : null}
        <div className="p-4 xl:p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
