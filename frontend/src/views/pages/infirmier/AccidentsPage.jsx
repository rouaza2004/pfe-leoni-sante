import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Eye,
  Printer,
  Loader2,
  PencilLine,
} from "lucide-react";
import { api } from "@/controllers/api/api";
import { getCollaborateurProfilByMatricule } from "@/models/collaborateurs/collaborateurProfile.api";
import { SITE_FILTER_OPTIONS, getSiteName, matchesSiteFilter } from "@/utils/siteOptions";

const defaultEmployeurValues = {
  employeur_cnss: "1234567-89",
  employeur_nom: "LEONI Wiring Systems Tunisia",
  employeur_adresse: "Zone Industrielle Messadine, Sousse",
  employeur_code_postal: "4013",
  employeur_telephone: "73 000 000",
  employeur_activite: "Fabrication de faisceaux de câbles automobiles",
};

const emptyForm = {
  matricule: "",
  ...defaultEmployeurValues,
  victime_cnss: "",
  victime_nom: "",
  victime_prenom: "",
  victime_nom_naissance: "",
  victime_prenom_pere: "",
  victime_nationalite: "",
  victime_sexe: "",
  victime_date_naissance: "",
  victime_lieu_naissance: "",
  victime_cin: "",
  victime_adresse: "",
  victime_code_postal: "",
  victime_date_embauche: "",
  victime_specialite: "",
  victime_situation: "",
  victime_profession: "",
  victime_poste_accident: "",
  victime_lieu_travail: "",
  autres_victimes: false,
  date_accident: "",
  heure_accident: "",
  horaire_travail_debut: "",
  horaire_travail_fin: "",
  lieu_accident: "",
  activite_lieu: "",
  activite_lieu_autre: "",
  nombre_travailleurs: "",
  description_circonstances: "",
  causes_materielles: "",
  comment_accident: "",
  cause: "",
  nature_lesion: "",
  siege_lesion: "",
  transport_hopital: "",
  resultat: "",
  date_arret: "",
  heure_arret: "",
  salaire_maintenu: false,
  salaire_duree: "",
  salaire_montant: "",
  salaire_unite: "",
  temoin1_nom: "",
  temoin1_telephone: "",
  temoin1_matricule: "",
  temoin2_nom: "",
  temoin2_telephone: "",
  temoin2_matricule: "",
  temoins: "",
  rapport_police: false,
  rapport_police_numero: "",
  rapport_police_date: "",
  rapport_police_poste: "",
  tiers_responsable: false,
  tiers_nom: "",
  tiers_assureur: "",
  signataire_nom: "",
  signataire_qualite: "",
  signature_lieu: "",
  signature_date: "",
  duree_arret: "",
  ipp: "",
  segment: "",
  gravite: "",
  statut_enquete: "",
};

const selectOptions = {
  sexe: [
    { value: "", label: "—" },
    { value: "HOMME", label: "Homme" },
    { value: "FEMME", label: "Femme" },
  ],
  activite: [
    { value: "", label: "—" },
    { value: "CHANTIER", label: "Chantier" },
    { value: "ATELIER", label: "Atelier" },
    { value: "BUREAU", label: "Bureau" },
    { value: "AUTRE", label: "Autre" },
  ],
  resultat: [
    { value: "", label: "—" },
    { value: "SANS_ARRET", label: "Sans arrêt" },
    { value: "ARRET", label: "Arrêt de travail" },
    { value: "DECES", label: "Décès" },
  ],
  gravite: [
    { value: "", label: "—" },
    { value: "FAIBLE", label: "Faible" },
    { value: "MOYENNE", label: "Moyenne" },
    { value: "GRAVE", label: "Grave" },
  ],
  statut: [
    { value: "", label: "—" },
    { value: "EN_ATTENTE", label: "En attente" },
    { value: "EN_COURS", label: "En cours" },
    { value: "TERMINEE", label: "Terminée" },
  ],
};

const normalizeSexe = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (["H", "HOMME", "M", "MASCULIN", "MALE"].includes(normalized)) return "HOMME";
  if (["F", "FEMME", "FEMININ", "FÉMININ", "FEMALE"].includes(normalized)) {
    return "FEMME";
  }
  return "";
};

