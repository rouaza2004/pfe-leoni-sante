import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { api } from "@/api/api";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "RESPONSABLE_RH", label: "RH" },
  { value: "AGENT_HSEE", label: "HSEE" },
  { value: "INFIRMIER", label: "Infirmier" },
  { value: "MEDECIN_TRAVAIL", label: "Médecin du travail" },
  { value: "MEDECIN_TRAITANT", label: "Médecin traitant" },
  { value: "MEDECIN_CONTROLEUR", label: "Médecin contrôleur" },
];

const roleLabelMap = Object.fromEntries(ROLE_OPTIONS.map((role) => [role.value, role.label]));

const emptyForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  telephone: "",
  date_naissance: "",
  site_id: "",
  role: "ADMIN",
  is_active: true,
};

const roleBadgeStyles = {
  ADMIN: "bg-sky-50 text-sky-700",
  RESPONSABLE_RH: "bg-emerald-50 text-emerald-700",
  AGENT_HSEE: "bg-cyan-50 text-cyan-700",
  INFIRMIER: "bg-blue-50 text-blue-700",
  MEDECIN_TRAVAIL: "bg-amber-50 text-amber-700",
  MEDECIN_TRAITANT: "bg-violet-50 text-violet-700",
  MEDECIN_CONTROLEUR: "bg-rose-50 text-rose-700",
};

const feedbackStyles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

const StatCard = ({ title, value, subtitle, icon, alert = false, iconClass = "" }) => (
  <div
    className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
      alert ? "border-red-200" : "border-slate-200"
    }`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`mt-2 text-2xl font-bold ${alert ? "text-red-600" : "text-slate-900"}`}>
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
          alert ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"
        } ${iconClass}`}
      >
        {icon}
      </div>
    </div>
  </div>
);

function getInitials(fullName) {
  if (!fullName) return "-";

  return fullName
    .replace(/\./g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDateTime(value) {
  if (!value) return "Jamais";

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDate(value) {
  if (!value) return "””";
  try {
    return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
  } catch {
    return value;
  }
}

function RoleBadge({ role }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        roleBadgeStyles[role] || "bg-slate-100 text-slate-700",
      ].join(" ")}
    >
      {roleLabelMap[role] || role}
    </span>
  );
}

function StatusBadge({ isActive }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 size={12} />
        Actif
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
      <XCircle size={12} />
      Inactif
    </span>
  );
}

function normalizeUser(user) {
  return {
    ...user,
    full_name:
      user?.full_name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
      user?.username ||
      "",
    site_label: user?.site?.nom || user?.site_label || "Non défini",
  };
}

