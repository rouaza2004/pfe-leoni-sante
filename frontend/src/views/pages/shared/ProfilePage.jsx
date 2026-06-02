import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api/api";

const emptyProfile = {
  first_name: "",
  last_name: "",
  email: "",
  telephone: "",
  date_naissance: "",
  nom_ar: "",
};

const emptyPassword = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

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

function getInitials(profile) {
  const source =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.username ||
    "U";

  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function fieldClass(error) {
  return [
    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-slate-100",
    error ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-slate-400",
  ].join(" ");
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-rose-600">{message}</p>;
}

function PasswordInput({ id, label, value, error, visible, onToggle, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClass(error)} pr-11`}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <FieldError message={error} />
    </label>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordForm, setPasswordForm] = useState(emptyPassword);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data } = await api.get("/profile/");
        if (!active) return;
        setProfile(data);
        setProfileForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          telephone: data.telephone || "",
          date_naissance: data.date_naissance || "",
          nom_ar: data.nom_ar || "",
        });
      } catch {
        if (active) {
          toast.error("Impossible de charger votre profil.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const profileSummary = useMemo(() => {
    if (!profile) return [];
    return [
      { label: "Identifiant", value: profile.username || "-" },
      { label: "Role", value: profile.role || "-" },
      { label: "Site", value: profile.site_label || "-" },
    ];
  }, [profile]);

  const passwordRules = useMemo(
    () => [
      "Au moins 8 caracteres",
      "Pas trop similaire a vos informations personnelles",
      "Pas un mot de passe courant",
      "Pas entierement numerique",
    ],
    [],
  );

  const updateProfileField = (fieldName, value) => {
    setProfileForm((current) => ({ ...current, [fieldName]: value }));
    setProfileErrors((current) => ({ ...current, [fieldName]: "" }));
  };

  const updatePasswordField = (fieldName, value) => {
    setPasswordForm((current) => ({ ...current, [fieldName]: value }));
    setPasswordErrors((current) => ({ ...current, [fieldName]: "" }));
  };

  const validateProfile = () => {
    const errors = {};
    if (!profileForm.first_name.trim()) errors.first_name = "Le nom est obligatoire.";
    if (!profileForm.last_name.trim()) errors.last_name = "Le prenom est obligatoire.";
    if (!profileForm.email.trim()) errors.email = "L'email est obligatoire.";
    if (
      profileForm.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())
    ) {
      errors.email = "Veuillez saisir un email valide.";
    }
    if (
      profileForm.telephone.trim() &&
      !/^\+?[0-9][0-9\s-]{7,19}$/.test(profileForm.telephone.trim())
    ) {
      errors.telephone = "Veuillez saisir un numero de telephone valide.";
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordForm.current_password) {
      errors.current_password = "Le mot de passe actuel est obligatoire.";
    }
    if (!passwordForm.new_password) {
      errors.new_password = "Le nouveau mot de passe est obligatoire.";
    } else if (passwordForm.new_password.length < 8) {
      errors.new_password = "Le mot de passe doit contenir au moins 8 caracteres.";
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.confirm_password = "La confirmation ne correspond pas au nouveau mot de passe.";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!validateProfile()) return;

    setSavingProfile(true);
    setProfileErrors({});

    try {
      const payload = {
        ...profileForm,
        email: profileForm.email.trim(),
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        telephone: profileForm.telephone.trim(),
        nom_ar: profileForm.nom_ar.trim(),
        date_naissance: profileForm.date_naissance || null,
      };
      const { data } = await api.patch("/profile/", payload);
      setProfile(data);
      setProfileForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        telephone: data.telephone || "",
        date_naissance: data.date_naissance || "",
        nom_ar: data.nom_ar || "",
      });
      toast.success("Profil mis a jour avec succes.");
    } catch (error) {
      const apiErrors = extractApiErrors(error);
      setProfileErrors(apiErrors);
      toast.error(apiErrors.detail || "Impossible de mettre a jour votre profil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!validatePassword()) return;

    setSavingPassword(true);
    setPasswordErrors({});

    try {
      await api.post("/profile/password/", passwordForm);
      setPasswordForm(emptyPassword);
      toast.success("Mot de passe mis a jour avec succes.");
    } catch (error) {
      const apiErrors = extractApiErrors(error);
      setPasswordErrors(apiErrors);
      toast.error(apiErrors.detail || "Impossible de modifier le mot de passe.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <Loader2 className="animate-spin" size={18} />
          Chargement du profil
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xl font-semibold text-white">
            {getInitials(profile)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Mon compte</p>
            <h1 className="truncate text-2xl font-bold text-slate-900">
              {profile?.full_name || profile?.username || "Profil utilisateur"}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck size={16} />
              Informations personnelles et securite
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:min-w-[380px]">
          {profileSummary.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase text-slate-400">{item.label}</p>
              <p className="truncate text-sm font-semibold text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <UserRound size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Informations personnelles</h2>
              <p className="text-sm text-slate-500">Mettez a jour uniquement vos propres informations.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nom</span>
              <input
                value={profileForm.first_name}
                onChange={(event) => updateProfileField("first_name", event.target.value)}
                className={`mt-1 ${fieldClass(profileErrors.first_name)}`}
                autoComplete="given-name"
              />
              <FieldError message={profileErrors.first_name} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Prenom</span>
              <input
                value={profileForm.last_name}
                onChange={(event) => updateProfileField("last_name", event.target.value)}
                className={`mt-1 ${fieldClass(profileErrors.last_name)}`}
                autoComplete="family-name"
              />
              <FieldError message={profileErrors.last_name} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => updateProfileField("email", event.target.value)}
                  className={`${fieldClass(profileErrors.email)} pl-9`}
                  autoComplete="email"
                />
              </div>
              <FieldError message={profileErrors.email} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Telephone</span>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={profileForm.telephone}
                  onChange={(event) => updateProfileField("telephone", event.target.value)}
                  className={`${fieldClass(profileErrors.telephone)} pl-9`}
                  autoComplete="tel"
                />
              </div>
              <FieldError message={profileErrors.telephone} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Date de naissance</span>
              <input
                type="date"
                value={profileForm.date_naissance}
                onChange={(event) => updateProfileField("date_naissance", event.target.value)}
                className={`mt-1 ${fieldClass(profileErrors.date_naissance)}`}
              />
              <FieldError message={profileErrors.date_naissance} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nom arabe</span>
              <input
                value={profileForm.nom_ar}
                onChange={(event) => updateProfileField("nom_ar", event.target.value)}
                className={`mt-1 ${fieldClass(profileErrors.nom_ar)}`}
              />
              <FieldError message={profileErrors.nom_ar} />
            </label>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                Enregistrer
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Mot de passe</h2>
              <p className="text-sm text-slate-500">Verification requise avant modification.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <PasswordInput
              id="current-password"
              label="Mot de passe actuel"
              value={passwordForm.current_password}
              error={passwordErrors.current_password}
              visible={visiblePasswords.current_password}
              onToggle={() =>
                setVisiblePasswords((current) => ({
                  ...current,
                  current_password: !current.current_password,
                }))
              }
              onChange={(value) => updatePasswordField("current_password", value)}
            />

            <PasswordInput
              id="new-password"
              label="Nouveau mot de passe"
              value={passwordForm.new_password}
              error={passwordErrors.new_password}
              visible={visiblePasswords.new_password}
              onToggle={() =>
                setVisiblePasswords((current) => ({
                  ...current,
                  new_password: !current.new_password,
                }))
              }
              onChange={(value) => updatePasswordField("new_password", value)}
            />

            <PasswordInput
              id="confirm-password"
              label="Confirmer le nouveau mot de passe"
              value={passwordForm.confirm_password}
              error={passwordErrors.confirm_password}
              visible={visiblePasswords.confirm_password}
              onToggle={() =>
                setVisiblePasswords((current) => ({
                  ...current,
                  confirm_password: !current.confirm_password,
                }))
              }
              onChange={(value) => updatePasswordField("confirm_password", value)}
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Regles de securite</p>
              <ul className="space-y-1">
                {passwordRules.map((rule) => (
                  <li key={rule} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPassword ? <Loader2 className="animate-spin" size={17} /> : <KeyRound size={17} />}
              Modifier le mot de passe
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

