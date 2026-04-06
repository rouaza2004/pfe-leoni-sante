import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/api/api";
import { Search, User, FilePlus2, FolderOpen } from "lucide-react";

const getDossierStatus = (collab, dossier) => {
  const hasCollabInfo =
    !!collab?.cin &&
    !!collab?.date_naissance &&
    !!collab?.telephone &&
    !!collab?.poste &&
    !!collab?.departement;

  const hasDossierInfo = !!dossier?.entreprise && !!dossier?.localite;

  return hasCollabInfo && hasDossierInfo;
};

const tabs = [
  { id: "profil", label: "Profil & Administratif" },
  { id: "dossier", label: "Dossier Médical" },
  { id: "rdv", label: "Rendez-vous" },
  { id: "analyses", label: "Analyses" },
];

const createTabs = [
  { id: "tab1", label: "Dossier médical" },
  { id: "tab2", label: "Examen médical" },
];

const InfoCard = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <div className="mt-3 space-y-2 text-sm text-slate-600">{children}</div>
  </div>
);

const SectionCard = ({ title, children, hint }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
      </div>
    </div>
    <div className="mt-4 space-y-4">{children}</div>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
    {text}
  </div>
);

const StatCard = ({ icon, label, value, tone }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
      {icon}
    </div>
    <div>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  </div>
);

const formatDate = (value) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR");
};

