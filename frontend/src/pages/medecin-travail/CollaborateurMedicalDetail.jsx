import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Stethoscope,
  FlaskConical,
  ShieldCheck,
  ClipboardPlus,
  Pill,
  FileBadge,
  Syringe,
  Briefcase,
  TriangleAlert,
  Activity,
} from "lucide-react";
import { api } from "@/api/api";

const ActionCard = ({ title, desc, icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition w-full"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-base font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      </div>
      <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
  </button>
);

const InfoItem = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm font-medium text-slate-900 mt-1">{value || "-"}</p>
  </div>
);

const SectionCard = ({ title, children, actionLabel, onAction }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-xl px-4 py-2 text-sm font-medium border border-slate-200 hover:bg-slate-50 transition"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
    {text}
  </div>
);

const calcAge = (dateNaissance) => {
  if (!dateNaissance) return "-";
  const birth = new Date(dateNaissance);
  if (Number.isNaN(birth.getTime())) return "-";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return `${age} ans`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
};

const aptitudeLabel = (value) => {
  switch (value) {
    case "APTE":
      return "Apte";
    case "APTE_AMENAGEMENT":
      return "Apte avec aménagement";
    case "INAPTE_TEMPORAIRE":
      return "Inapte temporaire";
    case "APTE_APRES_CHANGEMENT":
      return "Apte après changement du poste";
    case "INAPTE_DEFINITIF":
      return "Inapte définitif";
    default:
      return value || "-";
  }
};

const examenLabel = (value) => {
  switch (value) {
    case "EMBAUCHE":
      return "Embauche";
    case "PERIODIQUE":
      return "Périodique";
    case "REPRISE":
      return "Reprise";
    case "SPONTANE":
      return "Spontané";
    default:
      return value || "-";
  }
};

const isDossierComplet = (collab, dossier) => {
  const hasCollabInfo =
    !!collab?.cin &&
    !!collab?.date_naissance &&
    !!collab?.telephone &&
    !!collab?.poste &&
    !!collab?.departement;

  const hasDossierInfo = !!dossier?.entreprise && !!dossier?.localite;

  return hasCollabInfo && hasDossierInfo;
};

