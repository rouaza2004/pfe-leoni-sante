import { Fragment, useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Eye, Search, UserRoundSearch } from "lucide-react";
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
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
      {text}
    </div>
  );
}

export default function HSEEReceivedInvestigationsPage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadRecords = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await api.get("/hsee/enquetes-received/");
        if (!cancelled) {
          setRecords(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("Erreur chargement enquetes recues HSEE", error);
        if (!cancelled) {
          setRecords([]);
          setErrorMessage("Impossible de charger les enquetes recues.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (dateFilter && record.date !== dateFilter) {
        return false;
      }

      if (!query) return true;

      return [
        record.collaborateur,
        record.matricule,
        record.type_accident,
        record.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [records, search, dateFilter]);

  const handlePdf = async (record, download = false) => {
    try {
      const suffix = download ? "?download=1" : "";
      const response = await api.get(
        `${record.pdf_url || `/medical/enquetes-initiales/${record.id}/pdf/`}${suffix}`,
        { responseType: "blob" }
      );
      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      if (download) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `enquete-recue-hsee-${record.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      }

      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("Erreur ouverture PDF enquete recue", error);
      setErrorMessage("Impossible d'ouvrir le PDF de l'enquete.");
    }
  };

  return (
    <div className="space-y-3">
      <HSEEPageHeader
        eyebrow="Espace HSEE"
        title="Enquetes recues"
        subtitle="Consultez les enquetes initiales envoyees a HSEE par l'equipe infirmiere."
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <UserRoundSearch className="h-4 w-4 text-slate-600" />
            {records.length} enquete(s) recue(s)
          </div>

          <div className="flex flex-col gap-3 md:w-[560px] md:flex-row">
            <label className="flex h-10 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-slate-300">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par collaborateur, matricule, type..."
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
          <p className="text-sm text-slate-500">Chargement des enquetes recues...</p>
        ) : filteredRecords.length === 0 ? (
          <EmptyState text="Aucune enquete recue ne correspond aux filtres actuels." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Collaborateur</th>
                  <th className="px-4 py-2 font-medium">Matricule</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Statut</th>
                  <th className="px-4 py-2 font-medium">Date d'envoi</th>
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
                        <td className="rounded-l-2xl px-4 py-3">{formatDate(record.date)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{record.collaborateur || "--"}</td>
                        <td className="px-4 py-3">{record.matricule || "--"}</td>
                        <td className="px-4 py-3">{record.type_accident || "--"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            {record.status || "Envoye HSEE"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatDateTime(record.sent_to_hsee_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handlePdf(record)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              <Eye className="h-4 w-4" />
                              Voir
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePdf(record, true)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              <Download className="h-4 w-4" />
                              Telecharger PDF
                            </button>
                          </div>
                        </td>
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
                              <div className="grid gap-4 lg:grid-cols-2">
                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">Informations generales</h3>
                                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <p><span className="font-medium text-slate-800">Lieu :</span> {record.detail?.lieu_accident || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Heure :</span> {record.detail?.heure_accident || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Appartenance :</span> {record.detail?.victime_appartenance || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Horaire :</span> {record.detail?.victime_horaire_travail || "--"}</p>
                                  </div>
                                </div>

                                <div className="rounded-2xl bg-white p-3 shadow-sm">
                                  <h3 className="text-sm font-semibold text-slate-900">Details accident</h3>
                                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <p><span className="font-medium text-slate-800">Siege / lesion :</span> {record.detail?.siege_type_lesion || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Transport victime :</span> {record.detail?.lieu_transport_victime || "--"}</p>
                                    <p><span className="font-medium text-slate-800">Circonstances :</span> {record.detail?.circonstances_accident || "--"}</p>
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
