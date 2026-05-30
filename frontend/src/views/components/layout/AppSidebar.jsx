import { ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import leoniLogo from "../../assets/leoni-logo.png";

const itemBaseClass =
  "group flex w-full items-center rounded-xl text-[13px] font-medium transition-all duration-200";

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
          collapsed ? "justify-center px-2.5 py-2" : "gap-2.5 px-3 py-2",
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
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? item.label : undefined}
        className={[
          itemBaseClass,
          itemStateClass(isParentActive),
          collapsed ? "justify-center px-2.5 py-2" : "gap-2.5 px-3 py-2",
        ].join(" ")}
      >
        <span className="shrink-0 text-current">{item.icon}</span>
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
            <ChevronDown
              size={15}
              className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </>
        ) : null}
      </button>

      {isOpen && !collapsed ? (
        <div className="ml-3 space-y-0.5 border-l border-slate-800/90 pl-2.5">
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
                  [itemBaseClass, itemStateClass(isActive), "gap-2 px-2.5 py-1.5 text-[11px]"].join(" ")
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
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-800 bg-slate-900 text-slate-100 transition-all duration-300 ${
        collapsed ? "w-16" : "w-56 xl:w-60"
      }`}
    >
      <div className="border-b border-slate-800 px-4 py-4">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
            <img src={leoniLogo} alt="LEONI" className="h-7 w-7 object-contain" />
          </div>

          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-4 text-white">LEONI</p>
              <p className="truncate text-xs text-slate-400">{appLabel}</p>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        <div className="space-y-2">
          {sections.map((section, sectionIndex) => (
            <div key={`section-${sectionIndex}`} className="space-y-0.5">
              {!collapsed && section.title ? (
                <p className="px-3 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
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

                return (
                  <SidebarNavLink
                    key={`${item.to}-${itemIndex}`}
                    item={item}
                    collapsed={collapsed}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      <div className="mt-auto border-t border-slate-800 px-3 py-3">
        <div className={`flex ${collapsed ? "flex-col items-center gap-2" : "items-center justify-between gap-2"}`}>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">Utilisateur</p>
              <p className="truncate text-xs text-slate-400">{roleTitle}</p>
            </div>
          ) : null}

          <div className={`flex items-center ${collapsed ? "w-full flex-col gap-1.5" : "gap-1.5"}`}>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg p-2 text-slate-200 transition hover:bg-slate-800/60 hover:text-white"
              title={"D\u00e9connexion"}
            >
              <LogOut size={17} />
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded-lg p-2 text-slate-200 transition hover:bg-slate-800/60 hover:text-white"
              title={collapsed ? "D\u00e9velopper la barre lat\u00e9rale" : "R\u00e9duire la barre lat\u00e9rale"}
            >
              {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