export default function AccidentsPage() {
  const [accidents, setAccidents] = useState([]);
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [matriculeSearch, setMatriculeSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selectedAccident, setSelectedAccident] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const filteredAccidents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accidents.filter(
      (item) =>
        matchesSiteFilter(item.site_nom, siteFilter) &&
        (!q ||
          [
            item.matricule,
            item.collaborateur_nom,
            item.collaborateur_prenom,
            item.date_accident,
            item.lieu_accident,
            item.nature_lesion,
            item.siege_lesion,
            item.cause,
            item.site_nom,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q))
    );
  }, [accidents, search, siteFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await api.get("/medical/accidents-travail/");
      setAccidents(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setErr("Erreur lors du chargement des accidents.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCollaborateur = async () => {
    const matricule = matriculeSearch.trim();
    if (!matricule) {
      setSearchError("Veuillez entrer une matricule.");
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError("");

      const profile = await getCollaborateurProfilByMatricule(matricule);
      const collab = profile?.collaborateur || profile || {};

      if (!collab?.matricule) {
        setSelectedProfile(null);
        setSearchError("Aucun collaborateur trouvé avec cette matricule.");
        return;
      }

      setSelectedProfile(profile);

      const dossier = profile?.dossier_medical || {};
      const site = collab.site && typeof collab.site === "object" ? collab.site : {};
      const siteName = typeof collab.site === "string" ? collab.site : site.nom;
      const lieuTravail =
        collab.lieu_travail_habituel ||
        collab.lieu_travail ||
        siteName ||
        collab.departement ||
        "";

      setForm((prev) => ({
        ...prev,
        matricule,
        victime_cnss: collab.cnss || collab.numero_cnss || dossier.numero_cnss || "",
        victime_nom: collab.nom || collab.last_name || "",
        victime_prenom: collab.prenom || collab.first_name || "",
        victime_nom_naissance: collab.nom_naissance || collab.nom || "",
        victime_prenom_pere: collab.nom_pere || collab.prenom_pere || "",
        victime_nationalite: collab.nationalite || "Tunisienne",
        victime_sexe: normalizeSexe(collab.sexe || collab.genre),
        victime_date_naissance: collab.date_naissance || "",
        victime_lieu_naissance:
          collab.lieu_naissance || dossier.lieu_naissance || "",
        victime_cin: collab.cin || collab.numero_cin || "",
        victime_adresse: collab.adresse || dossier.adresse || "",
        victime_code_postal: collab.code_postal || dossier.code_postal || "",
        victime_date_embauche:
          collab.date_embauche ||
          collab.date_recrutement ||
          dossier.date_recrutement ||
          "",
        victime_specialite: collab.specialite || dossier.specialite || "",
        victime_situation:
          collab.situation || collab.situation_familiale || dossier.situation || "",
        victime_profession: collab.profession || dossier.profession || "",
        victime_poste_accident:
          collab.poste_occupe ||
          collab.poste ||
          collab.poste_nom ||
          dossier.poste_travail_actuel ||
          "",
        victime_lieu_travail: lieuTravail,
        segment: collab.segment_nom || collab.segment?.nom || prev.segment,
      }));
    } catch (e) {
      console.error(e);
      setSelectedProfile(null);
      if (e?.response?.status === 404) {
        setSearchError("Aucun collaborateur trouvé avec cette matricule.");
      } else {
        setSearchError("Erreur lors de la recherche du collaborateur.");
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setMatriculeSearch("");
    setSearchError("");
    setSelectedProfile(null);
    setEditingId(null);
    setShowForm(false);
  };

  const buildPayload = (dossierId) => ({
    dossier: dossierId,
    employeur_cnss: form.employeur_cnss,
    employeur_nom: form.employeur_nom,
    employeur_adresse: form.employeur_adresse,
    employeur_code_postal: form.employeur_code_postal,
    employeur_telephone: form.employeur_telephone,
    employeur_activite: form.employeur_activite,
    victime_cnss: form.victime_cnss,
    victime_nom: form.victime_nom,
    victime_prenom: form.victime_prenom,
    victime_nom_naissance: form.victime_nom_naissance,
    victime_prenom_pere: form.victime_prenom_pere,
    victime_nationalite: form.victime_nationalite,
    victime_sexe: form.victime_sexe || null,
    victime_date_naissance: form.victime_date_naissance || null,
    victime_lieu_naissance: form.victime_lieu_naissance,
    victime_cin: form.victime_cin,
    victime_adresse: form.victime_adresse,
    victime_code_postal: form.victime_code_postal,
    victime_date_embauche: form.victime_date_embauche || null,
    victime_specialite: form.victime_specialite,
    victime_situation: form.victime_situation,
    victime_profession: form.victime_profession,
    victime_poste_accident: form.victime_poste_accident,
    victime_lieu_travail: form.victime_lieu_travail,
    autres_victimes: form.autres_victimes,
    date_accident: form.date_accident,
    heure_accident: form.heure_accident || null,
    lieu_accident: form.lieu_accident,
    circonstances: form.description_circonstances,
    horaire_travail_debut: form.horaire_travail_debut || null,
    horaire_travail_fin: form.horaire_travail_fin || null,
    activite_lieu: form.activite_lieu || null,
    activite_lieu_autre: form.activite_lieu_autre,
    nombre_travailleurs: form.nombre_travailleurs
      ? Number(form.nombre_travailleurs)
      : null,
    description_circonstances: form.description_circonstances,
    causes_materielles: form.causes_materielles,
    comment_accident: form.comment_accident,
    cause: form.cause,
    nature_lesion: form.nature_lesion,
    siege_lesion: form.siege_lesion,
    transport_hopital: form.transport_hopital,
    resultat: form.resultat || null,
    date_arret: form.date_arret || null,
    heure_arret: form.heure_arret || null,
    salaire_maintenu: form.salaire_maintenu,
    salaire_duree: form.salaire_duree,
    salaire_montant: form.salaire_montant,
    salaire_unite: form.salaire_unite,
    temoin1_nom: form.temoin1_nom,
    temoin1_telephone: form.temoin1_telephone,
    temoin1_matricule: form.temoin1_matricule,
    temoin2_nom: form.temoin2_nom,
    temoin2_telephone: form.temoin2_telephone,
    temoin2_matricule: form.temoin2_matricule,
    temoins: form.temoins,
    rapport_police: form.rapport_police,
    rapport_police_numero: form.rapport_police_numero,
    rapport_police_date: form.rapport_police_date || null,
    rapport_police_poste: form.rapport_police_poste,
    tiers_responsable: form.tiers_responsable,
    tiers_nom: form.tiers_nom,
    tiers_assureur: form.tiers_assureur,
    signataire_nom: form.signataire_nom,
    signataire_qualite: form.signataire_qualite,
    signature_lieu: form.signature_lieu,
    signature_date: form.signature_date || null,
    duree_arret: form.duree_arret ? Number(form.duree_arret) : null,
    ipp: form.ipp,
    segment: form.segment,
    gravite: form.gravite || null,
    statut_enquete: form.statut_enquete || null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.matricule.trim()) {
      setErr("Veuillez saisir une matricule valide.");
      return;
    }

    try {
      setSaving(true);
      setErr("");
      const dossierRes = await api.get(
        `/medical/dossier/matricule/${form.matricule.trim()}/`
      );
      const dossierId = dossierRes.data?.id;
      if (!dossierId) {
        setErr("Dossier médical introuvable.");
        return;
      }

      const payload = buildPayload(dossierId);

      if (editingId) {
        await api.patch(`/medical/accidents-travail/${editingId}/`, payload);
      } else {
        await api.post("/medical/accidents-travail/", payload);
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      setErr("Erreur lors de l'enregistrement de l'accident.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setSelectedAccident(item);
    setMatriculeSearch(item.matricule || "");
    setSearchError("");
    setForm({
      ...emptyForm,
      ...item,
      matricule: item.matricule || "",
    });
    setShowForm(true);
  };

  const handlePrint = async (id) => {
    try {
      const res = await api.get(`/medical/accidents-travail/${id}/pdf/`, {
        responseType: "blob",
      });
      const file = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(file);
      window.open(url, "_blank");
    } catch (e) {
      console.error(e);
      setErr("Impossible d'ouvrir le PDF.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Module Infirmier</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Déclaration d'accident du travail
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Saisie, consultation, modification et impression du formulaire officiel.
            </p>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            {showForm ? "Fermer le formulaire" : "Nouvelle déclaration"}
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {showForm && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? "Modifier la déclaration" : "Nouvelle déclaration"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler la modification
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Section title="Recherche par matricule">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Matricule collaborateur"
                  name="matricule"
                  value={matriculeSearch}
                  onChange={(e) => {
                    const { value } = e.target;
                    setMatriculeSearch(value);
                    setSearchError("");
                    setForm((prev) => ({ ...prev, matricule: value }));
                  }}
                  placeholder="Entrer la matricule"
                  required
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleSearchCollaborateur}
                    disabled={searchLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {searchLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Search size={16} />
                    )}
                    {searchLoading ? "Recherche..." : "Rechercher"}
                  </button>
                </div>
              </div>
              {searchError && (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {searchError}
                </div>
              )}
              {selectedProfile?.collaborateur && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <p className="font-medium text-slate-900">
                    {selectedProfile.collaborateur.prenom}{" "}
                    {selectedProfile.collaborateur.nom}
                  </p>
                  <p className="text-slate-600">
                    Poste: {selectedProfile.collaborateur.poste || "—"} · Segment:{" "}
                    {selectedProfile.collaborateur.segment_nom ||
                      selectedProfile.collaborateur.segment?.nom ||
                      "—"}
                  </p>
                  <p className="text-slate-600">
                    Site: {getSiteName(selectedProfile.collaborateur.site)}
                  </p>
                </div>
              )}
            </Section>

            <Section title="Employeur">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="CNSS employeur" name="employeur_cnss" value={form.employeur_cnss} onChange={handleChange} />
                <InputField label="Nom employeur" name="employeur_nom" value={form.employeur_nom} onChange={handleChange} />
                <InputField label="Adresse" name="employeur_adresse" value={form.employeur_adresse} onChange={handleChange} />
                <InputField label="Code postal" name="employeur_code_postal" value={form.employeur_code_postal} onChange={handleChange} />
                <InputField label="Téléphone" name="employeur_telephone" value={form.employeur_telephone} onChange={handleChange} />
                <InputField label="Nature d'activité" name="employeur_activite" value={form.employeur_activite} onChange={handleChange} />
              </div>
            </Section>

            <Section title="Victime">
              <div className="grid gap-4 md:grid-cols-3">
                <InputField label="CNSS victime" name="victime_cnss" value={form.victime_cnss} onChange={handleChange} />
                <InputField label="Nom" name="victime_nom" value={form.victime_nom} onChange={handleChange} />
                <InputField label="Prénom" name="victime_prenom" value={form.victime_prenom} onChange={handleChange} />
                <InputField label="Nom de naissance" name="victime_nom_naissance" value={form.victime_nom_naissance} onChange={handleChange} />
                <InputField label="Nom du père" name="victime_prenom_pere" value={form.victime_prenom_pere} onChange={handleChange} />
                <InputField label="Nationalité" name="victime_nationalite" value={form.victime_nationalite} onChange={handleChange} />
                <SelectField label="Sexe" name="victime_sexe" value={form.victime_sexe} onChange={handleChange} options={selectOptions.sexe} />
                <InputField label="Date naissance" name="victime_date_naissance" type="date" value={form.victime_date_naissance} onChange={handleChange} />
                <InputField label="Lieu naissance" name="victime_lieu_naissance" value={form.victime_lieu_naissance} onChange={handleChange} />
                <InputField label="CIN" name="victime_cin" value={form.victime_cin} onChange={handleChange} />
                <InputField label="Adresse" name="victime_adresse" value={form.victime_adresse} onChange={handleChange} />
                <InputField label="Code postal" name="victime_code_postal" value={form.victime_code_postal} onChange={handleChange} />
                <InputField label="Date embauche" name="victime_date_embauche" type="date" value={form.victime_date_embauche} onChange={handleChange} />
                <InputField label="Spécialité" name="victime_specialite" value={form.victime_specialite} onChange={handleChange} />
                <InputField label="Situation" name="victime_situation" value={form.victime_situation} onChange={handleChange} />
                <InputField label="Profession" name="victime_profession" value={form.victime_profession} onChange={handleChange} />
                <InputField label="Poste occupé" name="victime_poste_accident" value={form.victime_poste_accident} onChange={handleChange} />
                <InputField label="Lieu travail habituel" name="victime_lieu_travail" value={form.victime_lieu_travail} onChange={handleChange} />
                <InputField label="Site" value={getSiteName(selectedProfile?.collaborateur?.site)} readOnly />
                <CheckboxField label="Autres victimes" name="autres_victimes" checked={form.autres_victimes} onChange={handleChange} />
              </div>
            </Section>

            <Section title="Accident">
              <div className="grid gap-4 md:grid-cols-3">
                <InputField label="Date accident" name="date_accident" type="date" value={form.date_accident} onChange={handleChange} required />
                <InputField label="Heure accident" name="heure_accident" type="time" value={form.heure_accident} onChange={handleChange} />
                <InputField label="Lieu accident" name="lieu_accident" value={form.lieu_accident} onChange={handleChange} />
                <InputField label="Horaire début" name="horaire_travail_debut" type="time" value={form.horaire_travail_debut} onChange={handleChange} />
                <InputField label="Horaire fin" name="horaire_travail_fin" type="time" value={form.horaire_travail_fin} onChange={handleChange} />
                <SelectField label="Activité du lieu" name="activite_lieu" value={form.activite_lieu} onChange={handleChange} options={selectOptions.activite} />
                {form.activite_lieu === "AUTRE" && (
                  <InputField label="Autre activité" name="activite_lieu_autre" value={form.activite_lieu_autre} onChange={handleChange} />
                )}
                <InputField label="Nombre travailleurs" name="nombre_travailleurs" type="number" value={form.nombre_travailleurs} onChange={handleChange} />
                <InputField label="Cause" name="cause" value={form.cause} onChange={handleChange} required />
                <InputField label="Nature lésion" name="nature_lesion" value={form.nature_lesion} onChange={handleChange} required />
                <InputField label="Siège lésion" name="siege_lesion" value={form.siege_lesion} onChange={handleChange} required />
                <InputField label="Transport / transfert" name="transport_hopital" value={form.transport_hopital} onChange={handleChange} />
                <SelectField label="Résultat" name="resultat" value={form.resultat} onChange={handleChange} options={selectOptions.resultat} />
                <InputField label="Date arrêt" name="date_arret" type="date" value={form.date_arret} onChange={handleChange} />
                <InputField label="Heure arrêt" name="heure_arret" type="time" value={form.heure_arret} onChange={handleChange} />
                <SelectField label="Gravité" name="gravite" value={form.gravite} onChange={handleChange} options={selectOptions.gravite} />
                <SelectField label="Statut enquête" name="statut_enquete" value={form.statut_enquete} onChange={handleChange} options={selectOptions.statut} />
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <TextareaField label="Description circonstances" name="description_circonstances" value={form.description_circonstances} onChange={handleChange} />
                <TextareaField label="Facteurs matériels" name="causes_materielles" value={form.causes_materielles} onChange={handleChange} />
                <TextareaField label="Comment l'accident est survenu" name="comment_accident" value={form.comment_accident} onChange={handleChange} />
              </div>
            </Section>

            <Section title="Salaire / arrêt">
              <div className="grid gap-4 md:grid-cols-3">
                <CheckboxField label="Salaire maintenu" name="salaire_maintenu" checked={form.salaire_maintenu} onChange={handleChange} />
                <InputField label="Durée" name="salaire_duree" value={form.salaire_duree} onChange={handleChange} />
                <InputField label="Montant" name="salaire_montant" value={form.salaire_montant} onChange={handleChange} />
                <InputField label="Unité (jour/mois...)" name="salaire_unite" value={form.salaire_unite} onChange={handleChange} />
                <InputField label="Durée arrêt (jours)" name="duree_arret" type="number" value={form.duree_arret} onChange={handleChange} />
                <InputField label="IPP" name="ipp" value={form.ipp} onChange={handleChange} />
              </div>
            </Section>

            <Section title="Témoins">
              <div className="grid gap-4 md:grid-cols-3">
                <InputField label="Témoin 1 nom" name="temoin1_nom" value={form.temoin1_nom} onChange={handleChange} />
                <InputField label="Témoin 1 téléphone" name="temoin1_telephone" value={form.temoin1_telephone} onChange={handleChange} />
                <InputField label="Témoin 1 matricule" name="temoin1_matricule" value={form.temoin1_matricule} onChange={handleChange} />
                <InputField label="Témoin 2 nom" name="temoin2_nom" value={form.temoin2_nom} onChange={handleChange} />
                <InputField label="Témoin 2 téléphone" name="temoin2_telephone" value={form.temoin2_telephone} onChange={handleChange} />
                <InputField label="Témoin 2 matricule" name="temoin2_matricule" value={form.temoin2_matricule} onChange={handleChange} />
              </div>
              <div className="mt-4">
                <TextareaField label="Autres témoins (nom, adresse)" name="temoins" value={form.temoins} onChange={handleChange} />
              </div>
            </Section>

            <Section title="Police / tiers">
              <div className="grid gap-4 md:grid-cols-2">
                <CheckboxField label="Rapport police" name="rapport_police" checked={form.rapport_police} onChange={handleChange} />
                <InputField label="Numéro rapport" name="rapport_police_numero" value={form.rapport_police_numero} onChange={handleChange} />
                <InputField label="Date rapport" name="rapport_police_date" type="date" value={form.rapport_police_date} onChange={handleChange} />
                <InputField label="Poste / centre" name="rapport_police_poste" value={form.rapport_police_poste} onChange={handleChange} />
                <CheckboxField label="Tiers responsable" name="tiers_responsable" checked={form.tiers_responsable} onChange={handleChange} />
                <InputField label="Nom tiers" name="tiers_nom" value={form.tiers_nom} onChange={handleChange} />
                <InputField label="Assureur tiers" name="tiers_assureur" value={form.tiers_assureur} onChange={handleChange} />
              </div>
            </Section>

            <Section title="Signature">
              <div className="grid gap-4 md:grid-cols-3">
                <InputField label="Nom signataire" name="signataire_nom" value={form.signataire_nom} onChange={handleChange} />
                <InputField label="Qualité" name="signataire_qualite" value={form.signataire_qualite} onChange={handleChange} />
                <InputField label="Lieu" name="signature_lieu" value={form.signature_lieu} onChange={handleChange} />
                <InputField label="Date" name="signature_date" type="date" value={form.signature_date} onChange={handleChange} />
              </div>
            </Section>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingId ? "Mettre à jour" : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Liste des déclarations</h2>
            <p className="text-sm text-slate-500">
              Recherche, consultation, modification et impression.
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher par matricule ou date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-slate-900"
            />
          </div>
          <select
            value={siteFilter}
            onChange={(event) => setSiteFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 lg:w-56"
          >
            {SITE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Collaborateur</th>
                  <th className="px-3 py-3 font-medium">Matricule</th>
                  <th className="px-3 py-3 font-medium">Site</th>
                  <th className="px-3 py-3 font-medium">Lésion</th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAccidents.length > 0 ? (
                  filteredAccidents.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3 text-slate-700">{item.date_accident}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {item.collaborateur_prenom} {item.collaborateur_nom}
                      </td>
                      <td className="px-3 py-3 text-slate-700">{item.matricule}</td>
                      <td className="px-3 py-3 text-slate-700">{getSiteName(item.site_nom)}</td>
                      <td className="px-3 py-3 text-slate-700">{item.nature_lesion}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedAccident(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Eye size={14} />
                            Voir
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <PencilLine size={14} />
                            Modifier
                          </button>
                          <button
                            onClick={() => handlePrint(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            <Printer size={14} />
                            Imprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-3 py-10 text-center text-slate-500">
                      Aucune déclaration trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedAccident && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Détail de la déclaration
              </h2>
              <p className="text-sm text-slate-500">
                Matricule {selectedAccident.matricule}
              </p>
            </div>
            <button
              onClick={() => setSelectedAccident(null)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Fermer
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Info label="Date accident" value={selectedAccident.date_accident} />
            <Info label="Heure accident" value={selectedAccident.heure_accident || "-"} />
            <Info label="Lieu" value={selectedAccident.lieu_accident || "-"} />
            <Info label="Nature lésion" value={selectedAccident.nature_lesion} />
            <Info label="Siège lésion" value={selectedAccident.siege_lesion} />
            <Info label="Cause" value={selectedAccident.cause} />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => handleEdit(selectedAccident)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <PencilLine size={16} />
              Modifier
            </button>
            <button
              onClick={() => handlePrint(selectedAccident.id)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Printer size={16} />
              Imprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InputField({ label, name, value, onChange, type = "text", required, placeholder, readOnly = false }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${
          readOnly
            ? "border-slate-200 bg-slate-50 text-slate-600"
            : "border-slate-300 focus:border-slate-900"
        }`}
      />
    </div>
  );
}

function TextareaField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value || "-"}</p>
    </div>
  );
}


