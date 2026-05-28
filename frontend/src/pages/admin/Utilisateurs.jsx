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

const initialUsersData = [
  {
    id: "user-1",
    name: "Ahmed Benali",
    email: "ahmed.benali@plateforme.ma",
    role: "Admin",
    status: "Actif",
    lastLogin: "2026-04-13 08:45",
  },
  {
    id: "user-2",
    name: "Sara Mansouri",
    email: "sara.mansouri@plateforme.ma",
    role: "RH",
    status: "Actif",
    lastLogin: "2026-04-13 08:10",
  },
  {
    id: "user-3",
    name: "Dr. Karim Ait",
    email: "karim.ait@plateforme.ma",
    role: "Doctor",
    status: "Actif",
    lastLogin: "2026-04-12 17:25",
  },
  {
    id: "user-4",
    name: "Fatima Zohra",
    email: "fatima.zohra@plateforme.ma",
    role: "Nurse",
    status: "Actif",
    lastLogin: "2026-04-12 16:40",
  },
  {
    id: "user-5",
    name: "Amal Souissi",
    email: "amal.souissi@plateforme.ma",
    role: "HSEE",
    status: "Inactif",
    lastLogin: "2026-04-09 11:20",
  },
  {
    id: "user-6",
    name: "",
    email: "admin@plateforme.ma",
    role: "Admin",
    status: "Actif",
    lastLogin: "2026-04-11 09:00",
  },
  {
    id: "user-7",
    name: "",
    email: "rh@plateforme.ma",
    role: "RH",
    status: "Inactif",
    lastLogin: "2026-04-08 14:15",
  },
  {
    id: "user-8",
    name: "",
    email: "hsee@plateforme.ma",
    role: "HSEE",
    status: "Actif",
    lastLogin: "2026-04-10 10:35",
  },
  {
    id: "user-9",
    name: "Dr. RACHED Sleh Eddine",
    email: "rached.sleh-eddine@plateforme.ma",
    role: "Doctor",
    status: "Actif",
    lastLogin: "2026-04-13 07:55",
  },
  {
    id: "user-10",
    name: "Dr. HAMILA Zeineb",
    email: "hamila.zeineb@plateforme.ma",
    role: "Doctor",
    status: "Actif",
    lastLogin: "2026-04-12 18:10",
  },
  {
    id: "user-11",
    name: "Dr. SOUSSI Chedlia",
    email: "soussi.chedlia@plateforme.ma",
    role: "Doctor",
    status: "Inactif",
    lastLogin: "2026-04-07 12:30",
  },
  {
    id: "user-12",
    name: "Dr. ABDALLAH Badii",
    email: "abdallah.badii@plateforme.ma",
    role: "Doctor",
    status: "Actif",
    lastLogin: "2026-04-12 15:05",
  },
  {
    id: "user-13",
    name: "Dr. Teyeb Mariem",
    email: "teyeb.mariem@plateforme.ma",
    role: "Doctor",
    status: "Actif",
    lastLogin: "2026-04-11 16:22",
  },
  {
    id: "user-14",
    name: "Dr. LASSOUED Samia",
    email: "lassoued.samia@plateforme.ma",
    role: "Doctor",
    status: "Inactif",
    lastLogin: "2026-04-06 09:12",
  },
  {
    id: "user-15",
    name: "Dr. JAMMELI Donia",
    email: "jammeli.donia@plateforme.ma",
    role: "Doctor",
    status: "Actif",
    lastLogin: "2026-04-12 14:18",
  },
];

const roleOptions = ["Admin", "RH", "HSEE", "Doctor", "Nurse"];
const statusOptions = ["Actif", "Inactif"];

const emptyForm = {
  name: "",
  email: "",
  role: "Admin",
  status: "Actif",
};

const roleBadgeStyles = {
  Admin: "bg-sky-50 text-sky-700",
  RH: "bg-emerald-50 text-emerald-700",
  HSEE: "bg-cyan-50 text-cyan-700",
  Doctor: "bg-amber-50 text-amber-700",
  Nurse: "bg-blue-50 text-blue-700",
};

const feedbackStyles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
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

