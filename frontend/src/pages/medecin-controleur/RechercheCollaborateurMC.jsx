import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  FileCheck,
  FileSearch,
  Mail,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/api";

const tabs = [
  { id: "profil", label: "Profil & Administratif" },
  { id: "dossier", label: "Dossier Médical" },
  { id: "rdv", label: "Rendez-vous" },
  { id: "analyses", label: "Analyses" },
];

function InfoCard({ title, children }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-2.5 text-sm text-slate-600">{children}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm shadow-slate-200/40">
      {text}
    </div>
  );
}

const formatDate = (value) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR");
};

const getInitials = (prenom, nom) =>
  `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase() || "--";

export default function RechercheCollaborateurMC() {
  const navigate = useNavigate();

  const [matricule, setMatricule] = useState("");
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [collaborateur, setCollaborateur] = useState(null);
  const [activeTab, setActiveTab] = useState("profil");

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [err, setErr] = useState("");
  const [listErr, setListErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchCollaborateurs = async () => {
      try {
        setLoadingList(true);
        setListErr("");
        const res = await api.get("/collaborateurs/");
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];

        if (cancelled) return;
        setCollaborateurs(data);
        if (data.length > 0) {
          setSelectedId((prev) => prev ?? data[0].id);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setListErr("Erreur lors du chargement des collaborateurs.");
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    };

    fetchCollaborateurs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;

    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        setErr("");
        const res = await api.get(`/collaborateurs/${selectedId}/`);
        if (cancelled) return;
        setCollaborateur(res.data || null);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErr("Impossible de charger les informations du collaborateur.");
          setCollaborateur(null);
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filteredCollaborateurs = useMemo(() => {
    const q = matricule.trim().toLowerCase();
    if (!q) return collaborateurs;

    return collaborateurs.filter((item) =>
      [item.matricule, item.nom, item.prenom, item.poste, item.departement]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [collaborateurs, matricule]);

  const handleSearch = async () => {
    const query = matricule.trim();
    if (!query) {
      setErr("Veuillez saisir une matricule.");
      return;
    }

    const localExact = collaborateurs.find(
      (item) => item.matricule?.toLowerCase() === query.toLowerCase()
    );
    if (localExact) {
      setErr("");
      setSelectedId(localExact.id);
      return;
    }

    try {
      setLoadingSearch(true);
      setErr("");

      const res = await api.get(`/collaborateurs/?search=${query}`);
      const data = Array.isArray(res.data) ? res.data : [];
      const exactMatch = data.find(
        (item) => item.matricule?.toLowerCase() === query.toLowerCase()
      );

      if (!exactMatch) {
        setErr("Aucun collaborateur trouvé avec cette matricule.");
        return;
      }

      setSelectedId(exactMatch.id);
      setCollaborateurs((prev) => {
        const exists = prev.some((item) => item.id === exactMatch.id);
        return exists ? prev : [exactMatch, ...prev];
      });
    } catch (e) {
      console.error(e);
      setErr("Erreur lors de la recherche du collaborateur.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const selectedFromList = useMemo(
    () => collaborateurs.find((item) => item.id === selectedId) || null,
    [collaborateurs, selectedId]
  );

  const collab = collaborateur || selectedFromList;

  const siteLabel = collab?.site?.nom || "LEONI";
  const localiteLabel = collab?.site?.localite || "--";
  const posteLabel = collab?.poste || "--";
  const departementLabel = collab?.departement || "--";

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Accueil Patient
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Sélectionnez un collaborateur pour afficher ses détails.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="Rechercher par matricule..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-24 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-1.5 top-1.5 inline-flex h-8 items-center rounded-xl bg-slate-900 px-3 text-xs font-medium text-white transition hover:bg-slate-800"
            >
              Rechercher
            </button>
          </div>

          {loadingList ? (
            <p className="mt-4 text-sm text-slate-500">Chargement...</p>
          ) : null}
          {loadingSearch ? (
            <p className="mt-4 text-sm text-slate-500">Recherche en cours...</p>
          ) : null}
          {listErr ? <p className="mt-4 text-sm text-red-600">{listErr}</p> : null}
          {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}

          <div className="mt-4 max-h-[680px] space-y-2 overflow-auto pr-1">
            {filteredCollaborateurs.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setErr("");
                  }}
                  className={`w-full rounded-[22px] border p-3 text-left transition ${
                    isSelected
                      ? "border-slate-900 bg-slate-50 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
                      {getInitials(item.prenom, item.nom)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {`${item.prenom || ""} ${item.nom || ""}`.trim() || "--"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.matricule || "--"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.poste || "--"} {item.departement ? `• ${item.departement}` : ""}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {!loadingList && filteredCollaborateurs.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">
                Aucun collaborateur trouvé pour cette recherche.
              </p>
            ) : null}
          </div>
        </section>

        <div className="space-y-5">
          {!selectedId ? (
            <EmptyState text="Sélectionnez un collaborateur pour afficher les détails." />
          ) : (
            <>
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
                {loadingDetail ? (
                  <p className="text-sm text-slate-500">Chargement...</p>
                ) : collab ? (
                  <>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-700">
                          {getInitials(collab.prenom, collab.nom)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-slate-900">
                            {`${collab.prenom || ""} ${collab.nom || ""}`.trim() || "--"}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            Matricule : {collab.matricule || "--"}
                          </p>
                          <p className="text-sm text-slate-500">{posteLabel}</p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                        <ShieldCheck className="h-4 w-4" />
                        Dossier actif
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                            activeTab === tab.id
                              ? "bg-slate-900 text-white"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState text="Aucun détail collaborateur disponible." />
                )}
              </section>

              {activeTab === "profil" && collab ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <InfoCard title="Informations Générales">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span>{`${collab.prenom || ""} ${collab.nom || ""}`.trim() || "--"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{collab.email || "--"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-slate-400" />
                      <span>CIN : {collab.cin || "--"}</span>
                    </div>
                  </InfoCard>

                  <InfoCard title="Poste & Département">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      <span>{posteLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
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
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      <span>Dernière mise à jour : {formatDate(collab.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      <span>Suivi en cours : Contrôle médical</span>
                    </div>
                    <div className="pt-1">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/medecin-controleur/controle-medical/${collab.id}`)
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                        >
                          <FileCheck size={14} />
                          Créer contrôle médical
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/medecin-controleur/demande-expertise/${collab.id}`)
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <FileSearch size={14} />
                          Demande expertise
                        </button>
                      </div>
                    </div>
                  </InfoCard>
                </div>
              ) : null}

              {activeTab === "dossier" ? (
                <EmptyState text="Le dossier médical détaillé sera affiché ici." />
              ) : null}

              {activeTab === "rdv" ? (
                <EmptyState text="Les rendez-vous du collaborateur seront affichés ici." />
              ) : null}

              {activeTab === "analyses" ? (
                <EmptyState text="Les analyses du collaborateur seront affichées ici." />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
