import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  FileCheck,
  FileSearch,
  Mail,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import CollaborateurSearchWorkspace from "../../components/collaborateurs/CollaborateurSearchWorkspace";
import {
  EmptyState,
  InfoCard,
  formatDate,
} from "../../components/collaborateurs/collaborateurSearchWorkspace.helpers";
import DossierMedical from "../medecin-traitant/DossierMedical";

const tabs = [
  { id: "profil", label: "Profil & Administratif" },
  { id: "dossier", label: "Dossier Médical" },
  { id: "rdv", label: "Rendez-vous" },
  { id: "analyses", label: "Analyses" },
];

function MedecinControleurTabContent({ activeTab, collab, selectedId }) {
  const navigate = useNavigate();

  const siteLabel = collab?.site?.nom || "LEONI";
  const localiteLabel = collab?.site?.localite || "--";
  const posteLabel = collab?.poste || "--";
  const departementLabel = collab?.departement || "--";

  if (activeTab === "profil") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Informations Générales">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-sky-500" />
            <span>{`${collab.prenom || ""} ${collab.nom || ""}`.trim() || "--"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-sky-500" />
            <span>{collab.email || "--"}</span>
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-sky-500" />
            <span>CIN : {collab.cin || "--"}</span>
          </div>
        </InfoCard>

        <InfoCard title="Poste & Département">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-sky-500" />
            <span>{posteLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-sky-500" />
            <span>{departementLabel}</span>
          </div>
        </InfoCard>

        <InfoCard title="Site / Segment">
          <div>
            Site :
            <span className="ml-2 font-medium text-slate-700">{siteLabel}</span>
          </div>
          <div>
            Localité :
            <span className="ml-2 font-medium text-slate-700">{localiteLabel}</span>
          </div>
          <div>
            Segment :
            <span className="ml-2 font-medium text-slate-700">
              {collab.segment_nom || collab.segment?.nom || collab.segment || "--"}
            </span>
          </div>
        </InfoCard>

        <InfoCard title="Statut & Validité">
          <div>
            Statut :
            <span className="ml-2 font-medium text-slate-700">Dossier actif</span>
          </div>
          <div>
            Date de création :
            <span className="ml-2 font-medium text-slate-700">
              {formatDate(collab.created_at)}
            </span>
          </div>
        </InfoCard>

        <InfoCard title="Suivi médical">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-sky-500" />
            <span>Dernière mise à jour : {formatDate(collab.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-sky-500" />
            <span>Suivi en cours : Contrôle médical</span>
          </div>
          <div className="pt-1">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(`/medecin-controleur/controle-medical/${collab.id}`)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-sm shadow-sky-900/25 transition hover:bg-slate-800"
              >
                <FileCheck size={14} />
                Créer contrôle médical
              </button>
              <button
                type="button"
                onClick={() => navigate(`/medecin-controleur/demande-expertise/${collab.id}`)}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
              >
                <FileSearch size={14} />
                Demande expertise
              </button>
            </div>
          </div>
        </InfoCard>
      </div>
    );
  }

  if (activeTab === "dossier") {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <DossierMedical collaborateurId={selectedId} />
      </div>
    );
  }

  if (activeTab === "rdv") {
    return <EmptyState text="Les rendez-vous du collaborateur seront affichés ici." />;
  }

  if (activeTab === "analyses") {
    return <EmptyState text="Les analyses du collaborateur seront affichées ici." />;
  }

  return null;
}

export default function RechercheCollaborateurMC() {
  return (
    <CollaborateurSearchWorkspace
      headerTitle="Accueil Patient"
      headerSubtitle="Sélectionnez un collaborateur pour afficher ses détails."
      badgeLabel="Dossier actif"
      tabs={tabs}
      renderTabContent={(props) => <MedecinControleurTabContent {...props} />}
    />
  );
}