function getInitials(name) {
  if (!name) return "-";

  return name
    .replace(/\./g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function RoleBadge({ role }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        roleBadgeStyles[role] || "bg-slate-100 text-slate-700",
      ].join(" ")}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === "Actif") {
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

function UserModal({ mode, user, form, errors, onChange, onClose, onSubmit }) {
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <section className="w-full max-w-xl rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit" ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === "edit" ? user?.name || user?.email : "Créer un nouveau compte utilisateur"}
            </p>
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

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Nom</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                className={[
                  "w-full rounded-2xl border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-slate-100",
                  errors.name ? "border-rose-300" : "border-slate-200 focus:border-slate-300",
                ].join(" ")}
                required
              />
              {errors.name ? <p className="text-xs text-rose-600">{errors.name}</p> : null}
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => onChange("email", event.target.value)}
                className={[
                  "w-full rounded-2xl border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-slate-100",
                  errors.email ? "border-rose-300" : "border-slate-200 focus:border-slate-300",
                ].join(" ")}
                required
              />
              {errors.email ? <p className="text-xs text-rose-600">{errors.email}</p> : null}
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Rôle</span>
              <select
                value={form.role}
                onChange={(event) => onChange("role", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Statut</span>
              <select
                value={form.status}
                onChange={(event) => onChange("status", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {mode === "edit" ? "Enregistrer" : "Ajouter"}
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
              {getInitials(user.name)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{user.name || user.email}</h2>
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
            <span className="text-slate-600">Nom</span>
            <span className="font-semibold text-slate-900">{user.name || "-"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Email</span>
            <span className="font-semibold text-slate-900">{user.email}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Rôle</span>
            <RoleBadge role={user.role} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
            <span className="text-slate-600">Statut</span>
            <StatusBadge status={user.status} />
          </div>
        </div>
      </section>
    </div>
  );
}

function DeleteConfirmModal({ user, onCancel, onConfirm }) {
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel]);

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
          <span className="font-medium text-slate-700">{user.name || user.email}</span>.
        </p>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(user)}
            className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </section>
    </div>
  );
}

export default function Utilisateurs() {
  const [users, setUsers] = useState(initialUsersData);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsUser, setDetailsUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);

  function handleOpenAddModal(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setIsAddModalOpen(true);
  }

  function handleAddUser(payload) {
    const lastLogin = new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());

    setUsers((current) => [
      {
        id: `user-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        status: payload.status,
        lastLogin,
      },
      ...current,
    ]);
    setIsAddModalOpen(false);
    setFeedback({
      type: "success",
      message: "Utilisateur ajoutÃ© avec succÃ¨s",
    });
  }

  useEffect(() => {
    if (!feedback) return undefined;

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [user.name, user.email, user.role, user.status].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search, users]);

  const stats = useMemo(() => {
    const active = users.filter((user) => user.status === "Actif").length;
    const inactive = users.filter((user) => user.status === "Inactif").length;
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
      name: user.name || "",
      email: user.email,
      role: user.role,
      status: user.status,
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
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Le nom est requis";
    }

    if (!form.email.trim()) {
      nextErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "Veuillez saisir un email valide";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;

    if (modalMode === "edit" && selectedUser) {
      setUsers((current) =>
        current.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                name: form.name.trim(),
                email: form.email.trim(),
                role: form.role,
                status: form.status,
              }
            : user,
        ),
      );
      setFeedback({ type: "success", message: "Utilisateur mis à jour avec succès" });
    } else {
      const lastLogin = new Intl.DateTimeFormat("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date());

      setUsers((current) => [
        {
          id: `user-${Date.now()}`,
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          status: form.status,
          lastLogin,
        },
        ...current,
      ]);
      setFeedback({ type: "success", message: "Utilisateur ajouté avec succès" });
    }

    closeModal();
  }

  function handleConfirmDelete(user) {
    setUsers((current) => current.filter((item) => item.id !== user.id));
    setDeletingUser(null);
    setFeedback({ type: "danger", message: "Utilisateur supprimé avec succès" });
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
            Suivi et gestion des utilisateurs, rôles et statuts.
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
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Rôle</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
                        {getInitials(user.name)}
                      </span>
                      {user.name || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{user.email}</td>
                  <td className="px-3 py-2">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailsUser(user)}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`Voir les détails de ${user.name || user.email}`}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`Modifier ${user.name || user.email}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingUser(user)}
                        className="rounded-xl p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Supprimer ${user.name || user.email}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                    Aucun utilisateur disponible.
                  </td>
                </tr>
              ) : null}
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
          onChange={handleFormChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}

      <DetailsModal user={detailsUser} onClose={() => setDetailsUser(null)} />

      {deletingUser ? (
        <DeleteConfirmModal
          user={deletingUser}
          onCancel={() => setDeletingUser(null)}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </div>
  );
}
