import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import logo from "../../assets/leoni-logo.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const roleRedirect = (role) => {
    switch (role) {
      case "ADMIN": return "/admin";
      case "MEDECIN_TRAITANT": return "/medecin-traitant";
      case "MEDECIN_TRAVAIL": return "/medecin-travail";
      case "MEDECIN_CONTROLEUR": return "/medecin-controleur";
      case "INFIRMIER": return "/infirmier";
      case "RESPONSABLE_RH": return "/rh";
      case "AGENT_HSEE": return "/hsee";
      default: return "/dashboard";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login/", { username, password });
      const { access, refresh } = res.data;
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      const meRes = await api.get("/api/me/");
      const role = meRes.data?.role;
      const uname = meRes.data?.username || username;

      localStorage.setItem("role", role || "");
      localStorage.setItem("username", uname);

      navigate(roleRedirect(role), { replace: true });
    } catch (error) {
      setErr(
        error?.response?.data?.detail ||
        "Login failed. Check username/password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen grid lg:grid-cols-[0.8fr_1.2fr]">

        {/* LEFT PANEL */}
        <div className="relative hidden lg:flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#123C6B] via-[#0F2F57] to-[#0A2545]" />

          <div className="relative z-10 max-w-md px-10 text-white flex flex-col justify-center">
            
            <img
              src={logo}
              alt="LEONI Logo"
              className="h-16 w-auto mb-6"
            />

            <h2 className="text-2xl font-semibold">
              Health Management System
            </h2>

            <p className="mt-2 text-white/70">
              Plateforme de Santé au Travail
            </p>

            <ul className="mt-8 space-y-3 text-white/90">
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
                Gestion des dossiers médicaux & suivi
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
                Planification & suivi des rendez-vous
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
                Stock médicaments & mouvements
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
                Dashboard KPI & alertes automatisées
              </li>
            </ul>

            <div className="mt-10 text-white/50 text-sm">
              Sécurisé — Accès par rôle (RBAC) — Multi-sites
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex items-center justify-center px-6 py-10 bg-gray-50">
          <div className="w-full max-w-xl">

            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-10 animate-fade-in">
              <h3 className="text-3xl font-bold text-gray-900">Connexion</h3>
              <p className="text-gray-500 mt-2">
                Accédez à votre espace de travail
              </p>

              {err && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {err}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Identifiant
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#123C6B]/20 focus:border-[#123C6B]"
                    placeholder="Entrez votre identifiant"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#123C6B]/20 focus:border-[#123C6B]"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full rounded-xl bg-[#123C6B] py-3 font-semibold text-white shadow-md hover:bg-[#0F2F57] transition duration-300 hover:scale-[1.02] disabled:opacity-70"
                >
                  {loading ? "Connexion..." : "Se connecter"}
                </button>
              </form>

              <p className="mt-8 text-center text-xs text-gray-400">
                © {new Date().getFullYear()} LEONI — Internal Platform
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}