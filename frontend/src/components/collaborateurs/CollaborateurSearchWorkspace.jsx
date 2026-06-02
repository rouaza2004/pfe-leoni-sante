import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ShieldCheck } from "lucide-react";
import { api } from "@/api/api";
import { fixFrenchTextDeep } from "@/utils/fixFrenchText";
import { EmptyState, getInitials } from "./collaborateurSearchWorkspace.helpers";

function normalizeCollaborateurList(payload) {
  return fixFrenchTextDeep(Array.isArray(payload) ? payload : payload?.results || []);
}

function matchesCollaborateurQuery(item, query) {
  const normalizedQuery = query.trim().toLowerCase();
  const matricule = item.matricule?.toLowerCase() || "";
  const fullName = `${item.prenom || ""} ${item.nom || ""}`.trim().toLowerCase();
  const reversedName = `${item.nom || ""} ${item.prenom || ""}`.trim().toLowerCase();

  return (
    Boolean(normalizedQuery) &&
    (matricule === normalizedQuery ||
      fullName === normalizedQuery ||
      reversedName === normalizedQuery)
  );
}

export default function CollaborateurSearchWorkspace({
  headerTitle,
  headerSubtitle,
  badgeLabel = "Dossier actif",
  tabs,
  renderTabContent,
  searchPlaceholder = "Rechercher par matricule...",
  emptySelectionText = "Sélectionnez un collaborateur pour afficher les détails.",
  emptyDetailText = "Aucun détail collaborateur disponible.",
  listEmptyText = "Aucun collaborateur trouvé pour cette recherche.",
  loadSupplementalData,
}) {
  const [matricule, setMatricule] = useState("");
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [collaborateur, setCollaborateur] = useState(null);
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [initialSelectionDone, setInitialSelectionDone] = useState(false);

  const [searchParams] = useSearchParams();
  const queryMatricule = useMemo(
    () => searchParams.get("matricule")?.trim() || "",
    [searchParams]
  );
  const querySearch = useMemo(
    () => searchParams.get("search")?.trim() || "",
    [searchParams]
  );
  const queryCollaborateurId = useMemo(
    () => searchParams.get("collaborateurId")?.trim() || "",
    [searchParams]
  );
  const queryTab = useMemo(
    () => searchParams.get("tab")?.trim() || searchParams.get("target")?.trim() || "",
    [searchParams]
  );
  const hasInitialQuery = Boolean(queryCollaborateurId || queryMatricule || querySearch);
  const [err, setErr] = useState("");
  const [listErr, setListErr] = useState("");

  const [supplementalData, setSupplementalData] = useState(null);
  const [supplementalLoading, setSupplementalLoading] = useState(false);
  const [supplementalError, setSupplementalError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchCollaborateurs = async () => {
      try {
        setLoadingList(true);
        setListErr("");
        const res = await api.get("/collaborateurs/");
        const data = normalizeCollaborateurList(res.data);

        if (cancelled) return;
        setCollaborateurs(data);
        if (data.length > 0 && !hasInitialQuery) {
          setSelectedId((prev) => prev ?? data[0].id);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) setListErr("Erreur lors du chargement des collaborateurs.");
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    };

    fetchCollaborateurs();

    return () => {
      cancelled = true;
    };
  }, [hasInitialQuery]);

  useEffect(() => {
    if (!queryTab) return;
    if (!tabs.some((tab) => tab.id === queryTab)) return;
    setActiveTab(queryTab);
  }, [queryTab, tabs]);

  useEffect(() => {
    if (!queryCollaborateurId) return;
    setSelectedId(Number(queryCollaborateurId));
    setInitialSelectionDone(true);
  }, [queryCollaborateurId]);

  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;

    const fetchDetail = async () => {
      try {
        setLoadingDetail(true);
        setErr("");
        const res = await api.get(`/collaborateurs/${selectedId}/`);
        if (cancelled) return;
        setCollaborateur(fixFrenchTextDeep(res.data || null));
      } catch (error) {
        console.error(error);
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

  useEffect(() => {
    const initialQuery = queryMatricule || querySearch;
    if (!initialQuery) return;
    setMatricule(initialQuery);
  }, [queryMatricule, querySearch]);

  useEffect(() => {
    const lookupQueries = [queryMatricule, querySearch].filter(Boolean);
    if (queryCollaborateurId || lookupQueries.length === 0 || initialSelectionDone || loadingList) {
      return;
    }

    const localExact = collaborateurs.find((item) =>
      lookupQueries.some((query) => matchesCollaborateurQuery(item, query))
    );

    if (localExact) {
      setSelectedId(localExact.id);
      setInitialSelectionDone(true);
      return;
    }

    let cancelled = false;

    const fetchExactMatch = async () => {
      try {
        setLoadingSearch(true);
        setErr("");

        const responses = await Promise.all(
          lookupQueries.map((query) =>
            api.get(`/collaborateurs/?search=${encodeURIComponent(query)}`)
          )
        );
        const data = responses.flatMap((response) => normalizeCollaborateurList(response.data));
        const exactMatch = data.find((item) =>
          lookupQueries.some((query) => matchesCollaborateurQuery(item, query))
        );

        if (cancelled) return;

        if (exactMatch) {
          setSelectedId(exactMatch.id);
          setCollaborateurs((prev) => {
            const exists = prev.some((item) => item.id === exactMatch.id);
            return exists ? prev : [exactMatch, ...prev];
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoadingSearch(false);
          setInitialSelectionDone(true);
        }
      }
    };

    fetchExactMatch();

    return () => {
      cancelled = true;
    };
  }, [
    queryCollaborateurId,
    queryMatricule,
    querySearch,
    collaborateurs,
    loadingList,
    initialSelectionDone,
  ]);

  useEffect(() => {
    if (!loadSupplementalData || !collaborateur?.matricule) {
      setSupplementalData(null);
      setSupplementalError("");
      setSupplementalLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSupplemental = async () => {
      try {
        setSupplementalLoading(true);
        setSupplementalError("");
        const result = await loadSupplementalData(collaborateur);
        if (cancelled) return;
        setSupplementalData(result || null);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setSupplementalData(null);
          setSupplementalError("Impossible de charger les données complémentaires.");
        }
      } finally {
        if (!cancelled) setSupplementalLoading(false);
      }
    };

    fetchSupplemental();

    return () => {
      cancelled = true;
    };
  }, [collaborateur, loadSupplementalData]);

  const filteredCollaborateurs = useMemo(() => {
    const query = matricule.trim().toLowerCase();
    if (!query) return collaborateurs;

    return collaborateurs.filter((item) =>
      [item.matricule, item.nom, item.prenom, item.poste, item.departement]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [collaborateurs, matricule]);

  const handleSearch = async () => {
    const query = matricule.trim();
    if (!query) {
      setErr("Veuillez saisir un matricule.");
      return;
    }

    const localExact = collaborateurs.find(
      (item) => item.matricule?.toLowerCase() === query.toLowerCase()
    );
    if (localExact) {
      setErr("");
      setListErr("");
      setSelectedId(localExact.id);
      return;
    }

    try {
      setLoadingSearch(true);
      setErr("");

      const res = await api.get(`/collaborateurs/?search=${query}`);
      const data = normalizeCollaborateurList(res.data);
      const exactMatch = data.find((item) => matchesCollaborateurQuery(item, query));

      if (!exactMatch) {
        setErr("Aucun collaborateur trouvé avec ce matricule.");
        return;
      }

      setListErr("");
      setSelectedId(exactMatch.id);
      setCollaborateurs((prev) => {
        const exists = prev.some((item) => item.id === exactMatch.id);
        return exists ? prev : [exactMatch, ...prev];
      });
    } catch (error) {
      console.error(error);
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
  const shouldShowListEmpty =
    !loadingList && !loadingSearch && !listErr && !err && filteredCollaborateurs.length === 0;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-sky-50/35 to-white p-6 shadow-sm shadow-slate-200/50">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {headerTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{headerSubtitle}</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-500" />
            <input
              type="text"
              value={matricule}
              onChange={(event) => setMatricule(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearch();
              }}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-24 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-1.5 top-1.5 inline-flex h-8 items-center rounded-xl bg-slate-900 px-3 text-xs font-medium text-white shadow-sm shadow-sky-900/25 transition hover:bg-slate-800"
            >
              Rechercher
            </button>
          </div>

          {loadingList ? <p className="mt-4 text-sm text-slate-500">Chargement...</p> : null}
          {loadingSearch ? (
            <p className="mt-4 text-sm text-slate-500">Recherche en cours...</p>
          ) : null}
          {listErr ? <p className="mt-4 text-sm text-red-600">{listErr}</p> : null}
          {!listErr && err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}

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
                      ? "border-sky-300 bg-sky-50 shadow-sm shadow-sky-100/60"
                      : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sm font-semibold text-sky-700">
                      {getInitials(item.prenom, item.nom)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {`${item.prenom || ""} ${item.nom || ""}`.trim() || "--"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.matricule || "--"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.poste || "--"} {item.departement ? `• ${item.departement}` : ""}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {shouldShowListEmpty ? (
              <p className="py-6 text-sm text-slate-500">{listEmptyText}</p>
            ) : null}
          </div>
        </section>

        <div className="space-y-5">
          {!selectedId ? (
            <EmptyState text={emptySelectionText} />
          ) : (
            <>
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
                {loadingDetail ? (
                  <p className="text-sm text-slate-500">Chargement...</p>
                ) : collab ? (
                  <>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-lg font-semibold text-sky-700">
                          {getInitials(collab.prenom, collab.nom)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-slate-900">
                            {`${collab.prenom || ""} ${collab.nom || ""}`.trim() || "--"}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            Matricule : {collab.matricule || "--"}
                          </p>
                          <p className="text-sm text-slate-500">{collab.poste || "--"}</p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
                        <ShieldCheck className="h-4 w-4" />
                        {badgeLabel}
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
                              ? "bg-slate-900 text-white shadow-sm shadow-sky-900/25"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50/40"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState text={emptyDetailText} />
                )}
              </section>

              {collab
                ? renderTabContent({
                    activeTab,
                    collab,
                    selectedId,
                    supplementalData,
                    supplementalLoading,
                    supplementalError,
                    setActiveTab,
                  })
                : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
