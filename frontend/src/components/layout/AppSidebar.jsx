import { ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import leoniLogo from "../../assets/leoni-logo.png";

const itemBaseClass =
  "group flex w-full items-center rounded-2xl text-sm font-medium transition-all duration-200";

const itemStateClass = (isActive) =>
  isActive
    ? "bg-slate-800 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
    : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100";

function SidebarNavLink({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          itemBaseClass,
          itemStateClass(isActive),
          collapsed ? "justify-center px-3 py-2.5" : "gap-3 px-3.5 py-2.5",
        ].join(" ")
      }
    >
      <span className="shrink-0 text-current">{item.icon}</span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </NavLink>
  );
}

function SidebarSubmenu({
  item,
  collapsed,
  isOpen,
  onToggle,
  isParentActive,
  location,
  incidentType,
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? item.label : undefined}
        className={[
          itemBaseClass,
          itemStateClass(isParentActive),
          collapsed ? "justify-center px-3 py-2.5" : "gap-3 px-3.5 py-2.5",
        ].join(" ")}
      >
        <span className="shrink-0 text-current">{item.icon}</span>
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
            <ChevronDown
              size={16}
              className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </>
        ) : null}
      </button>

      {isOpen && !collapsed ? (
        <div className="ml-4 space-y-1 border-l border-slate-800/90 pl-3.5">
          {item.children?.map((child) => {
            const isActive = child.isActive
              ? child.isActive(location)
              : item.submenuKey === "incidents"
              ? location.pathname.startsWith(item.basePath || "") && incidentType === child.type
              : location.pathname === child.to;

            return (
              <NavLink
                key={child.to}
                to={child.to}
                className={() =>
                  [
                    itemBaseClass,
                    itemStateClass(isActive),
                    "gap-2.5 px-3 py-2 text-xs",
                  ].join(" ")
                }
              >
                <span className="shrink-0 text-current">{child.icon}</span>
                <span className="truncate">{child.label}</span>
              </NavLink>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function AppSidebar({
  sections,
  collapsed,
  onToggleCollapse,
  onLogout,
  roleTitle,
  appLabel = "Health Management System",
  location,
  incidentType,
  submenuState,
}) {
  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="border-b border-slate-800 px-5 py-5">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
            <img src={leoniLogo} alt="LEONI" className="h-8 w-8 object-contain" />
          </div>

          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-5 text-white">LEONI</p>
              <p className="truncate text-xs text-slate-400">{appLabel}</p>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-3">
          {sections.map((section, sectionIndex) => (
            <div key={`section-${sectionIndex}`} className="space-y-1">
              {!collapsed && section.title ? (
                <p className="px-3.5 pb-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {section.title}
                </p>
              ) : null}

              {section.items.map((item, itemIndex) => {
                if (item.type === "submenu") {
                  const isParentActive = item.isActive
                    ? item.isActive(location)
                    : location.pathname.startsWith(item.basePath || "");
                  const isOpen = Boolean(submenuState[item.submenuKey]);

                  return (
                    <SidebarSubmenu
                      key={`${item.submenuKey}-${itemIndex}`}
                      item={item}
                      collapsed={collapsed}
                      isOpen={isOpen}
                      onToggle={() => submenuState.setOpen(item.submenuKey)}
                      isParentActive={isParentActive}
                      location={location}
                      incidentType={incidentType}
                    />
                  );
                }

                return <SidebarNavLink key={`${item.to}-${itemIndex}`} item={item} collapsed={collapsed} />;
              })}
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-800 px-4 py-4">
        <div className={`flex ${collapsed ? "flex-col items-center gap-3" : "items-center justify-between gap-3"}`}>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">Utilisateur</p>
              <p className="truncate text-xs text-slate-400">{roleTitle}</p>
            </div>
          ) : null}

          <div className={`flex items-center ${collapsed ? "w-full flex-col gap-2" : "gap-2"}`}>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl p-2.5 text-slate-200 transition hover:bg-slate-800/60 hover:text-white"
              title="Déconnexion"
            >
              <LogOut size={18} />
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded-xl p-2.5 text-slate-200 transition hover:bg-slate-800/60 hover:text-white"
              title={collapsed ? "Développer la barre latérale" : "Réduire la barre latérale"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
