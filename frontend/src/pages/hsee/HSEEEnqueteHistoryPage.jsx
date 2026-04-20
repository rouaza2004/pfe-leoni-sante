import { Fragment, useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Search, UserRoundSearch } from "lucide-react";
import { api } from "@/api/api";
import HSEEPageHeader from "@/components/hsee/HSEEPageHeader";

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
    <div className="rounded-[24px] border border-dashed border-sky-200 bg-sky-50/40 p-6 text-sm text-slate-600 shadow-sm shadow-slate-200/40">
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
    <div className="space-y-6">
      <HSEEPageHeader
        title="Historique des Enquêtes"
        subtitle="Consultez les fiches d'enquête AT / Incident enregistrées par l'équipe HSEE."
      />

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <ClipboardList className="h-4 w-4 text-sky-600" />
            {records.length} enquete(s) sauvegardee(s)
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:w-[560px]">
            <label className="flex h-11 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm shadow-slate-200/40 transition focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
              <Search size={16} className="text-sky-500" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par victime, matricule, departement..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <label className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm shadow-slate-200/40">
              <CalendarDays size={16} className="text-sky-500" />
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
        <section className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        {isLoading ? (
          <p className="text-sm text-slate-500">Chargement de l'historique...</p>
        ) : filteredRecords.length === 0 ? (
          <EmptyState text="Aucune enquete sauvegardee ne correspond aux filtres actuels." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400">
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
                      <tr className="rounded-2xl border border-sky-100 bg-sky-50/40 text-sm text-slate-700 shadow-sm shadow-slate-200/40">
                        <td className="rounded-l-2xl px-4 py-4">
                          {formatDate(record.general?.dateIncident)}
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {record.general?.victimeNom || "--"}
                        </td>
                        <td className="px-4 py-4">{record.general?.victimeMatricule || "--"}</td>
                        <td className="px-4 py-4">{record.general?.departement || "--"}</td>
                        <td className="px-4 py-4">{record.lesion?.natureLesion || "--"}</td>
                        <td className="px-4 py-4">{record.lesion?.siegeLesion || "--"}</td>
                        <td className="px-4 py-4">{record.actions?.length || 0}</td>
                        <td className="rounded-r-2xl px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? "" : String(record.id))}
                            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800 transition hover:bg-sky-100"
                          >
                            <UserRoundSearch className="h-4 w-4" />
                            {isExpanded ? "Fermer" : "Voir"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded ? (
                        <tr>
                          <td colSpan={8} className="px-1 pb-2 pt-0">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                              <div className="grid gap-6 lg:grid-cols-3">
                                <div className="rounded-2xl bg-white p-4 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">
                                    Informations generales
                                  </h3>
                                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <p><span className="font-medium text-slate-800">Poste :</span> {record.general?.posteShift || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Lieu :</span> {record.general?.lieuIncident || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Heure :</span> {record.general?.heureIncident || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Cree le :</span> {formatDateTime(record.created_at)}</p>
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-white p-4 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">Lesion</h3>
                                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <p><span className="font-medium text-slate-800">Agent :</span> {record.lesion?.agentMateriel || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Cause :</span> {record.lesion?.causeIdentifiee || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Standard :</span> {record.lesion?.presenceStandard || "--"} / {record.lesion?.respectStandard || "--"}</p>
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-white p-4 shadow-sm">
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

                              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                <div className="rounded-2xl bg-white p-4 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">
                                    Description
                                  </h3>
                                  <p className="mt-3 text-sm leading-6 text-slate-600">
                                    {record.general?.descriptionIncident || "--"}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-white p-4 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">
                                    Analyse des causes
                                  </h3>
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
