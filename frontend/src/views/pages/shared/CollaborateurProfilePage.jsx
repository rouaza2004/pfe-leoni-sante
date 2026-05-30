import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  UserCircle2,
} from "lucide-react";

import { getUserRole } from "@/controllers/auth/auth";
import { fixFrenchTextDeep } from "@/utils/fixFrenchText";
import { getCollaborateurProfilByMatricule } from "@/models/collaborateurs/collaborateurProfile.api";

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function SimpleList({ items, renderItem }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-500">Aucune donnée.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border p-3 text-sm">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

function Field({ label, icon, type = "text", value, onChange, placeholder }) {
  const IconComponent = icon;

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
        <IconComponent size={18} className="shrink-0 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </label>
  );
}

function AdminProfilePage() {
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "admin@clinic.com",
    phone: "+212 600 000 111",
    address: "Casablanca, Maroc",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const summaryName = profileForm.fullName.trim() || "—";
  const summaryEmail = profileForm.email.trim() || "—";
  const summaryInitials = useMemo(() => {
    if (!profileForm.fullName.trim()) return "--";

    return profileForm.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "--";
  }, [profileForm.fullName]);

  const handleProfileChange = (field) => (event) => {
    setProfileMessage("");
    setProfileForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordError("");
    setPasswordMessage("");
    setPasswordForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    setProfileMessage("Informations enregistrées avec succès.");
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Veuillez remplir tous les champs du mot de passe.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    setPasswordError("");
    setPasswordMessage("Mot de passe mis à jour avec succès.");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          <UserCircle2 size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mon Profil</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez vos informations personnelles et votre sécurité
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-2xl font-semibold text-white shadow-sm">
            {summaryInitials}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900">{summaryName}</h2>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-100">
                <BadgeCheck size={16} />
                <span>Administrateur</span>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-slate-400" />
                <span>{summaryEmail}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CalendarDays size={16} className="text-slate-400" />
                <span>Membre depuis Jan 2024</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Informations Personnelles</h2>
            <p className="text-sm text-slate-500">Mettez à jour vos coordonnées personnelles.</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Nom complet"
              icon={UserCircle2}
              value={profileForm.fullName}
              onChange={handleProfileChange("fullName")}
              placeholder="—"
            />
            <Field
              label="Email"
              icon={Mail}
              type="email"
              value={profileForm.email}
              onChange={handleProfileChange("email")}
              placeholder="admin@clinic.com"
            />
            <Field
              label="Téléphone"
              icon={Phone}
              value={profileForm.phone}
              onChange={handleProfileChange("phone")}
              placeholder="+212 600 000 111"
            />
            <Field
              label="Adresse"
              icon={MapPin}
              value={profileForm.address}
              onChange={handleProfileChange("address")}
              placeholder="Casablanca, Maroc"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm text-emerald-600">{profileMessage}</div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Save size={16} />
              <span>Sauvegarder</span>
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Changer le Mot de Passe</h2>
            <p className="text-sm text-slate-500">Renforcez la sécurité de votre compte administrateur.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <Field
            label="Mot de passe actuel"
            icon={Lock}
            type="password"
            value={passwordForm.currentPassword}
            onChange={handlePasswordChange("currentPassword")}
            placeholder="Saisissez votre mot de passe actuel"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Nouveau mot de passe"
              icon={Lock}
              type="password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange("newPassword")}
              placeholder="Minimum 8 caractères"
            />
            <Field
              label="Confirmer le mot de passe"
              icon={Lock}
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange("confirmPassword")}
              placeholder="Confirmez le mot de passe"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm">
              {passwordError ? <span className="text-red-600">{passwordError}</span> : null}
              {!passwordError && passwordMessage ? (
                <span className="text-emerald-600">{passwordMessage}</span>
              ) : null}
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Lock size={16} />
              <span>Mettre à jour le mot de passe</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function CollaborateurSearchProfilePage() {
  const [matricule, setMatricule] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (event) => {
    event.preventDefault();

    if (!matricule.trim()) return;

    try {
      setLoading(true);
      setErr("");
      const result = await getCollaborateurProfilByMatricule(matricule.trim());
      setData(fixFrenchTextDeep(result));
    } catch (error) {
      console.error(error);
      setErr("Collaborateur introuvable.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Profil Collaborateur</h1>
        <p className="text-sm text-gray-500">Recherche complète par matricule</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={matricule}
          onChange={(event) => setMatricule(event.target.value)}
          placeholder="Entrer le matricule"
          className="w-80 rounded-xl border px-4 py-3"
        />
        <button type="submit" className="rounded-xl bg-black px-5 py-3 text-white">
          Rechercher
        </button>
      </form>

      {loading && <p>Chargement...</p>}
      {err && <p className="text-red-600">{err}</p>}

      {data ? (
        <>
          <Section title="Informations générales">
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <p><strong>Matricule:</strong> {data.collaborateur?.matricule}</p>
              <p><strong>Nom:</strong> {data.collaborateur?.nom}</p>
              <p><strong>Prénom:</strong> {data.collaborateur?.prenom}</p>
              <p><strong>CIN:</strong> {data.collaborateur?.cin || "-"}</p>
              <p><strong>Téléphone:</strong> {data.collaborateur?.telephone || "-"}</p>
              <p><strong>Poste:</strong> {data.collaborateur?.poste || "-"}</p>
              <p><strong>Département:</strong> {data.collaborateur?.departement || "-"}</p>
              <p><strong>Site:</strong> {data.collaborateur?.site?.nom || "-"}</p>
            </div>
          </Section>

          <Section title="Dossier médical">
            {data.dossier_medical ? (
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <p><strong>Entreprise:</strong> {data.dossier_medical.entreprise || "-"}</p>
                <p><strong>Localité:</strong> {data.dossier_medical.localite || "-"}</p>
                <p><strong>Date recrutement:</strong> {data.dossier_medical.date_recrutement || "-"}</p>
                <p><strong>Profession:</strong> {data.dossier_medical.profession || "-"}</p>
                <p><strong>Poste actuel:</strong> {data.dossier_medical.poste_travail_actuel || "-"}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun dossier médical.</p>
            )}
          </Section>

          <Section title={`Accidents (${data.accidents.length})`}>
            <SimpleList
              items={data.accidents}
              renderItem={(item) => (
                <>
                  <p><strong>Date:</strong> {item.date_accident}</p>
                  <p><strong>Zone:</strong> {item.zone}</p>
                  <p><strong>Lésion:</strong> {item.nature_lesion}</p>
                </>
              )}
            />
          </Section>

          <Section title={`Maladies professionnelles (${data.maladies_professionnelles.length})`}>
            <SimpleList
              items={data.maladies_professionnelles}
              renderItem={(item) => (
                <>
                  <p><strong>Maladie:</strong> {item.nom_maladie}</p>
                  <p><strong>Date découverte:</strong> {item.date_decouverte}</p>
                </>
              )}
            />
          </Section>

          <Section title={`Incidents infirmiers (${data.incidents_infirmiers.length})`}>
            <SimpleList
              items={data.incidents_infirmiers}
              renderItem={(item) => (
                <>
                  <p><strong>Date:</strong> {item.date_incident}</p>
                  <p><strong>Heure:</strong> {item.heure_incident}</p>
                  <p><strong>Agent causal:</strong> {item.agent_causal}</p>
                </>
              )}
            />
          </Section>

          <Section title={`Vaccinations (${data.vaccinations.length})`}>
            <SimpleList
              items={data.vaccinations}
              renderItem={(item) => (
                <>
                  <p><strong>Vaccin:</strong> {item.vaccin}</p>
                  <p><strong>Rappel:</strong> {item.date_rappel || "-"}</p>
                </>
              )}
            />
          </Section>

          <Section title={`Ordonnances (${data.ordonnances.length})`}>
            <SimpleList
              items={data.ordonnances}
              renderItem={(item) => (
                <>
                  <p><strong>Date:</strong> {item.date}</p>
                  <p><strong>Contenu:</strong> {item.contenu}</p>
                </>
              )}
            />
          </Section>

          <Section title={`Certificats (${data.certificats.length})`}>
            <SimpleList
              items={data.certificats}
              renderItem={(item) => (
                <>
                  <p><strong>Date:</strong> {item.date}</p>
                  <p><strong>Repos:</strong> {item.nb_jours_repos} jours</p>
                </>
              )}
            />
          </Section>

          <Section title={`Fiches aptitude (${data.fiches_aptitude.length})`}>
            <SimpleList
              items={data.fiches_aptitude}
              renderItem={(item) => (
                <>
                  <p><strong>Date:</strong> {item.date}</p>
                  <p><strong>Type examen:</strong> {item.type_examen}</p>
                  <p><strong>Aptitude:</strong> {item.aptitude}</p>
                </>
              )}
            />
          </Section>
        </>
      ) : null}
    </div>
  );
}

export default function CollaborateurProfilePage() {
  const role = getUserRole();

  if (role === "ADMIN") {
    return <AdminProfilePage />;
  }

  return <CollaborateurSearchProfilePage />;
}


