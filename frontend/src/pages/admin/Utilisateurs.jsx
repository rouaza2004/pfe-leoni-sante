import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CircleOff,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  Stethoscope,
  Trash2,
  UserPlus,
  UserRoundCheck,
  Users,
  X,
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
    name: "Dr. SOUSSI Chédlia",
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

const roleOptions = ["Tous les rôles", "Admin", "RH", "HSEE", "Doctor", "Nurse"];
const statusOptions = ["Tous les statuts", "Actif", "Inactif"];

const roleBadgeStyles = {
  Admin: "bg-sky-50 text-sky-700 ring-sky-200",
  RH: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  HSEE: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Doctor: "bg-amber-50 text-amber-700 ring-amber-200",
  Nurse: "bg-blue-50 text-blue-700 ring-blue-200",
};

const statusBadgeStyles = {
  Actif: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Inactif: "bg-slate-100 text-slate-600 ring-slate-200",
};

const feedbackStyles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

function getInitials(name) {
  if (!name) return "—";

  const parts = name
    .replace(/\./g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]).join("").toUpperCase();
}

function SummaryCard({ title, value, detail, icon: Icon, iconStyle }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-[30px] font-semibold leading-none tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </div>
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            iconStyle,
          ].join(" ")}
        >
          <Icon size={22} />
        </div>
      </div>
    </article>
  );
}