function extractApiErrors(error) {
  const payload = error?.response?.data;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  return Object.entries(payload).reduce((accumulator, [key, value]) => {
    if (Array.isArray(value)) {
      accumulator[key] = value.join(" ");
      return accumulator;
    }
    if (typeof value === "string") {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

function UserModal({
  mode,
  user,
  form,
  errors,
  saving,
  sites,
  onChange,
  onClose,
  onSubmit,
}) {
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, saving]);

  const fieldClassName = (fieldName) =>
    [
      "w-full rounded-2xl border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-slate-100",
      errors[fieldName] ? "border-rose-300" : "border-slate-200 focus:border-slate-300",
    ].join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <section className="w-full max-w-3xl rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit" ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === "edit"
                ? user?.full_name || user?.email || user?.username
                : "Créer un nouveau compte utilisateur"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Nom</span>
              <input
                type="text"
                value={form.first_name}
                onChange={(event) => onChange("first_name", event.target.value)}
                className={fieldClassName("first_name")}
                required
              />
              {errors.first_name ? <p className="text-xs text-rose-600">{errors.first_name}</p> : null}
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Prénom</span>
              <input
                type="text"
                value={form.last_name}
                onChange={(event) => onChange("last_name", event.target.value)}
                className={fieldClassName("last_name")}
                required
              />
              {errors.last_name ? <p className="text-xs text-rose-600">{errors.last_name}</p> : null}
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Username</span>
              <input
                type="text"
                value={form.username}
                onChange={(event) => onChange("username", event.target.value)}
                className={fieldClassName("username")}
                required
              />
              {errors.username ? <p className="text-xs text-rose-600">{errors.username}</p> : null}
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => onChange("email", event.target.value)}
                className={fieldClassName("email")}
                required
              />
              {errors.email ? <p className="text-xs text-rose-600">{errors.email}</p> : null}
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Numéro de téléphone</span>
              <input
                type="tel"
                value={form.telephone}
                onChange={(event) => onChange("telephone", event.target.value)}
                className={fieldClassName("telephone")}
                required
              />
              {errors.telephone ? <p className="text-xs text-rose-600">{errors.telephone}</p> : null}
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Date de naissance</span>
              <input
                type="date"
                value={form.date_naissance}
                onChange={(event) => onChange("date_naissance", event.target.value)}
                className={fieldClassName("date_naissance")}
                required
              />
              {errors.date_naissance ? (
                <p className="text-xs text-rose-600">{errors.date_naissance}</p>
              ) : null}
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Site</span>
              <select
                value={form.site_id}
                onChange={(event) => onChange("site_id", event.target.value)}
                className={fieldClassName("site_id")}
                required
              >
                <option value="">Sélectionner un site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.nom}
                  </option>
                ))}
              </select>
              {errors.site_id ? <p className="text-xs text-rose-600">{errors.site_id}</p> : null}
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Rôle</span>
              <select
                value={form.role}
                onChange={(event) => onChange("role", event.target.value)}
                className={fieldClassName("role")}
                required
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role ? <p className="text-xs text-rose-600">{errors.role}</p> : null}
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => onChange("is_active", event.target.checked)}
            />
            <span>Utilisateur actif</span>
          </label>

          {errors.non_field_errors ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errors.non_field_errors}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : mode === "edit" ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DetailsModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <section className="w-full max-w-lg rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
              {getInitials(user.full_name)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{user.full_name || user.username}</h2>
              <p className="text-sm text-slate-500">Détails de l'utilisateur</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Nom complet</span>
            <span className="font-semibold text-slate-900">{user.full_name || "-"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Username</span>
            <span className="font-semibold text-slate-900">{user.username}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Email</span>
            <span className="font-semibold text-slate-900">{user.email || "””"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Téléphone</span>
            <span className="font-semibold text-slate-900">{user.telephone || "””"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Date de naissance</span>
            <span className="font-semibold text-slate-900">{formatDate(user.date_naissance)}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Site</span>
            <span className="font-semibold text-slate-900">{user.site_label}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Rôle</span>
            <RoleBadge role={user.role} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Statut</span>
            <StatusBadge isActive={user.is_active} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Dernière connexion</span>
            <span className="font-semibold text-slate-900">{formatDateTime(user.last_login)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function DeleteConfirmModal({ user, onCancel, onConfirm, saving }) {
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && !saving) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel, saving]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Trash2 size={20} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Supprimer l'utilisateur</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Confirmez la suppression de{" "}
          <span className="font-medium text-slate-700">{user.full_name || user.email}</span>.
        </p>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(user)}
            disabled={saving}
            className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsUser, setDetailsUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setPageError("");

      const [usersResponse, sitesResponse] = await Promise.all([
        api.get("/users/"),
        api.get("/sites/"),
      ]);

      const nextUsers = Array.isArray(usersResponse.data) ? usersResponse.data.map(normalizeUser) : [];
      const nextSites = Array.isArray(sitesResponse.data) ? sitesResponse.data : [];

      setUsers(nextUsers);
      setSites(nextSites);
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 403) {
        setPageError("Vous n'avez pas l'autorisation d'accéder à la gestion des utilisateurs.");
      } else {
        setPageError("Impossible de charger la liste des utilisateurs.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [
        user.full_name,
        user.username,
        user.email,
        user.site_label,
        roleLabelMap[user.role] || user.role,
        user.is_active ? "actif" : "inactif",
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [search, users]);

  const stats = useMemo(() => {
    const active = users.filter((user) => user.is_active).length;
    const inactive = users.filter((user) => !user.is_active).length;
    const roles = new Set(users.map((user) => user.role)).size;

    return {
      total: users.length,
      active,
      inactive,
      roles,
    };
  }, [users]);

  function openAddModal() {
    setSelectedUser(null);
    setForm(emptyForm);
    setErrors({});
    setModalMode("add");
  }

  function openEditModal(user) {
    setSelectedUser(user);
    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      username: user.username || "",
      email: user.email || "",
      telephone: user.telephone || "",
      date_naissance: user.date_naissance || "",
      site_id: user.site?.id ? String(user.site.id) : "",
      role: user.role || "ADMIN",
      is_active: Boolean(user.is_active),
    });
    setErrors({});
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
    setForm(emptyForm);
    setErrors({});
  }

  function handleFormChange(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, non_field_errors: undefined }));
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.first_name.trim()) nextErrors.first_name = "Le nom est requis";
    if (!form.last_name.trim()) nextErrors.last_name = "Le prénom est requis";
    if (!form.username.trim()) nextErrors.username = "Le username est requis";
    if (!form.email.trim()) {
      nextErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "Veuillez saisir un email valide";
    }
    if (!form.telephone.trim()) {
      nextErrors.telephone = "Le numéro de téléphone est requis";
    } else if (!/^\+?[0-9][0-9\s-]{7,19}$/.test(form.telephone.trim())) {
      nextErrors.telephone = "Veuillez saisir un numéro de téléphone valide";
    }
    if (!form.date_naissance) nextErrors.date_naissance = "La date de naissance est requise";
    if (!form.site_id) nextErrors.site_id = "Le site est requis";
    if (!form.role) nextErrors.role = "Le rôle est requis";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      telephone: form.telephone.trim(),
      date_naissance: form.date_naissance,
      site_id: Number(form.site_id),
      role: form.role,
      is_active: form.is_active,
    };

    try {
      setSaving(true);
      setErrors({});

      if (modalMode === "edit" && selectedUser) {
        const response = await api.patch(`/users/${selectedUser.id}/`, payload);
        const updatedUser = normalizeUser(response.data || {});

        setUsers((current) =>
          current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
        );
        setFeedback({ type: "success", message: "Utilisateur mis à jour avec succès." });
      } else {
        const response = await api.post("/users/", payload);
        const createdUser = normalizeUser(response.data || {});

        setUsers((current) => [createdUser, ...current]);

        if (response.data?.temporary_password) {
          setFeedback({
            type: "warning",
            message: `${response.data.warning} Mot de passe temporaire : ${response.data.temporary_password}`,
          });
        } else {
          setFeedback({
            type: "success",
            message: response.data?.email_sent === false
              ? "Utilisateur créé, mais l'email n'a pas pu être envoyé."
              : "Utilisateur ajouté avec succès. Les identifiants ont été envoyés par email.",
          });
        }
      }

      closeModal();
    } catch (error) {
      console.error(error);
      const apiErrors = extractApiErrors(error);
      if (Object.keys(apiErrors).length > 0) {
        setErrors(apiErrors);
      } else {
        setErrors({ non_field_errors: "Une erreur est survenue lors de l'enregistrement." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete(user) {
    try {
      setDeleting(true);
      await api.delete(`/users/${user.id}/`);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setDeletingUser(null);
      setFeedback({ type: "danger", message: "Utilisateur supprimé avec succès." });
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "danger",
        message:
          error?.response?.data?.detail || "Impossible de supprimer cet utilisateur.",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-sm font-medium text-slate-500">Administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Gestion des Utilisateurs
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Suivi et gestion des utilisateurs, rôles, sites et statuts.
          </p>
        </div>
      </div>

      {feedback ? (
        <div
          className={[
            "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm shadow-sm",
            feedbackStyles[feedback.type] || feedbackStyles.success,
          ].join(" ")}
        >
          <CheckCircle2 size={18} />
          <span>{feedback.message}</span>
        </div>
      ) : null}

      {pageError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {pageError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Utilisateurs"
          value={stats.total}
          subtitle="Comptes enregistrés"
          icon={<Users size={22} className="text-blue-600" />}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Utilisateurs Actifs"
          value={stats.active}
          subtitle="Comptes actifs"
          icon={<UserRoundCheck size={22} className="text-emerald-600" />}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Utilisateurs Inactifs"
          value={stats.inactive}
          subtitle="Comptes à surveiller"
          icon={<XCircle size={22} className="text-amber-600" />}
          iconClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Rôles"
          value={stats.roles}
          subtitle="Rôles disponibles"
          icon={<ShieldCheck size={22} className="text-slate-700" />}
        />
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Liste des utilisateurs</h2>
            <p className="text-sm text-slate-500">Gestion des comptes, rôles et accès.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un utilisateur"
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Plus size={16} />
              Add User
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-2 font-medium">Nom</th>
                <th className="px-3 py-2 font-medium">Username</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Site</th>
                <th className="px-3 py-2 font-medium">Rôle</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    Chargement des utilisateurs...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    Aucun utilisateur disponible.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
                          {getInitials(user.full_name)}
                        </span>
                        {user.full_name || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{user.username}</td>
                    <td className="px-3 py-2 text-slate-700">{user.email}</td>
                    <td className="px-3 py-2 text-slate-700">{user.site_label}</td>
                    <td className="px-3 py-2">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge isActive={user.is_active} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailsUser(user)}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Voir les détails de ${user.full_name || user.email}`}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Modifier ${user.full_name || user.email}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingUser(user)}
                          className="rounded-xl p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Supprimer ${user.full_name || user.email}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode ? (
        <UserModal
          mode={modalMode}
          user={selectedUser}
          form={form}
          errors={errors}
          saving={saving}
          sites={sites}
          onChange={handleFormChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}

      <DetailsModal user={detailsUser} onClose={() => setDetailsUser(null)} />

      {deletingUser ? (
        <DeleteConfirmModal
          user={deletingUser}
          saving={deleting}
          onCancel={() => setDeletingUser(null)}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </div>
  );
}