export default function CollaborateurMedicalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const collaborateurId = Number(id);

  const [collab, setCollab] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [fichesAptitude, setFichesAptitude] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        const [collabRes, dossierRes, fichesRes] = await Promise.all([
          api.get(`/collaborateurs/${collaborateurId}/`),
          api.get(`/medical/dossier/${collaborateurId}/`),
          api.get(`/medical/fiche-aptitude/${collaborateurId}/`),
        ]);

        if (cancelled) return;

        setCollab(collabRes.data || null);
        setDossier(dossierRes.data || null);
        setFichesAptitude(
          Array.isArray(fichesRes.data) ? fichesRes.data : []
        );
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErr("Impossible de charger les données du collaborateur.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [collaborateurId]);

  const fullName = useMemo(() => {
    if (!collab) return "";
    return `${collab.nom || ""} ${collab.prenom || ""}`.trim();
  }, [collab]);

  const dossierComplet = useMemo(() => {
    return isDossierComplet(collab, dossier);
  }, [collab, dossier]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-slate-500">
          Chargement du dossier médical...
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Retour
        </button>

        <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm text-red-600">
          {err}
        </div>
      </div>
    );
  }

  if (!collab) {
    return (
      <div className="p-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-slate-500">
          Collaborateur introuvable.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <button
        type="button"
        onClick={() => navigate("/medecin-travail/collaborateurs")}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Retour vers les collaborateurs
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
          <div>
            <p className="text-sm text-slate-500">Dossier médical collaborateur</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              {fullName || "-"}
            </h1>
            <p className="text-slate-500 mt-2">
              Matricule :{" "}
              <span className="font-medium text-slate-700">
                {collab.matricule || "-"}
              </span>
            </p>

            <div className="mt-3">
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${
                  dossierComplet
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {dossierComplet ? "Dossier complet" : "Dossier à compléter"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(`/medecin-travail/collaborateurs/${collaborateurId}/dossier`)
              }
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                dossierComplet
                  ? "bg-slate-900 text-white hover:opacity-90"
                  : "bg-amber-500 text-white hover:opacity-90"
              }`}
            >
              {dossierComplet ? "Modifier dossier" : "Créer / compléter dossier"}
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(`/medecin-travail/collaborateurs/${collaborateurId}/fiche-aptitude`)
              }
              className="rounded-xl px-4 py-2 border border-slate-200 text-sm font-medium hover:bg-slate-50 transition"
            >
              Nouvelle fiche aptitude
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
          <InfoItem label="Nom complet" value={fullName} />
          <InfoItem label="CIN" value={collab.cin} />
          <InfoItem label="Date naissance" value={formatDate(collab.date_naissance)} />
          <InfoItem label="Âge" value={calcAge(collab.date_naissance)} />
          <InfoItem label="Téléphone" value={collab.telephone} />
          <InfoItem label="Poste" value={collab.poste} />
          <InfoItem label="Département" value={collab.departement} />
          <InfoItem label="Entreprise" value={dossier?.entreprise} />
          <InfoItem label="Localité" value={dossier?.localite} />
          <InfoItem label="Date création" value={formatDateTime(dossier?.created_at)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ActionCard
          title="Dossier médical"
          desc={
            dossierComplet
              ? "Modifier le dossier médical principal."
              : "Créer ou compléter le dossier médical principal."
          }
          icon={<FileText className="h-5 w-5 text-slate-700" />}
          onClick={() =>
            navigate(`/medecin-travail/collaborateurs/${collaborateurId}/dossier`)
          }
        />

        <ActionCard
          title="Examen initial"
          desc="Saisir la visite d’embauche ou le premier examen."
          icon={<Stethoscope className="h-5 w-5 text-slate-700" />}
          onClick={() =>
            navigate(`/medecin-travail/collaborateurs/${collaborateurId}/examen-initial`)
          }
        />

        <ActionCard
          title="Examen ultérieur"
          desc="Ajouter une visite périodique, reprise ou spontanée."
          icon={<ClipboardPlus className="h-5 w-5 text-slate-700" />}
          onClick={() =>
            navigate(`/medecin-travail/collaborateurs/${collaborateurId}/examen-ulterieur`)
          }
        />

        <ActionCard
          title="Fiche aptitude"
          desc="Créer une fiche d’aptitude au travail."
          icon={<ShieldCheck className="h-5 w-5 text-slate-700" />}
          onClick={() =>
            navigate(`/medecin-travail/collaborateurs/${collaborateurId}/fiche-aptitude`)
          }
        />

        <ActionCard
          title="Demande analyse"
          desc="Prescrire des analyses de laboratoire."
          icon={<FlaskConical className="h-5 w-5 text-slate-700" />}
          onClick={() =>
            navigate(`/medecin-travail/collaborateurs/${collaborateurId}/demande-analyse`)
          }
        />

        <ActionCard
          title="Examen complémentaire"
          desc="Demander visiotest, ECG, EFR ou audiogramme."
          icon={<Activity className="h-5 w-5 text-slate-700" />}
          onClick={() =>
            navigate(`/medecin-travail/collaborateurs/${collaborateurId}/examen-complementaire`)
          }
        />

        <ActionCard
          title="Ordonnance"
          desc="Créer une ordonnance médicale."
          icon={<Pill className="h-5 w-5 text-slate-700" />}
          onClick={() =>
            navigate(`/medecin-travail/collaborateurs/${collaborateurId}/ordonnance`)
          }
        />

        <ActionCard
          title="Certificat médical"
          desc="Créer un certificat lié à la consultation."
          icon={<FileBadge className="h-5 w-5 text-slate-700" />}
          onClick={() =>
            navigate(`/medecin-travail/collaborateurs/${collaborateurId}/certificat`)
          }
        />

        <ActionCard
          title="Vaccination"
          desc="Ajouter ou mettre à jour le suivi vaccinal."
          icon={<Syringe className="h-5 w-5 text-slate-700" />}
          onClick={() =>
            navigate(`/medecin-travail/collaborateurs/${collaborateurId}/vaccination`)
          }
        />

        <ActionCard
          title="Poste de travail"
          desc="Renseigner l’exposition et le poste occupé."
          icon={<Briefcase className="h-5 w-5 text-slate-700" />}
          onClick={() =>
            navigate(`/medecin-travail/collaborateurs/${collaborateurId}/poste-travail`)
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard
          title="Résumé du dossier médical"
          actionLabel={dossierComplet ? "Modifier" : "Compléter"}
          onAction={() =>
            navigate(`/medecin-travail/collaborateurs/${collaborateurId}/dossier`)
          }
        >
          {dossier ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="ID dossier" value={dossier.id} />
              <InfoItem label="Entreprise" value={dossier.entreprise} />
              <InfoItem label="Localité" value={dossier.localite} />
              <InfoItem label="Date création" value={formatDateTime(dossier.created_at)} />
            </div>
          ) : (
            <EmptyState text="Aucun dossier médical n’a encore été créé pour ce collaborateur." />
          )}
        </SectionCard>

        <SectionCard title="Alertes et points de vigilance">
          <div className="space-y-3">
            {!dossierComplet ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                <TriangleAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Dossier médical incomplet
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Complète les informations collaborateur et les informations du
                    dossier médical.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm font-semibold text-sky-800">
                Conseil de workflow
              </p>
              <p className="text-sm text-sky-700 mt-1">
                Ordre conseillé : dossier médical → examen → aptitude → analyses
                ou examens complémentaires si besoin.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Fiches d’aptitude"
        actionLabel="Nouvelle fiche"
        onAction={() =>
          navigate(`/medecin-travail/collaborateurs/${collaborateurId}/fiche-aptitude`)
        }
      >
        {fichesAptitude.length === 0 ? (
          <EmptyState text="Aucune fiche d’aptitude enregistrée pour ce collaborateur." />
        ) : (
          <div className="space-y-4">
            {fichesAptitude.map((fiche) => (
              <div
                key={fiche.id}
                className="rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  <InfoItem
                    label="Type examen"
                    value={examenLabel(fiche.type_examen)}
                  />
                  <InfoItem
                    label="Aptitude"
                    value={aptitudeLabel(fiche.aptitude)}
                  />
                  <InfoItem label="Date" value={formatDate(fiche.date)} />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        `/api/medical/fiche-aptitude/${fiche.id}/pdf/`,
                        "_blank"
                      )
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Ouvrir PDF
                  </button>
                </div>

                {fiche.recommandations ? (
                  <div className="md:col-span-3 w-full rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Recommandations
                    </p>
                    <p className="text-sm text-slate-900 mt-1">
                      {fiche.recommandations}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}