function ActionsMenu({
  user,
  isOpen,
  onToggle,
  onClose,
  onEdit,
  onToggleStatus,
  onResetPassword,
  onDelete,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        onClose();
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-11 z-20 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/70">
          <button
            type="button"
            onClick={() => {
              onEdit(user);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil size={16} />
            Modifier
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleStatus(user);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <CircleOff size={16} />
            {user.status === "Actif" ? "Désactiver" : "Activer"}
          </button>
          <button
            type="button"
            onClick={() => {
              onResetPassword(user);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Réinitialiser MDP
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete(user);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 size={16} />
            Supprimer
          </button>
        </div>
      ) : null}
    </div>
  );
}

function EditUserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "Admin",
    status: user?.status || "Actif",
  }));

  useEffect(() => {
    if (!user) return;

    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role,
      status: user.status,
    });
  }, [user]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Modifier l&apos;utilisateur
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Mettre à jour les informations du compte sélectionné.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Nom</span>
            <input
              type="text"
              value={formData.name}
              onChange={(event) =>
                setFormData((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="—"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={formData.email}
              onChange={(event) =>
                setFormData((current) => ({ ...current, email: event.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-slate-700">Rôle</span>
            <select
              value={formData.role}
              onChange={(event) =>
                setFormData((current) => ({ ...current, role: event.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
            >
              {roleOptions.slice(1).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-slate-700">Statut</span>
            <select
              value={formData.status}
              onChange={(event) =>
                setFormData((current) => ({ ...current, status: event.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
            >
              {statusOptions.slice(1).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSave({ ...user, ...formData })}
            className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function AddUserModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Admin",
    status: "Actif",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  function validate() {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Le nom est requis";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = "Veuillez saisir un email valide";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      status: formData.status,
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Ajouter un utilisateur
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Créez un nouveau compte et ajoutez-le immédiatement à la liste.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Nom</span>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => {
                const value = event.target.value;
                setFormData((current) => ({ ...current, name: value }));
                setErrors((current) => ({ ...current, name: undefined }));
              }}
              className={[
                "h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:bg-white",
                errors.name ? "border-rose-300" : "border-slate-200 focus:border-slate-300",
              ].join(" ")}
            />
            {errors.name ? <p className="mt-2 text-xs text-rose-600">{errors.name}</p> : null}
          </label>

          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={formData.email}
              onChange={(event) => {
                const value = event.target.value;
                setFormData((current) => ({ ...current, email: value }));
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              className={[
                "h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:bg-white",
                errors.email ? "border-rose-300" : "border-slate-200 focus:border-slate-300",
              ].join(" ")}
            />
            {errors.email ? <p className="mt-2 text-xs text-rose-600">{errors.email}</p> : null}
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-slate-700">Rôle</span>
            <select
              value={formData.role}
              onChange={(event) =>
                setFormData((current) => ({ ...current, role: event.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
            >
              {roleOptions.slice(1).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-slate-700">Statut</span>
            <select
              value={formData.status}
              onChange={(event) =>
                setFormData((current) => ({ ...current, status: event.target.value }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
            >
              {statusOptions.slice(1).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-2xl bg-sky-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            Ajouter
          </button>
        </div>
      </div>
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Trash2 size={20} />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
          Supprimer l&apos;utilisateur
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Confirmez la suppression de{" "}
          <span className="font-medium text-slate-700">{user.name || user.email}</span>. Cette
          action retirera immédiatement la ligne du tableau.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(user)}
            className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-rose-700"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Utilisateurs() {
  const [users, setUsers] = useState(initialUsersData);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("Tous les rôles");
  const [selectedStatus, setSelectedStatus] = useState("Tous les statuts");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
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

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.name, user.email, user.role, user.status, user.lastLogin]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesRole = selectedRole === "Tous les rôles" || user.role === selectedRole;
      const matchesStatus =
        selectedStatus === "Tous les statuts" || user.status === selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [search, selectedRole, selectedStatus, users]);

  const summary = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.status === "Actif").length;
    const doctors = users.filter((user) => user.role === "Doctor").length;
    const incompleteNames = users.filter((user) => !user.name).length;

    return [
      {
        title: "Total utilisateurs",
        value: total,
        detail: `${filteredUsers.length} affiché(s) dans la liste`,
        icon: Users,
        iconStyle: "bg-sky-100 text-sky-700",
      },
      {
        title: "Comptes actifs",
        value: active,
        detail: `${users.filter((user) => user.status === "Inactif").length} compte(s) inactif(s)`,
        icon: UserRoundCheck,
        iconStyle: "bg-emerald-100 text-emerald-700",
      },
      {
        title: "Médecins",
        value: doctors,
        detail: "Utilisateurs avec le rôle Doctor",
        icon: Stethoscope,
        iconStyle: "bg-amber-100 text-amber-700",
      },
      {
        title: "Rôles à compléter",
        value: incompleteNames,
        detail: "Comptes présents avec identité à renseigner",
        icon: ShieldAlert,
        iconStyle: "bg-violet-100 text-violet-700",
      },
    ];
  }, [filteredUsers, users]);

  function handleEdit(user) {
    setEditingUser(user);
  }

  function handleSaveEdit(updatedUser) {
    setUsers((current) =>
      current.map((user) => (user.id === updatedUser.id ? { ...user, ...updatedUser } : user))
    );
    setEditingUser(null);
    setFeedback({
      type: "success",
      message: "Utilisateur mis à jour avec succès",
    });
  }

  function handleToggleStatus(user) {
    const nextStatus = user.status === "Actif" ? "Inactif" : "Actif";

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? {
              ...item,
              status: nextStatus,
            }
          : item
      )
    );

    setFeedback({
      type: "info",
      message:
        nextStatus === "Actif"
          ? "Utilisateur réactivé avec succès"
          : "Utilisateur désactivé avec succès",
    });
  }

  function handleResetPassword(user) {
    setFeedback({
      type: "success",
      message: `Mot de passe réinitialisé avec succès pour ${user.name || user.email}`,
    });
  }

  function handleAskDelete(user) {
    setDeletingUser(user);
  }

  function handleConfirmDelete(user) {
    setUsers((current) => current.filter((item) => item.id !== user.id));
    setDeletingUser(null);
    setFeedback({
      type: "danger",
      message: "Utilisateur supprimé avec succès",
    });
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[30px]">
            Gestion des Utilisateurs
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Administration des comptes et des accès de la plateforme
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
        >
          <UserPlus size={16} />
          Ajouter Utilisateur
        </button>
      </div>

      {feedback ? (
        <div
          className={[
            "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm",
            feedbackStyles[feedback.type] || feedbackStyles.info,
          ].join(" ")}
        >
          <CheckCircle2 size={18} />
          <span>{feedback.message}</span>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {summary.map((item) => (
          <SummaryCard key={item.title} {...item} />
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un utilisateur, un email ou un rôle..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative">
              <select
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                className="h-12 min-w-[180px] appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </label>

            <label className="relative">
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="h-12 min-w-[180px] appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/90">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Nom
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Email
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Rôle
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Statut
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Dernière Connexion
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-50/70">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p
                          className={[
                            "text-sm font-semibold",
                            user.name ? "text-slate-900" : "text-slate-300",
                          ].join(" ")}
                        >
                          {user.name || "—"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{user.role}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>

                  <td className="px-6 py-4">
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1",
                        roleBadgeStyles[user.role],
                      ].join(" ")}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1",
                        statusBadgeStyles[user.status],
                      ].join(" ")}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">{user.lastLogin}</td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <ActionsMenu
                        user={user}
                        isOpen={openMenuId === user.id}
                        onToggle={() =>
                          setOpenMenuId((current) => (current === user.id ? null : user.id))
                        }
                        onClose={() => setOpenMenuId(null)}
                        onEdit={handleEdit}
                        onToggleStatus={handleToggleStatus}
                        onResetPassword={handleResetPassword}
                        onDelete={handleAskDelete}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-200 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Search size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Aucun utilisateur trouvé</p>
              <p className="mt-1 text-sm text-slate-500">
                Ajustez la recherche ou les filtres pour afficher des résultats.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{filteredUsers.length} utilisateur(s) affiché(s)</span>
          <span>{users.length} utilisateur(s) au total</span>
        </div>
      </section>

      {isAddModalOpen ? (
        <AddUserModal
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddUser}
        />
      ) : null}

      {editingUser ? (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEdit}
        />
      ) : null}

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
