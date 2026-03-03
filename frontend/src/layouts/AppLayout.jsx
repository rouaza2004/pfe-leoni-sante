import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FlaskConical,
  Bell,
  Boxes,
  Settings,
  ClipboardList,
  LogOut,
  Search,
} from "lucide-react";

import { getUserRole } from "../auth/auth";
import { Permission } from "../lib/permissions";

// ✅ logo: حط leoni-logo.png في src/assets/
import leoniLogo from "../assets/leoni-logo.png";

const getUserPermissions = () => {
  try {
    const raw = localStorage.getItem("permissions");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const hasPermission = (userPerms, required) => {
  if (!required) return true;
  return userPerms.includes(required);
};

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
  const role = getUserRole();
  const [q, setQ] = useState("");

  const userPerms = useMemo(() => getUserPermissions(), []);

  const navItems = useMemo(() => {
    const items = [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
      { to: "/collaborateurs", label: "Collaborateurs", icon: <Users size={18} />, permission: Permission.VIEW_COLLABORATEURS },
      { to: "/rdv", label: "Rendez-vous", icon: <Calendar size={18} />, permission: Permission.VIEW_RDV },
      { to: "/analyses", label: "Analyses", icon: <FlaskConical size={18} />, permission: Permission.VIEW_ANALYSES },
      { to: "/stock", label: "Stock", icon: <Boxes size={18} />, permission: Permission.VIEW_STOCK },
      { to: "/notifications", label: "Notifications", icon: <Bell size={18} />, permission: Permission.VIEW_NOTIFICATIONS },
      { to: "/audit", label: "Audit", icon: <ClipboardList size={18} />, permission: Permission.VIEW_AUDIT },
      { to: "/parametres", label: "Paramètres", icon: <Settings size={18} />, permission: Permission.VIEW_PARAMETRES },
    ];

    return items.filter((it) => hasPermission(userPerms, it.permission));
  }, [userPerms]);

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {/* ✅ LEONI LOGO */}
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden">
              <img
                src={leoniLogo}
                alt="LEONI"
                className="w-8 h-8 object-contain"
              />
            </div>

            <div>
              <p className="font-semibold leading-4">Health Management System</p>
              <p className="text-xs text-slate-400">LEONI</p>
            </div>
          </div>
        </div>

        <nav className="p-3 flex-1 space-y-1">
          {navItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
                  isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60"
                }`
              }
            >
              {it.icon}
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Utilisateur</p>
              <p className="text-xs text-slate-400">{roleLabel(role)}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-slate-800/60"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-3 w-full max-w-xl">
            <div className="relative w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-3 py-2 rounded-xl border bg-slate-50 outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl hover:bg-slate-100">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1.5">
                8
              </span>
            </button>

            {/* ✅ فقط Role label */}
            <div className="text-right">
              <p className="text-sm font-semibold">{roleLabel(role)}</p>
              <p className="text-xs text-slate-500">LEONI</p>
            </div>

            {/* ✅ Avatar بسيط بدون اسم */}
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-semibold">
              {roleLabel(role).split(" ").map(w => w[0]).slice(0,2).join("")}
            </div>
          </div>
        </header>

   <div className="p-6 max-w-6xl w-full">
  <Outlet />
</div>
      </main>
    </div>
  );
}