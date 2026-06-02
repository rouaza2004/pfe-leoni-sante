import { Fragment, useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Search, UserRoundSearch } from "lucide-react";
import { api } from "@/api/api";
import HSEEPageHeader from "@/views/components/hsee/HSEEPageHeader";

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
      {text}
    </div>
  );
}

export default function HSEEEnqueteHistoryPage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await api.get("/hsee/enquetes/");
        if (!cancelled) {
          setRecords(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("Erreur chargement historique HSEE", error);
        if (!cancelled) {
          setRecords([]);
          setErrorMessage("Impossible de charger l'historique des enquetes.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (dateFilter && record.general?.dateIncident !== dateFilter) {
        return false;
      }

      if (!query) return true;

      return [
        record.general?.victimeNom,
        record.general?.victimeMatricule,
        record.general?.departement,
        record.general?.posteShift,
        record.lesion?.natureLesion,
        record.lesion?.causeIdentifiee,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [records, search, dateFilter]);

  return (
    <div className="space-y-3">
      <HSEEPageHeader
        eyebrow="Espace HSEE"
        title="Historique des Enquetes"
        subtitle="Consultez les fiches d'enquete AT / Incident enregistrees par l'equipe HSEE."
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <ClipboardList className="h-4 w-4 text-slate-600" />
            {records.length} enquete(s) sauvegardee(s)
          </div>

          <div className="flex flex-col gap-3 md:w-[560px] md:flex-row">
            <label className="flex h-10 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-slate-300">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par victime, matricule, departement..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <label className="flex h-10 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm">
              <CalendarDays size={16} className="text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="bg-transparent text-sm text-slate-700 outline-none"
              />
            </label>
          </div>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-slate-500">Chargement de l'historique...</p>
        ) : filteredRecords.length === 0 ? (
          <EmptyState text="Aucune enquete sauvegardee ne correspond aux filtres actuels." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Victime</th>
                  <th className="px-4 py-2 font-medium">Matricule</th>
                  <th className="px-4 py-2 font-medium">Departement</th>
                  <th className="px-4 py-2 font-medium">Nature</th>
                  <th className="px-4 py-2 font-medium">Siege</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                  <th className="px-4 py-2 font-medium text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const isExpanded = expandedId === String(record.id);
                  return (
                    <Fragment key={record.id}>
                      <tr className="rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm">
                        <td className="rounded-l-2xl px-4 py-3">{formatDate(record.general?.dateIncident)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {record.general?.victimeNom || "--"}
                        </td>
                        <td className="px-4 py-3">{record.general?.victimeMatricule || "--"}</td>
                        <td className="px-4 py-3">{record.general?.departement || "--"}</td>
                        <td className="px-4 py-3">{record.lesion?.natureLesion || "--"}</td>
                        <td className="px-4 py-3">{record.lesion?.siegeLesion || "--"}</td>
                        <td className="px-4 py-3">{record.actions?.length || 0}</td>
                        <td className="rounded-r-2xl px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? "" : String(record.id))}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            <UserRoundSearch className="h-4 w-4" />
                            {isExpanded ? "Fermer" : "Voir"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded ? (
                        <tr>
                          <td colSpan={8} className="px-1 pb-2 pt-0">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                              <div className="grid gap-4 lg:grid-cols-3">
                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">Informations generales</h3>
                                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <p><span className="font-medium text-slate-800">Poste :</span> {record.general?.posteShift || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Lieu :</span> {record.general?.lieuIncident || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Heure :</span> {record.general?.heureIncident || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Cree le :</span> {formatDateTime(record.created_at)}</p>
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">Lesion</h3>
                                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <p><span className="font-medium text-slate-800">Agent :</span> {record.lesion?.agentMateriel || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Cause :</span> {record.lesion?.causeIdentifiee || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Standard :</span> {record.lesion?.presenceStandard || "--"} / {record.lesion?.respectStandard || "--"}</p>
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">Actions</h3>
                                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    {record.actions?.length ? (
                                      record.actions.map((action, index) => (
                                        <p key={`${record.id}-action-${index}`}>
                                          <span className="font-medium text-slate-800">#{index + 1} :</span>{" "}
                                          {action.correctiveAction || "--"}
                                        </p>
                                      ))
                                    ) : (
                                      <p>Aucune action enregistree.</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">Description</h3>
                                  <p className="mt-3 text-sm leading-6 text-slate-600">
                                    {record.general?.descriptionIncident || "--"}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">Analyse des causes</h3>
                                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <p><span className="font-medium text-slate-800">Pourquoi 1 :</span> {record.causes?.why1 || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Pourquoi 2 :</span> {record.causes?.why2 || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Pourquoi 3 :</span> {record.causes?.why3 || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Pourquoi 4 :</span> {record.causes?.why4 || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Pourquoi 5 :</span> {record.causes?.why5 || "--"}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}


