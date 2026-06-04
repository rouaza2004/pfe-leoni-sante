import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileText, Filter, Search } from "lucide-react";

import { api } from "@/api/api";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function EmptyState({ loading }) {
  return (
    <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-5 text-sm text-slate-600">
      {loading ? "Chargement des certificats..." : "Aucun certificat médecin contrôleur disponible."}
    </div>
  );
}

async function openPdf(certificate, mode) {
  if (!certificate?.download_url) return;
  const response = await api.get(certificate.download_url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));

  if (mode === "download") {
    const link = window.document.createElement("a");
    link.href = blobUrl;
    link.download = `certificat-controleur-${certificate.record_id || certificate.id}.pdf`;
    link.click();
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    return;
  }

  window.open(blobUrl, "_blank", "noopener,noreferrer");
}

export default function CertificatsMedecinControleurRH() {
  const [certificates, setCertificates] = useState([]);
  const [filters, setFilters] = useState({ search: "", matricule: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadCertificates = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/rh/certificats-controleur/");
        if (!cancelled) setCertificates(Array.isArray(response.data?.results) ? response.data.results : []);
      } catch (err) {
        console.error("Erreur chargement certificats controleur RH", err);
        if (!cancelled) setError("Impossible de charger les certificats du médecin contrôleur.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCertificates();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCertificates = useMemo(() => {
    const search = normalize(filters.search);
    const matricule = normalize(filters.matricule);
    return certificates.filter((item) => {
      if (search && !normalize(item.collaborateur_nom).includes(search)) return false;
      if (matricule && !normalize(item.matricule).includes(matricule)) return false;
      if (filters.date && String(item.date_generation || "").slice(0, 10) !== filters.date) return false;
      return true;
    });
  }, [certificates, filters]);

  const handlePdf = async (certificate, mode) => {
    try {
      setBusyId(`${certificate.id}-${mode}`);
      await openPdf(certificate, mode);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 ring-1 ring-sky-100/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-500 ring-1 ring-slate-200">
              <FileText size={14} className="text-slate-700" />
              Certificats RH
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">LEONI</p>
              <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">
                Certificats Médecin Contrôleur
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-600">
                Consultation des certificats élaborés par le médecin contrôleur.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">Certificats affichés</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{filteredCertificates.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Filter size={16} />
          Filtres
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Collaborateur
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <Search size={15} className="text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
                placeholder="Nom ou prénom"
              />
            </div>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Matricule
            <input
              value={filters.matricule}
              onChange={(event) => setFilters((current) => ({ ...current, matricule: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
              placeholder="Matricule"
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Date
            <input
              type="date"
              value={filters.date}
              onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300"
            />
          </label>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FileText size={16} />
          Liste des certificats
        </div>
        {filteredCertificates.length === 0 ? (
          <EmptyState loading={loading} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-3 py-3">Collaborateur</th>
                  <th className="px-3 py-3">Matricule</th>
                  <th className="px-3 py-3">Type certificat</th>
                  <th className="px-3 py-3">Date génération</th>
                  <th className="px-3 py-3">Médecin contrôleur</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map((certificate) => (
                  <tr key={certificate.id} className="border-b border-slate-100 text-sm text-slate-700">
                    <td className="px-3 py-3 font-medium text-slate-900">{certificate.collaborateur_nom || "--"}</td>
                    <td className="px-3 py-3">{certificate.matricule || "N/A"}</td>
                    <td className="px-3 py-3">{certificate.type_certificat || certificate.type_document || "--"}</td>
                    <td className="px-3 py-3">{formatDate(certificate.date_generation)}</td>
                    <td className="px-3 py-3">{certificate.medecin_controleur || "--"}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handlePdf(certificate, "view")}
                          disabled={busyId === `${certificate.id}-view`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          <Eye size={14} />
                          Consulter
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePdf(certificate, "download")}
                          disabled={busyId === `${certificate.id}-download`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          <Download size={14} />
                          Télécharger
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