const getInitials = (prenom, nom) =>
  `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase() || "--";

const formatAllergies = (value) => {
  if (!value) return "Aucune";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "Aucune";
  return value;
};

const resolveStatus = (collab) => {
  const statut = collab?.dossier_medical_data?.statut;
  if (statut === "COMPLET") {
    return { label: "Complet", tone: "bg-emerald-500 text-white" };
  }
  if (statut === "EN_COURS") {
    return { label: "En cours", tone: "bg-sky-500 text-white" };
  }
  if (statut === "INCOMPLET") {
    return { label: "Incomplet", tone: "bg-rose-500 text-white" };
  }
  if (collab?.dossier_complet) {
    return { label: "Complet", tone: "bg-emerald-500 text-white" };
  }
  if (collab?.dossier_medical_data) {
    return { label: "En cours", tone: "bg-sky-500 text-white" };
  }
  return { label: "Incomplet", tone: "bg-rose-500 text-white" };
};

const statusKey = (collab) => {
  const statut = collab?.dossier_medical_data?.statut;
  if (statut) return statut;
  if (collab?.dossier_complet) return "COMPLET";
  if (collab?.dossier_medical_data) return "EN_COURS";
  return "INCOMPLET";
};

const buildExamenUlterieurConclusion = (row) => {
  const parts = [];
  if (row.visionOD || row.visionOG) {
    parts.push(`Vision OD: ${row.visionOD || "-"} | OG: ${row.visionOG || "-"}`);
  }
  if (row.audition) {
    parts.push(`Audition: ${row.audition}`);
  }
  if (row.observations) {
    parts.push(row.observations);
  }
  return parts.join(" | ");
};

export default function CollaborateursMedTravail() {
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("profil");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTab, setCreateTab] = useState("tab1");
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formErrorMsg, setFormErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const redirectedRef = useRef(false);
  const formInitialRef = useRef(null);
  const firstFieldRef = useRef(null);

  const target = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("target") || "dossier";
  }, [location.search]);

  const isDossiersPage = target === "dossier";

  const todayISO = useMemo(() => {
    const d = new Date();
    const pad = (v) => `${v}`.padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const emptyForm = useCallback(
    () => ({
      collaborateurId: "",
      matricule: "",
      nomComplet: "",
      departement: "",
      entreprise: "",
      localite: "",
      dateNaissance: "",
      lieuNaissance: "",
      adresse: "",
      niveauEtudes: "",
      profession: "",
      posteTravail: "",
      dateRecrutement: "",
      antecedentsMedicaux: "",
      antecedentsChirurgicaux: "",
      antecedentsGynecologiques: "",
      antecedentsHeredofamiliaux: "",
      tabac: "",
      alcool: "",
      automedication: "",
      groupeSanguin: "",
      allergies: "",
      traitementsEnCours: "",
      observations: "",
      statut: "EN_COURS",
      dateCreation: todayISO,
    }),
    [todayISO]
  );

  const emptyHistorique = () => ({
    poste: "",
    entreprise: "",
    periodeDu: "",
    periodeAu: "",
  });

  const emptyPoste = () => ({
    dateDebut: "",
    dateFin: "",
    description: "",
    risque: "",
  });

  const emptyAccident = () => ({
    dateAccident: "",
    cause: "",
    natureLesion: "",
    siegeLesion: "",
    dureeArret: "",
    ipp: "",
  });

  const emptyMaladie = () => ({
    nom: "",
    agent: "",
    numeroTableau: "",
    dateDecouverte: "",
    dureeArret: "",
    ipp: "",
  });

  const emptyExamenUlterieur = () => ({
    typeExamen: "PERIODIQUE",
    date: "",
    medecinNom: "",
    posteTravail: "",
    poids: "",
    taille: "",
    visionOD: "",
    visionOG: "",
    audition: "",
    observations: "",
  });

  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [historiquePro, setHistoriquePro] = useState([emptyHistorique()]);
  const [postesTravail, setPostesTravail] = useState([emptyPoste()]);
  const [accidentsTravail, setAccidentsTravail] = useState([emptyAccident()]);
  const [maladiesPro, setMaladiesPro] = useState([emptyMaladie()]);
  const [vaccinations, setVaccinations] = useState([
    { vaccin: "La tuberculose", date1: "", date2: "", date3: "", rappel: "" },
    { vaccin: "Le tétanos", date1: "", date2: "", date3: "", rappel: "" },
    { vaccin: "L’hépatite virale", date1: "", date2: "", date3: "", rappel: "" },
    { vaccin: "", date1: "", date2: "", date3: "", rappel: "" },
  ]);
  const [examenInitial, setExamenInitial] = useState({
    medecinNom: "",
    dateExamen: "",
    poids: "",
    taille: "",
    visionODPres: "",
    visionOGPres: "",
    visionODLoin: "",
    visionOGLoin: "",
    auditionOD: "",
    auditionOG: "",
    denture: "",
    teguments: "",
    appareilLocomoteur: "",
    appareilRespiratoire: "",
    appareilCardio: "",
    pouls: "",
    tension: "",
    abdomen: "",
    appareilGenito: "",
    glandes: "",
    systemeNerveux: "",
    examensComplementaires: "",
    resultatExamen: "",
    aptitude: "",
    precisionAptitude: "",
    conclusion: "",
  });
  const [examensUlterieurs, setExamensUlterieurs] = useState([emptyExamenUlterieur()]);

  const resolveTargetRoute = (collabId) => {
    switch (target) {
      case "demande-analyse":
        return `/medecin-travail/analyses-labo?collaborateurId=${collabId}`;
      case "examen-complementaire":
        return `/medecin-travail/collaborateurs/${collabId}/examen-complementaire`;
      case "fiche-aptitude":
        return `/medecin-travail/collaborateurs/${collabId}/fiche-aptitude`;
      case "examens-initial":
      case "dossier":
      default:
        return `/medecin-travail/collaborateurs/${collabId}/dossier`;
    }
  };

  const fetchCollaborateurs = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");

      const res = await api.get("/collaborateurs/");
      const collabs = Array.isArray(res.data) ? res.data : [];

      const enriched = await Promise.all(
        collabs.map(async (c) => {
          try {
            const dossierRes = await api.get(`/medical/dossier/${c.id}/`);
            const dossier = dossierRes.data || null;
            const dossierComplet = getDossierStatus(c, dossier);

        return {
          ...c,
          dossier_medical_data: dossier,
          dossier_complet: dossierComplet,
        };
      });

      setCollaborateurs(enriched);
    } catch (error) {
      if (error?.response?.status === 401 && !redirectedRef.current) {
        redirectedRef.current = true;
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }
      console.error(error);
      setErr("Impossible de charger les dossiers médicaux.");
      setCollaborateurs([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        navigate("/login", { replace: true });
      }
      return;
    }
    fetchCollaborateurs();
  }, [fetchCollaborateurs, navigate]);

  useEffect(() => {
    if (!selectedId && collaborateurs.length > 0) {
      setSelectedId(collaborateurs[0].id);
    }
  }, [collaborateurs, selectedId]);

  useEffect(() => {
    if (!showCreateModal) return;
    const handleKey = (e) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showCreateModal]);

  useEffect(() => {
    if (showCreateModal) {
      setTimeout(() => {
        firstFieldRef.current?.focus();
      }, 0);
    }
  }, [showCreateModal]);

  const filtered = useMemo(() => {
    const dossiersOnly = collaborateurs.filter((c) => c.dossier_medical_data);
    const q = search.trim().toLowerCase();
    if (!q) return dossiersOnly;
    return dossiersOnly.filter((c) =>
      `${c.nom || ""} ${c.prenom || ""} ${c.matricule || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [collaborateurs, search]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return collaborateurs.find((c) => c.id === selectedId) || null;
  }, [collaborateurs, selectedId]);

  const stats = useMemo(() => {
    const dossiersOnly = collaborateurs.filter((c) => c.dossier_medical_data);
    const total = dossiersOnly.length;
    const complets = dossiersOnly.filter((c) => statusKey(c) === "COMPLET").length;
    const enCours = dossiersOnly.filter((c) => statusKey(c) === "EN_COURS").length;
    const incomplets = dossiersOnly.filter((c) => statusKey(c) === "INCOMPLET").length;

    return { total, complets, enCours, incomplets };
  }, [collaborateurs]);

  const newCandidates = useMemo(() => {
    return collaborateurs.filter((c) => !c.dossier_medical_data);
  }, [collaborateurs]);

  const isDirty = useMemo(() => {
    if (!formInitialRef.current) return false;
    return (
      Object.keys(formInitialRef.current).some(
        (key) => formInitialRef.current[key] !== form[key]
      ) ||
      historiquePro.some((row) => Object.values(row).some((v) => v)) ||
      postesTravail.some((row) => Object.values(row).some((v) => v)) ||
      accidentsTravail.some((row) => Object.values(row).some((v) => v)) ||
      maladiesPro.some((row) => Object.values(row).some((v) => v)) ||
      vaccinations.some((row) => Object.values(row).some((v) => v)) ||
      examensUlterieurs.some((row) => Object.values(row).some((v) => v)) ||
      Object.values(examenInitial).some((v) => v) ||
      !!photoFile
    );
  }, [
    form,
    historiquePro,
    postesTravail,
    accidentsTravail,
    maladiesPro,
    vaccinations,
    examensUlterieurs,
    examenInitial,
    photoFile,
  ]);

  const openCreateModal = () => {
    const next = emptyForm();
    formInitialRef.current = next;
    setForm(next);
    setCreateTab("tab1");
    setPhotoFile(null);
    setHistoriquePro([emptyHistorique()]);
    setPostesTravail([emptyPoste()]);
    setAccidentsTravail([emptyAccident()]);
    setMaladiesPro([emptyMaladie()]);
    setVaccinations([
      { vaccin: "La tuberculose", date1: "", date2: "", date3: "", rappel: "" },
      { vaccin: "Le tétanos", date1: "", date2: "", date3: "", rappel: "" },
      { vaccin: "L’hépatite virale", date1: "", date2: "", date3: "", rappel: "" },
      { vaccin: "", date1: "", date2: "", date3: "", rappel: "" },
    ]);
    setExamenInitial({
      medecinNom: "",
      dateExamen: "",
      poids: "",
      taille: "",
      visionODPres: "",
      visionOGPres: "",
      visionODLoin: "",
      visionOGLoin: "",
      auditionOD: "",
      auditionOG: "",
      denture: "",
      teguments: "",
      appareilLocomoteur: "",
      appareilRespiratoire: "",
      appareilCardio: "",
      pouls: "",
      tension: "",
      abdomen: "",
      appareilGenito: "",
      glandes: "",
      systemeNerveux: "",
      examensComplementaires: "",
      resultatExamen: "",
      aptitude: "",
      precisionAptitude: "",
      conclusion: "",
    });
    setExamensUlterieurs([emptyExamenUlterieur()]);
    setFormErrors({});
    setFormErrorMsg("");
    setSuccessMsg("");
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    if (isDirty && !saving) {
      const confirmClose = window.confirm(
        "Des modifications non enregistrées existent. Fermer quand même ?"
      );
      if (!confirmClose) return;
    }
    setShowCreateModal(false);
  };

  const handleSelectCollaborateur = (collabId) => {
    const collab = collaborateurs.find((c) => String(c.id) === String(collabId));
    if (!collab) {
      setForm((prev) => ({
        ...prev,
        collaborateurId: collabId,
        matricule: "",
        nomComplet: "",
        departement: "",
        entreprise: "",
        localite: "",
        dateNaissance: "",
        adresse: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      collaborateurId: String(collab.id),
      matricule: collab.matricule || "",
      nomComplet: `${collab.prenom || ""} ${collab.nom || ""}`.trim(),
      departement: collab.departement || "",
      entreprise: collab.site?.nom || prev.entreprise,
      localite: collab.site?.localite || prev.localite,
      dateNaissance: collab.date_naissance || "",
      adresse: collab.adresse || "",
    }));

    if (collab.dossier_medical_data) {
      setFormErrors((prev) => ({
        ...prev,
        collaborateurId: "Ce collaborateur possède déjà un dossier médical.",
      }));
    } else {
      setFormErrors((prev) => ({
        ...prev,
        collaborateurId: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.collaborateurId) {
      errors.collaborateurId = "Le collaborateur est obligatoire.";
    }
    if (!form.dateCreation) {
      errors.dateCreation = "La date de création est obligatoire.";
    }

    const selectedCollab = collaborateurs.find(
      (c) => String(c.id) === String(form.collaborateurId)
    );
    if (selectedCollab?.dossier_medical_data) {
      errors.collaborateurId = "Ce collaborateur possède déjà un dossier médical.";
    }

    const hasExamenInitial = examenInitial.medecinNom || examenInitial.dateExamen;
    if (hasExamenInitial && (!examenInitial.medecinNom || !examenInitial.dateExamen)) {
      errors.examenInitial = "Renseignez le médecin et la date de l'examen initial.";
    }

    const invalidAccident = accidentsTravail.find(
      (row) =>
        Object.values(row).some((v) => v) &&
        (!row.dateAccident || !row.cause || !row.natureLesion || !row.siegeLesion)
    );
    if (invalidAccident) {
      errors.accidentsTravail = "Complétez les champs obligatoires pour chaque accident renseigné.";
    }

    const invalidMaladie = maladiesPro.find(
      (row) =>
        Object.values(row).some((v) => v) &&
        (!row.nom || !row.agent || !row.numeroTableau || !row.dateDecouverte)
    );
    if (invalidMaladie) {
      errors.maladiesPro = "Complétez les champs obligatoires pour chaque maladie renseignée.";
    }

    const invalidPoste = postesTravail.find(
      (row) => Object.values(row).some((v) => v) && (!row.dateDebut || !row.description)
    );
    if (invalidPoste) {
      errors.postesTravail = "Renseignez la date de début et la description du poste.";
    }

    const invalidHistorique = historiquePro.find(
      (row) => Object.values(row).some((v) => v) && (!row.poste || !row.periodeDu)
    );
    if (invalidHistorique) {
      errors.historiquePro = "Renseignez au minimum le poste et la période du.";
    }

    const invalidExamenUlterieur = examensUlterieurs.find(
      (row) =>
        Object.values(row).some((v) => v) &&
        (!row.date || !row.medecinNom || !row.typeExamen)
    );
    if (invalidExamenUlterieur) {
      errors.examensUlterieurs = "Renseignez le type, la date et le médecin pour chaque examen ultérieur.";
    }

    const invalidVaccination = vaccinations.find(
      (row, idx) =>
        idx === 3 &&
        (row.date1 || row.date2 || row.date3 || row.rappel) &&
        !row.vaccin
    );
    if (invalidVaccination) {
      errors.vaccinations = "Indiquez le vaccin pour la ligne Autres maladies.";
    }

    return errors;
  };

  const handleCreateDossier = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormErrorMsg("Merci de corriger les erreurs du formulaire.");
      return;
    }

    try {
      setSaving(true);
      setFormErrorMsg("");

      const payload = {
        collaborateur: Number(form.collaborateurId),
        entreprise: form.entreprise || "",
        localite: form.localite || "",
        date_recrutement: form.dateRecrutement || null,
        niveau_etudes_diplomes: form.niveauEtudes || "",
        profession: form.profession || "",
        poste_travail_actuel: form.posteTravail || "",
        antecedents_medicaux: form.antecedentsMedicaux || "",
        antecedents_chirurgicaux: form.antecedentsChirurgicaux || "",
        antecedents_gynecologiques: form.antecedentsGynecologiques || "",
        antecedents_heredofamiliaux: form.antecedentsHeredofamiliaux || "",
        tabac: form.tabac || "",
        alcool: form.alcool || "",
        automedication: form.automedication || "",
        groupe_sanguin: form.groupeSanguin || "",
        allergies: form.allergies || "",
        traitements_en_cours: form.traitementsEnCours || "",
        observations: form.observations || "",
        statut: form.statut || "EN_COURS",
      };

      const res = await api.post("/medical/dossiers/", payload);
      const dossier = res.data;

      const collabId = Number(form.collaborateurId);
      const updates = [];
      if (form.dateNaissance || form.adresse) {
        updates.push(
          api.patch(`/collaborateurs/${collabId}/`, {
            date_naissance: form.dateNaissance || null,
            adresse: form.adresse || "",
          })
        );
      }
      if (form.dateNaissance || form.lieuNaissance || form.adresse) {
        updates.push(
          api.patch(`/medical/fiche/${collabId}/`, {
            date_naissance: form.dateNaissance || null,
            lieu_naissance: form.lieuNaissance || "",
            adresse: form.adresse || "",
          })
        );
      }

      const vaccinPayloads = vaccinations
        .map((row, idx) => ({
          vaccin: idx === 3 ? row.vaccin : row.vaccin,
          date_1: row.date1 || null,
          date_2: row.date2 || null,
          date_3: row.date3 || null,
          date_rappel: row.rappel || null,
        }))
        .filter((row) => row.vaccin && (row.date_1 || row.date_2 || row.date_3 || row.date_rappel));

      vaccinPayloads.forEach((row) => {
        updates.push(api.post("/medical/vaccinations/", { ...row, dossier: dossier.id }));
      });

      const postesPayloads = [];
      historiquePro.forEach((row) => {
        if (!row.poste || !row.periodeDu) return;
        postesPayloads.push({
          date_debut: row.periodeDu,
          date_fin: row.periodeAu || null,
          description: `${row.poste}${row.entreprise ? ` - ${row.entreprise}` : ""}`,
          risque_professionnel: "Historique professionnel",
        });
      });

      postesTravail.forEach((row) => {
        if (!row.dateDebut || !row.description) return;
        postesPayloads.push({
          date_debut: row.dateDebut,
          date_fin: row.dateFin || null,
          description: row.description,
          risque_professionnel: row.risque || "",
        });
      });

      postesPayloads.forEach((row) => {
        updates.push(api.post("/medical/postes-travail/", { ...row, dossier: dossier.id }));
      });

      accidentsTravail.forEach((row) => {
        if (!row.dateAccident || !row.cause || !row.natureLesion || !row.siegeLesion) return;
        updates.push(
          api.post("/medical/accidents-travail/", {
            dossier: dossier.id,
            date_accident: row.dateAccident,
            cause: row.cause,
            nature_lesion: row.natureLesion,
            siege_lesion: row.siegeLesion,
            duree_arret: row.dureeArret || null,
            ipp: row.ipp || "",
          })
        );
      });

      maladiesPro.forEach((row) => {
        if (!row.nom || !row.agent || !row.numeroTableau || !row.dateDecouverte) return;
        updates.push(
          api.post("/medical/maladies-professionnelles/", {
            dossier: dossier.id,
            nom_maladie: row.nom,
            agent_causal: row.agent,
            numero_tableau: row.numeroTableau,
            date_decouverte: row.dateDecouverte,
            duree_arret: row.dureeArret || null,
            ipp: row.ipp || "",
          })
        );
      });

      if (examenInitial.medecinNom && examenInitial.dateExamen) {
        updates.push(
          api.post("/medical/examens-initial/", {
            dossier: dossier.id,
            medecin_nom: examenInitial.medecinNom,
            date_examen: examenInitial.dateExamen,
            poids: examenInitial.poids || null,
            taille: examenInitial.taille || null,
            vision_od_pres: examenInitial.visionODPres || "",
            vision_og_pres: examenInitial.visionOGPres || "",
            vision_od_loin: examenInitial.visionODLoin || "",
            vision_og_loin: examenInitial.visionOGLoin || "",
            audition_od: examenInitial.auditionOD || "",
            audition_og: examenInitial.auditionOG || "",
            denture: examenInitial.denture || "",
            teguments: examenInitial.teguments || "",
            appareil_locomoteur: examenInitial.appareilLocomoteur || "",
            appareil_respiratoire: examenInitial.appareilRespiratoire || "",
            appareil_cardio_vasculaire: examenInitial.appareilCardio || "",
            pouls: examenInitial.pouls || "",
            tension_arterielle: examenInitial.tension || "",
            abdomen: examenInitial.abdomen || "",
            appareil_genito_urinaire: examenInitial.appareilGenito || "",
            glandes_endocrines: examenInitial.glandes || "",
            systeme_nerveux: examenInitial.systemeNerveux || "",
            examens_complementaires: examenInitial.examensComplementaires || "",
            resultat_examen: examenInitial.resultatExamen || "",
            aptitude: examenInitial.aptitude || null,
            precision_aptitude: examenInitial.precisionAptitude || "",
            conclusion: examenInitial.conclusion || "",
          })
        );
      }

      examensUlterieurs.forEach((row) => {
        if (!row.date || !row.medecinNom || !row.typeExamen) return;
        updates.push(
          api.post("/medical/examens-ulterieurs/", {
            dossier: dossier.id,
            type_examen: row.typeExamen,
            date: row.date,
            medecin_nom: row.medecinNom,
            poste_travail: row.posteTravail || "",
            poids: row.poids || null,
            taille: row.taille || null,
            conclusion: buildExamenUlterieurConclusion(row),
          })
        );
      });

      await Promise.allSettled(updates);

      setCollaborateurs((prev) => {
        const existing = prev.find((c) => String(c.id) === String(collabId));
        if (!existing) return prev;
        const updated = {
          ...existing,
          dossier_medical_data: dossier,
          dossier_complet: getDossierStatus(existing, dossier),
        };
        const others = prev.filter((c) => c.id !== existing.id);
        return [updated, ...others];
      });

      setSuccessMsg("Dossier médical créé avec succès");
      setShowCreateModal(false);
    } catch (error) {
      const apiMsg = error?.response?.data?.detail;
      setFormErrorMsg(apiMsg || "Échec de création du dossier médical.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Chargement des dossiers...</div>;
  }

  if (err) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-600 shadow-sm">
          {err}
        </div>
      </div>
    );
  }

  if (!isDossiersPage) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">Accueil Collaborateur</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sélectionnez un collaborateur pour afficher ses détails.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher collaborateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="mt-4 max-h-[560px] space-y-2 overflow-auto pr-1">
              {filtered.map((c) => {
                const isSelected = c.id === selectedId;
                const segmentLabel =
                  c.segment_nom || c.segment?.nom || c.segment || "--";
                const posteLabel = c.poste || c.poste_nom || "--";

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                        {getInitials(c.prenom, c.nom)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {`${c.prenom || ""} ${c.nom || ""}`.trim() || "--"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {c.matricule || "--"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {posteLabel} · {segmentLabel}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filtered.length === 0 && (
                <p className="text-sm text-slate-500">Aucun collaborateur trouvé.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {!selected && (
              <EmptyState text="Sélectionnez un collaborateur pour afficher les détails." />
            )}

            {selected && (
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-700">
                      {getInitials(selected?.prenom, selected?.nom)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {`${selected?.prenom || ""} ${selected?.nom || ""}`.trim() ||
                          "--"}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Matricule : {selected?.matricule || "--"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selected?.poste || selected?.poste_nom || "--"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                      selected?.dossier_complet
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {selected?.dossier_complet ? "Dossier complet" : "Dossier incomplet"}
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                        activeTab === tab.id
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selected && activeTab === "profil" && (
              <div className="grid gap-4 lg:grid-cols-2">
                <InfoCard title="Informations Générales">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>
                      {`${selected?.prenom || ""} ${selected?.nom || ""}`.trim() ||
                        "--"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{selected?.email || "--"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-slate-400" />
                    <span>CIN : {selected?.cin || "--"}</span>
                  </div>
                </InfoCard>

                <InfoCard title="Poste & Département">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <span>{selected?.poste || selected?.poste_nom || "--"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span>{selected?.departement || "--"}</span>
                  </div>
                </InfoCard>

                <InfoCard title="Site / Segment">
                  <div>
                    Site :
                    <span className="ml-2 font-medium text-slate-700">
                      {selected?.site?.nom || "--"}
                    </span>
                  </div>
                  <div>
                    Localité :
                    <span className="ml-2 font-medium text-slate-700">
                      {selected?.site?.localite || "--"}
                    </span>
                  </div>
                  <div>
                    Segment :
                    <span className="ml-2 font-medium text-slate-700">
                      {selected?.segment_nom ||
                        selected?.segment?.nom ||
                        selected?.segment ||
                        "--"}
                    </span>
                  </div>
                </InfoCard>

                <InfoCard title="Statut & Validité">
                  <div>
                    Statut :
                    <span className="ml-2 font-medium text-slate-700">
                      {selected?.dossier_complet
                        ? "Dossier complet"
                        : "Dossier incomplet"}
                    </span>
                  </div>
                  <div>
                    Date recrutement :
                    <span className="ml-2 font-medium text-slate-700">
                      {formatDate(selected?.dossier_medical_data?.date_recrutement)}
                    </span>
                  </div>
                </InfoCard>
              </div>
            )}

            {selected && activeTab === "dossier" && (
              <div className="grid gap-4 lg:grid-cols-2">
                <InfoCard title="Dossier médical">
                  <div>
                    Entreprise :
                    <span className="ml-2 font-medium text-slate-700">
                      {selected?.dossier_medical_data?.entreprise || "--"}
                    </span>
                  </div>
                  <div>
                    Localité :
                    <span className="ml-2 font-medium text-slate-700">
                      {selected?.dossier_medical_data?.localite || "--"}
                    </span>
                  </div>
                  <div>
                    Médecin :
                    <span className="ml-2 font-medium text-slate-700">
                      {selected?.dossier_medical_data?.medecin_nom || "--"}
                    </span>
                  </div>
                </InfoCard>

                <InfoCard title="Suivi">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <span>
                      Dernière visite :
                      <span className="ml-2 font-medium text-slate-700">
                        {formatDate(selected?.dossier_medical_data?.date_derniere_visite)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <span>
                      Visite périodique :
                      <span className="ml-2 font-medium text-slate-700">
                        {formatDate(selected?.dossier_medical_data?.date_visite_periodique)}
                      </span>
                    </span>
                  </div>
                </InfoCard>
              </div>
            )}

            {selected && activeTab === "rdv" && (
              <EmptyState text="Les rendez-vous sont disponibles dans le module dédié." />
            )}

            {selected && activeTab === "analyses" && (
              <EmptyState text="Les analyses sont disponibles dans le module dédié." />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Dossiers médicaux</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gestion des dossiers médicaux des collaborateurs
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nouveau dossier
        </button>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMsg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FolderOpen className="h-5 w-5 text-blue-600" />}
          label="Total dossiers"
          value={stats.total}
          tone="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          label="Dossiers complets"
          value={stats.complets}
          tone="bg-emerald-50"
        />
        <StatCard
          icon={<Clock3 className="h-5 w-5 text-sky-600" />}
          label="Dossiers en cours"
          value={stats.enCours}
          tone="bg-sky-50"
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5 text-rose-600" />}
          label="Dossiers incomplets"
          value={stats.incomplets}
          tone="bg-rose-50"
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="dossiers-search"
            type="text"
            placeholder="Rechercher un collaborateur, dossier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrer
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            title="Options d'affichage"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto p-2 sm:p-4">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">ID</th>
                <th className="px-5 py-4 text-left font-semibold">Nom complet</th>
                <th className="px-5 py-4 text-left font-semibold">Date de création</th>
                <th className="px-5 py-4 text-left font-semibold">Groupe sanguin</th>
                <th className="px-5 py-4 text-left font-semibold">Allergies</th>
                <th className="px-5 py-4 text-left font-semibold">Statut</th>
                <th className="px-5 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const fullName = `${c.prenom || ""} ${c.nom || ""}`.trim() || "--";
                const status = resolveStatus(c);
                const dossierId = c?.dossier_medical_data?.id ?? "--";
                const groupeSanguin = c?.dossier_medical_data?.groupe_sanguin || "--";
                const allergies = formatAllergies(c?.dossier_medical_data?.allergies);

                return (
                  <tr
                    key={c.id}
                    className="bg-white text-slate-700 shadow-sm transition duration-200 hover:scale-[1.01] hover:shadow-md"
                  >
                    <td className="rounded-l-2xl px-5 py-5 font-medium text-slate-900">
                      {dossierId}
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                          {getInitials(c.prenom, c.nom)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{fullName}</p>
                          <p className="text-xs text-slate-500">
                            Matricule : {c.matricule || "--"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 text-slate-600">
                      {formatDate(c?.dossier_medical_data?.created_at)}
                    </td>
                    <td className="px-5 py-5">
                      <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {groupeSanguin}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-slate-600">{allergies}</td>
                    <td className="px-5 py-5">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          status.tone
                        }`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="rounded-r-2xl px-5 py-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/medecin-travail/collaborateurs/${c.id}`)
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:scale-[1.02] hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" />
                          Voir
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(resolveTargetRoute(c.id))}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:scale-[1.02] hover:border-slate-400 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="rounded-2xl bg-white px-6 py-10 text-center text-sm text-slate-500"
                  >
                    Aucun dossier trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        Astuce : utilisez la recherche pour filtrer par nom, prénom ou matricule.
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="mx-auto w-full max-w-6xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Créer un dossier médical
                </h2>
                <p className="text-xs text-slate-500">
                  Formulaire structuré selon le dossier médical du médecin du travail.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="self-start rounded-full p-2 text-slate-500 hover:bg-slate-100"
                title="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-100 px-6 py-3">
              {createTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCreateTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    createTab === tab.id
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateDossier} className="px-6 py-6">
              {formErrorMsg && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formErrorMsg}
                </div>
              )}

              {createTab === "tab1" && (
                <div className="space-y-6">
                  <SectionCard title="A — IDENTIFICATION DU TRAVAILLEUR">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Collaborateur
                        </label>
                        <select
                          ref={firstFieldRef}
                          value={form.collaborateurId}
                          onChange={(e) => handleSelectCollaborateur(e.target.value)}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        >
                          <option value="">Sélectionner un collaborateur</option>
                          {newCandidates.map((c) => (
                            <option key={c.id} value={c.id}>
                              {`${c.prenom || ""} ${c.nom || ""}`.trim()} ({c.matricule})
                            </option>
                          ))}
                        </select>
                        {formErrors.collaborateurId && (
                          <p className="mt-1 text-xs text-rose-600">
                            {formErrors.collaborateurId}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Matricule
                        </label>
                        <input
                          type="text"
                          value={form.matricule}
                          readOnly
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Entreprise
                        </label>
                        <input
                          type="text"
                          value={form.entreprise}
                          onChange={(e) => setForm((prev) => ({ ...prev, entreprise: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Localité
                        </label>
                        <input
                          type="text"
                          value={form.localite}
                          onChange={(e) => setForm((prev) => ({ ...prev, localite: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Nom et prénom
                        </label>
                        <input
                          type="text"
                          value={form.nomComplet}
                          readOnly
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Date de naissance
                        </label>
                        <input
                          type="date"
                          value={form.dateNaissance}
                          onChange={(e) => setForm((prev) => ({ ...prev, dateNaissance: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Lieu de naissance
                        </label>
                        <input
                          type="text"
                          value={form.lieuNaissance}
                          onChange={(e) => setForm((prev) => ({ ...prev, lieuNaissance: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Adresse
                        </label>
                        <input
                          type="text"
                          value={form.adresse}
                          onChange={(e) => setForm((prev) => ({ ...prev, adresse: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Photo (optionnel)
                        </label>
                        <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                          <Upload className="h-4 w-4 text-slate-400" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            className="text-xs text-slate-600"
                          />
                          <span className="text-xs text-slate-400">
                            {photoFile ? photoFile.name : "Non sauvegardé"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="B — QUALIFICATION DU TRAVAILLEUR">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Niveau d’études et diplômes
                        </label>
                        <input
                          type="text"
                          value={form.niveauEtudes}
                          onChange={(e) => setForm((prev) => ({ ...prev, niveauEtudes: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Profession
                        </label>
                        <input
                          type="text"
                          value={form.profession}
                          onChange={(e) => setForm((prev) => ({ ...prev, profession: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Poste de travail
                        </label>
                        <input
                          type="text"
                          value={form.posteTravail}
                          onChange={(e) => setForm((prev) => ({ ...prev, posteTravail: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Date de recrutement
                        </label>
                        <input
                          type="date"
                          value={form.dateRecrutement}
                          onChange={(e) => setForm((prev) => ({ ...prev, dateRecrutement: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Historique professionnel / affectations
                        </p>
                        <button
                          type="button"
                          onClick={() => setHistoriquePro((prev) => [...prev, emptyHistorique()])}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Ajouter une ligne
                        </button>
                      </div>
                      {formErrors.historiquePro && (
                        <p className="mt-1 text-xs text-rose-600">{formErrors.historiquePro}</p>
                      )}
                      <div className="mt-3 space-y-3">
                        {historiquePro.map((row, index) => (
                          <div key={index} className="grid gap-3 md:grid-cols-12">
                            <input
                              type="text"
                              placeholder="Profession / poste du travail"
                              value={row.poste}
                              onChange={(e) =>
                                setHistoriquePro((prev) =>
                                  prev.map((r, i) => (i === index ? { ...r, poste: e.target.value } : r))
                                )
                              }
                              className="md:col-span-4 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Nom et adresse de l’entreprise"
                              value={row.entreprise}
                              onChange={(e) =>
                                setHistoriquePro((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, entreprise: e.target.value } : r
                                  )
                                )
                              }
                              className="md:col-span-4 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <input
                              type="date"
                              value={row.periodeDu}
                              onChange={(e) =>
                                setHistoriquePro((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, periodeDu: e.target.value } : r
                                  )
                                )
                              }
                              className="md:col-span-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <div className="md:col-span-2 flex items-center gap-2">
                              <input
                                type="date"
                                value={row.periodeAu}
                                onChange={(e) =>
                                  setHistoriquePro((prev) =>
                                    prev.map((r, i) =>
                                      i === index ? { ...r, periodeAu: e.target.value } : r
                                    )
                                  )
                                }
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setHistoriquePro((prev) => prev.filter((_, i) => i !== index))
                                }
                                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="C — ANTÉCÉDENTS MÉDICAUX">
                    <div className="grid gap-4 md:grid-cols-2">
                      <textarea
                        rows={3}
                        placeholder="Antécédents médicaux"
                        value={form.antecedentsMedicaux}
                        onChange={(e) => setForm((prev) => ({ ...prev, antecedentsMedicaux: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={3}
                        placeholder="Antécédents chirurgicaux"
                        value={form.antecedentsChirurgicaux}
                        onChange={(e) => setForm((prev) => ({ ...prev, antecedentsChirurgicaux: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={3}
                        placeholder="Antécédents gynécologiques"
                        value={form.antecedentsGynecologiques}
                        onChange={(e) => setForm((prev) => ({ ...prev, antecedentsGynecologiques: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={3}
                        placeholder="Antécédents héréditaires ou familiaux"
                        value={form.antecedentsHeredofamiliaux}
                        onChange={(e) => setForm((prev) => ({ ...prev, antecedentsHeredofamiliaux: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </SectionCard>

                  <SectionCard title="D — HABITUDES">
                    <div className="grid gap-4 md:grid-cols-3">
                      <input
                        type="text"
                        placeholder="Tabac"
                        value={form.tabac}
                        onChange={(e) => setForm((prev) => ({ ...prev, tabac: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Alcool"
                        value={form.alcool}
                        onChange={(e) => setForm((prev) => ({ ...prev, alcool: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Automédication"
                        value={form.automedication}
                        onChange={(e) => setForm((prev) => ({ ...prev, automedication: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </div>
                  </SectionCard>

                  <SectionCard title="INFORMATIONS COMPLÉMENTAIRES">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Groupe sanguin
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: O+, A-"
                          value={form.groupeSanguin}
                          onChange={(e) => setForm((prev) => ({ ...prev, groupeSanguin: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Statut du dossier
                        </label>
                        <select
                          value={form.statut}
                          onChange={(e) => setForm((prev) => ({ ...prev, statut: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                        >
                          <option value="EN_COURS">En cours</option>
                          <option value="COMPLET">Complet</option>
                          <option value="INCOMPLET">Incomplet</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Allergies
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Pénicilline"
                          value={form.allergies}
                          onChange={(e) => setForm((prev) => ({ ...prev, allergies: e.target.value }))}
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Traitements en cours
                        </label>
                        <textarea
                          rows={2}
                          value={form.traitementsEnCours}
                          onChange={(e) => setForm((prev) => ({ ...prev, traitementsEnCours: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Observations
                        </label>
                        <textarea
                          rows={2}
                          value={form.observations}
                          onChange={(e) => setForm((prev) => ({ ...prev, observations: e.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="E — VACCINATIONS">
                    {formErrors.vaccinations && (
                      <p className="text-xs text-rose-600">{formErrors.vaccinations}</p>
                    )}
                    <div className="grid gap-3">
                      {vaccinations.map((row, idx) => (
                        <div key={idx} className="grid gap-3 md:grid-cols-5">
                          {idx === 3 ? (
                            <input
                              type="text"
                              placeholder="Autres maladies"
                              value={row.vaccin}
                              onChange={(e) =>
                                setVaccinations((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, vaccin: e.target.value } : r))
                                )
                              }
                              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                          ) : (
                            <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600">
                              {row.vaccin}
                            </div>
                          )}
                          <input
                            type="date"
                            value={row.date1}
                            onChange={(e) =>
                              setVaccinations((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, date1: e.target.value } : r))
                              )
                            }
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="date"
                            value={row.date2}
                            onChange={(e) =>
                              setVaccinations((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, date2: e.target.value } : r))
                              )
                            }
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="date"
                            value={row.date3}
                            onChange={(e) =>
                              setVaccinations((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, date3: e.target.value } : r))
                              )
                            }
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="date"
                            value={row.rappel}
                            onChange={(e) =>
                              setVaccinations((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, rappel: e.target.value } : r))
                              )
                            }
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="F — POSTES DE TRAVAIL AUXQUELS LE TRAVAILLEUR A ÉTÉ AFFECTÉ">
                    <div className="flex items-center justify-between">
                      {formErrors.postesTravail && (
                        <p className="text-xs text-rose-600">{formErrors.postesTravail}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => setPostesTravail((prev) => [...prev, emptyPoste()])}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Ajouter une ligne
                      </button>
                    </div>
                    <div className="mt-3 space-y-3">
                      {postesTravail.map((row, index) => (
                        <div key={index} className="grid gap-3 md:grid-cols-12">
                          <input
                            type="date"
                            value={row.dateDebut}
                            onChange={(e) =>
                              setPostesTravail((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, dateDebut: e.target.value } : r))
                              )
                            }
                            className="md:col-span-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="date"
                            value={row.dateFin}
                            onChange={(e) =>
                              setPostesTravail((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, dateFin: e.target.value } : r))
                              )
                            }
                            className="md:col-span-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Description du poste"
                            value={row.description}
                            onChange={(e) =>
                              setPostesTravail((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, description: e.target.value } : r))
                              )
                            }
                            className="md:col-span-4 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Nature du risque professionnel"
                            value={row.risque}
                            onChange={(e) =>
                              setPostesTravail((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, risque: e.target.value } : r))
                              )
                            }
                            className="md:col-span-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPostesTravail((prev) => prev.filter((_, i) => i !== index))
                            }
                            className="md:col-span-1 rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="G — ANTÉCÉDENTS D’ACCIDENTS DE TRAVAIL">
                    {formErrors.accidentsTravail && (
                      <p className="text-xs text-rose-600">{formErrors.accidentsTravail}</p>
                    )}
                    <div className="mt-2 space-y-3">
                      {accidentsTravail.map((row, index) => (
                        <div key={index} className="grid gap-3 md:grid-cols-12">
                          <input
                            type="date"
                            value={row.dateAccident}
                            onChange={(e) =>
                              setAccidentsTravail((prev) =>
                                prev.map((r, i) =>
                                  i === index ? { ...r, dateAccident: e.target.value } : r
                                )
                              )
                            }
                            className="md:col-span-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Cause"
                            value={row.cause}
                            onChange={(e) =>
                              setAccidentsTravail((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, cause: e.target.value } : r))
                              )
                            }
                            className="md:col-span-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Nature de la lésion"
                            value={row.natureLesion}
                            onChange={(e) =>
                              setAccidentsTravail((prev) =>
                                prev.map((r, i) =>
                                  i === index ? { ...r, natureLesion: e.target.value } : r
                                )
                              )
                            }
                            className="md:col-span-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Siège de la lésion"
                            value={row.siegeLesion}
                            onChange={(e) =>
                              setAccidentsTravail((prev) =>
                                prev.map((r, i) =>
                                  i === index ? { ...r, siegeLesion: e.target.value } : r
                                )
                              )
                            }
                            className="md:col-span-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Durée arrêt"
                            value={row.dureeArret}
                            onChange={(e) =>
                              setAccidentsTravail((prev) =>
                                prev.map((r, i) =>
                                  i === index ? { ...r, dureeArret: e.target.value } : r
                                )
                              )
                            }
                            className="md:col-span-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <div className="md:col-span-2 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="I.P.P."
                              value={row.ipp}
                              onChange={(e) =>
                                setAccidentsTravail((prev) =>
                                  prev.map((r, i) => (i === index ? { ...r, ipp: e.target.value } : r))
                                )
                              }
                              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setAccidentsTravail((prev) => prev.filter((_, i) => i !== index))
                              }
                              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setAccidentsTravail((prev) => [...prev, emptyAccident()])}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Ajouter un accident
                      </button>
                    </div>
                  </SectionCard>

                  <SectionCard title="H — ANTÉCÉDENTS DE MALADIES PROFESSIONNELLES">
                    {formErrors.maladiesPro && (
                      <p className="text-xs text-rose-600">{formErrors.maladiesPro}</p>
                    )}
                    <div className="mt-2 space-y-3">
                      {maladiesPro.map((row, index) => (
                        <div key={index} className="grid gap-3 md:grid-cols-12">
                          <input
                            type="text"
                            placeholder="Nom de la maladie"
                            value={row.nom}
                            onChange={(e) =>
                              setMaladiesPro((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, nom: e.target.value } : r))
                              )
                            }
                            className="md:col-span-3 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Agent causal"
                            value={row.agent}
                            onChange={(e) =>
                              setMaladiesPro((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, agent: e.target.value } : r))
                              )
                            }
                            className="md:col-span-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Numéro tableau"
                            value={row.numeroTableau}
                            onChange={(e) =>
                              setMaladiesPro((prev) =>
                                prev.map((r, i) =>
                                  i === index ? { ...r, numeroTableau: e.target.value } : r
                                )
                              )
                            }
                            className="md:col-span-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="date"
                            value={row.dateDecouverte}
                            onChange={(e) =>
                              setMaladiesPro((prev) =>
                                prev.map((r, i) =>
                                  i === index ? { ...r, dateDecouverte: e.target.value } : r
                                )
                              )
                            }
                            className="md:col-span-2 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Durée arrêt"
                            value={row.dureeArret}
                            onChange={(e) =>
                              setMaladiesPro((prev) =>
                                prev.map((r, i) =>
                                  i === index ? { ...r, dureeArret: e.target.value } : r
                                )
                              )
                            }
                            className="md:col-span-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                          />
                          <div className="md:col-span-2 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="I.P.P."
                              value={row.ipp}
                              onChange={(e) =>
                                setMaladiesPro((prev) =>
                                  prev.map((r, i) => (i === index ? { ...r, ipp: e.target.value } : r))
                                )
                              }
                              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setMaladiesPro((prev) => prev.filter((_, i) => i !== index))}
                              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setMaladiesPro((prev) => [...prev, emptyMaladie()])}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Ajouter une maladie
                      </button>
                    </div>
                  </SectionCard>
                </div>
              )}

              {createTab === "tab2" && (
                <div className="space-y-6">
                  <SectionCard title="I — EXAMEN MÉDICAL INITIAL">
                    {formErrors.examenInitial && (
                      <p className="text-xs text-rose-600">{formErrors.examenInitial}</p>
                    )}
                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Nom et prénom du médecin du travail"
                        value={examenInitial.medecinNom}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, medecinNom: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                      <input
                        type="date"
                        value={examenInitial.dateExamen}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, dateExamen: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Poids"
                        value={examenInitial.poids}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, poids: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Taille"
                        value={examenInitial.taille}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, taille: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <input
                        type="text"
                        placeholder="Vision près OD"
                        value={examenInitial.visionODPres}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, visionODPres: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Vision près OG"
                        value={examenInitial.visionOGPres}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, visionOGPres: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Vision loin OD"
                        value={examenInitial.visionODLoin}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, visionODLoin: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Vision loin OG"
                        value={examenInitial.visionOGLoin}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, visionOGLoin: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Audition oreille droite"
                        value={examenInitial.auditionOD}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, auditionOD: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Audition oreille gauche"
                        value={examenInitial.auditionOG}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, auditionOG: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <textarea
                        rows={2}
                        placeholder="Denture"
                        value={examenInitial.denture}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, denture: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={2}
                        placeholder="Téguments"
                        value={examenInitial.teguments}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, teguments: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={2}
                        placeholder="Appareil locomoteur"
                        value={examenInitial.appareilLocomoteur}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, appareilLocomoteur: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={2}
                        placeholder="Appareil respiratoire"
                        value={examenInitial.appareilRespiratoire}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, appareilRespiratoire: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={2}
                        placeholder="Appareil cardio-vasculaire"
                        value={examenInitial.appareilCardio}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, appareilCardio: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          type="text"
                          placeholder="Pouls"
                          value={examenInitial.pouls}
                          onChange={(e) =>
                            setExamenInitial((prev) => ({ ...prev, pouls: e.target.value }))
                          }
                          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Tension artérielle"
                          value={examenInitial.tension}
                          onChange={(e) =>
                            setExamenInitial((prev) => ({ ...prev, tension: e.target.value }))
                          }
                          className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Abdomen"
                        value={examenInitial.abdomen}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, abdomen: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={2}
                        placeholder="Appareil génito-urinaire"
                        value={examenInitial.appareilGenito}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, appareilGenito: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={2}
                        placeholder="Glandes endocrines"
                        value={examenInitial.glandes}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, glandes: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={2}
                        placeholder="Système nerveux"
                        value={examenInitial.systemeNerveux}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, systemeNerveux: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={2}
                        placeholder="Examens complémentaires"
                        value={examenInitial.examensComplementaires}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, examensComplementaires: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        rows={2}
                        placeholder="Résultat de l’examen médical"
                        value={examenInitial.resultatExamen}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, resultatExamen: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <select
                        value={examenInitial.aptitude}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, aptitude: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      >
                        <option value="">Conclusion aptitude</option>
                        <option value="APTE">Apte au poste du travail</option>
                        <option value="APTE_AVEC_CONDITION">Apte avec condition</option>
                        <option value="INAPTE_POSTE">Inapte au poste du travail</option>
                        <option value="INAPTE_DEFINITIF">Inapte définitif</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Précisions / mesures à prendre"
                        value={examenInitial.precisionAptitude}
                        onChange={(e) =>
                          setExamenInitial((prev) => ({ ...prev, precisionAptitude: e.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Conclusion"
                      value={examenInitial.conclusion}
                      onChange={(e) =>
                        setExamenInitial((prev) => ({ ...prev, conclusion: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </SectionCard>

                  <SectionCard title="J — EXAMENS MÉDICAUX ULTÉRIEURS">
                    {formErrors.examensUlterieurs && (
                      <p className="text-xs text-rose-600">{formErrors.examensUlterieurs}</p>
                    )}
                    <div className="space-y-4">
                      {examensUlterieurs.map((row, index) => (
                        <div key={index} className="rounded-2xl border border-slate-200 p-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <select
                              value={row.typeExamen}
                              onChange={(e) =>
                                setExamensUlterieurs((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, typeExamen: e.target.value } : r
                                  )
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            >
                              <option value="PERIODIQUE">Périodique</option>
                              <option value="REPRISE">Reprise</option>
                              <option value="SPONTANE">Spontané</option>
                            </select>
                            <input
                              type="date"
                              value={row.date}
                              onChange={(e) =>
                                setExamensUlterieurs((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, date: e.target.value } : r
                                  )
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Médecin du travail"
                              value={row.medecinNom}
                              onChange={(e) =>
                                setExamensUlterieurs((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, medecinNom: e.target.value } : r
                                  )
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Poste du travail"
                              value={row.posteTravail}
                              onChange={(e) =>
                                setExamensUlterieurs((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, posteTravail: e.target.value } : r
                                  )
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Poids"
                              value={row.poids}
                              onChange={(e) =>
                                setExamensUlterieurs((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, poids: e.target.value } : r
                                  )
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Taille"
                              value={row.taille}
                              onChange={(e) =>
                                setExamensUlterieurs((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, taille: e.target.value } : r
                                  )
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Vision OD"
                              value={row.visionOD}
                              onChange={(e) =>
                                setExamensUlterieurs((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, visionOD: e.target.value } : r
                                  )
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Vision OG"
                              value={row.visionOG}
                              onChange={(e) =>
                                setExamensUlterieurs((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, visionOG: e.target.value } : r
                                  )
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Audition"
                              value={row.audition}
                              onChange={(e) =>
                                setExamensUlterieurs((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, audition: e.target.value } : r
                                  )
                                )
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                            />
                            <textarea
                              rows={2}
                              placeholder="Observations / notes"
                              value={row.observations}
                              onChange={(e) =>
                                setExamensUlterieurs((prev) =>
                                  prev.map((r, i) =>
                                    i === index ? { ...r, observations: e.target.value } : r
                                  )
                                )
                              }
                              className="md:col-span-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setExamensUlterieurs((prev) => prev.filter((_, i) => i !== index))
                              }
                              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setExamensUlterieurs((prev) => [...prev, emptyExamenUlterieur()])}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Ajouter un examen
                      </button>
                    </div>
                  </SectionCard>
                </div>
              )}

              <div className="sticky bottom-0 mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white/95 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Création..." : "Créer le dossier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
