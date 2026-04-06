import { useEffect, useMemo, useState } from "react";
import {
  Search,
  User,
  Mail,
  BadgeCheck,
  CalendarDays,
  Briefcase,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/api/api";
import DossierMedical from "../medecin-traitant/DossierMedical";
import { fixFrenchTextDeep } from "@/utils/fixFrenchText";

const tabs = [
  { id: "profil", label: "Profil & Administratif" },
  { id: "dossier", label: "Dossier Médical" },
  { id: "rdv", label: "Rendez-vous" },
  { id: "analyses", label: "Analyses" },
];

const InfoCard = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <div className="mt-3 space-y-2 text-sm text-slate-600">{children}</div>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
    {text}
  </div>
);

const formatDate = (value) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR");
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
      return value || "--";
  }
};

const getInitials = (prenom, nom) =>
  `${prenom?.[0] || ""}${nom?.[0] || ""}`.toUpperCase() || "--";

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listErr, setListErr] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState("");
  const [collabDetail, setCollabDetail] = useState(null);
  const [dossier, setDossier] = useState(null);

  const [rdvs, setRdvs] = useState([]);
  const [rdvErr, setRdvErr] = useState("");

  const [activeTab, setActiveTab] = useState("profil");

  useEffect(() => {
    let cancelled = false;

    const fetchCollaborateurs = async () => {
      try {
        setLoadingList(true);
        setListErr("");

        const res = await api.get("/collaborateurs/");
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];

        if (cancelled) return;
        setCollaborateurs(fixFrenchTextDeep(data));
      } catch (e) {
        console.error("COLLAB ERROR =", e?.response?.status, e?.response?.data);
        if (!cancelled) setListErr("Erreur chargement collaborateurs");
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
    let cancelled = false;

    const loadRdvs = async () => {
      try {
        setRdvErr("");
        const res = await api.get("/appointments/rdv/");
        if (cancelled) return;
        setRdvs(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setRdvErr("Impossible de charger les rendez-vous.");
      }
    };

    loadRdvs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId && collaborateurs.length > 0) {
      setSelectedId(collaborateurs[0].id);
    }
  }, [collaborateurs, selectedId]);

  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;

    const loadDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailErr("");

        const [cRes, dRes] = await Promise.all([
          api.get(`/collaborateurs/${selectedId}/`),
          api.get(`/medical/dossier/${selectedId}/`),
        ]);

        if (cancelled) return;
        setCollabDetail(fixFrenchTextDeep(cRes?.data ?? null));
        setDossier(fixFrenchTextDeep(dRes?.data ?? null));
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setDetailErr("Erreur: impossible de charger les détails collaborateur.");
          setCollabDetail(null);
          setDossier(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return collaborateurs;

    return collaborateurs.filter((c) =>
      [c.matricule].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [collaborateurs, search]);

  const selectedFromList = useMemo(() => {
    if (!selectedId) return null;
    return collaborateurs.find((c) => c.id === selectedId) || null;
  }, [collaborateurs, selectedId]);

  const collab = collabDetail || selectedFromList;

  const lastVisit = useMemo(() => {
    const initial = dossier?.examen_initial?.date_examen;
    const others = Array.isArray(dossier?.examens_ulterieurs)
      ? dossier.examens_ulterieurs
      : [];
    const dates = [initial, ...others.map((e) => e?.date)].filter(Boolean);
    if (!dates.length) return "--";
    const latest = dates.sort((a, b) => String(b).localeCompare(String(a)))[0];
    return formatDate(latest);
  }, [dossier]);

  const lastPeriodic = useMemo(() => {
    const others = Array.isArray(dossier?.examens_ulterieurs)
      ? dossier.examens_ulterieurs
      : [];
    const periodic = others
      .filter((e) => e?.type_examen === "PERIODIQUE")
      .map((e) => e?.date)
      .filter(Boolean);
    if (!periodic.length) return "--";
    const latest = periodic.sort((a, b) => String(b).localeCompare(String(a)))[0];
    return formatDate(latest);
  }, [dossier]);

  const filteredRdvs = useMemo(() => {
    if (!selectedId) return [];
    return rdvs.filter((item) => {
      const directId = item?.collaborateur || item?.collaborateur_id;
      const nestedId = item?.collaborateur?.id;
      return [directId, nestedId].some(
        (val) => String(val) === String(selectedId)
      );
    });
  }, [rdvs, selectedId]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Accueil Patient</h1>
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
              placeholder="Rechercher par matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-slate-400"
            />
          </div>

          {loadingList && (
            <p className="mt-4 text-sm text-slate-500">Chargement...</p>
          )}
          {listErr && <p className="mt-4 text-sm text-red-600">{listErr}</p>}

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

            {!loadingList && filtered.length === 0 && (
              <p className="text-sm text-slate-500">Aucun collaborateur trouvé.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {!selectedId && (
            <EmptyState text="Sélectionnez un collaborateur pour afficher les détails." />
          )}

          {selectedId && (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              {detailLoading ? (
                <p className="text-sm text-slate-500">Chargement...</p>
              ) : detailErr ? (
                <p className="text-sm text-red-600">{detailErr}</p>
              ) : (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-700">
                      {getInitials(collab?.prenom, collab?.nom)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {`${collab?.prenom || ""} ${collab?.nom || ""}`.trim() ||
                          "--"}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Matricule : {collab?.matricule || "--"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {collab?.poste || collab?.poste_nom || "--"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                      dossier?.id
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {dossier?.id ? "Dossier actif" : "Dossier manquant"}
                  </span>
                </div>
              )}

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

          {selectedId && activeTab === "profil" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <InfoCard title="Informations Générales">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>
                    {`${collab?.prenom || ""} ${collab?.nom || ""}`.trim() ||
                      "--"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{collab?.email || "--"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-slate-400" />
                  <span>CIN : {collab?.cin || "--"}</span>
                </div>
              </InfoCard>

              <InfoCard title="Poste & Département">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400" />
                  <span>{collab?.poste || collab?.poste_nom || "--"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span>{collab?.departement || "--"}</span>
                </div>
              </InfoCard>

              <InfoCard title="Site / Segment">
                <div>
                  Site :
                  <span className="ml-2 font-medium text-slate-700">
                    {collab?.site?.nom || "--"}
                  </span>
                </div>
                <div>
                  Localité :
                  <span className="ml-2 font-medium text-slate-700">
                    {collab?.site?.localite || "--"}
                  </span>
                </div>
                <div>
                  Segment :
                  <span className="ml-2 font-medium text-slate-700">
                    {collab?.segment_nom ||
                      collab?.segment?.nom ||
                      collab?.segment ||
                      "--"}
                  </span>
                </div>
              </InfoCard>

              <InfoCard title="Statut & Validité">
                <div>
                  Statut :
                  <span className="ml-2 font-medium text-slate-700">
                    {dossier?.id ? "Dossier actif" : "Dossier manquant"}
                  </span>
                </div>
                <div>
                  Date recrutement :
                  <span className="ml-2 font-medium text-slate-700">
                    {formatDate(dossier?.date_recrutement)}
                  </span>
                </div>
              </InfoCard>

              <InfoCard title="Suivi médical">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <span>Dernière visite : {lastVisit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <span>Visite périodique : {lastPeriodic}</span>
                </div>
                <div>
                  Aptitude :
                  <span className="ml-2 font-medium text-slate-700">
                    {aptitudeLabel(dossier?.examen_initial?.aptitude)}
                  </span>
                </div>
              </InfoCard>
            </div>
          )}

          {selectedId && activeTab === "dossier" && (
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <DossierMedical collaborateurId={selectedId} />
            </div>
          )}

          {selectedId && activeTab === "rdv" && (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              {rdvErr ? (
                <p className="text-sm text-red-600">{rdvErr}</p>
              ) : filteredRdvs.length === 0 ? (
                <EmptyState text="Aucun rendez-vous trouvé pour ce collaborateur." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="py-3 font-medium">Date</th>
                        <th className="py-3 font-medium">Heure</th>
                        <th className="py-3 font-medium">Motif</th>
                        <th className="py-3 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRdvs.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 text-slate-700">{item.date || "--"}</td>
                          <td className="py-3 text-slate-700">{item.heure || "--"}</td>
                          <td className="py-3 text-slate-700">{item.motif || "--"}</td>
                          <td className="py-3 text-slate-700">{item.statut || "--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {selectedId && activeTab === "analyses" && (
            <EmptyState text="Aucune analyse disponible pour ce collaborateur." />
          )}
        </div>
      </div>
    </div>
  );
}

