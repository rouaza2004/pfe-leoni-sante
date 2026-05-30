import { useEffect, useMemo, useState } from "react";
import { api } from "@/controllers/api/api";
import { Plus, FileDown } from "lucide-react";
import * as XLSX from "xlsx";

const ModalShell = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            X
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto px-6 py-4">{children}</div>
        {footer && <div className="border-t border-slate-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

const emptyRow = {
  date: "",
  heure: "",
  chauffeur: "",
  depart: "",
  destination: "",
  ordre_transport: "",
  plant: "",
  indemnite_deplacement: "",
  cost_center: "",
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
};

const formatTime = (value) => value || "-";

export default function SuiviTransfertsPage() {
  const [rows, setRows] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyRow);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [chauffeurFilter, setChauffeurFilter] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [transfersRes, chauffeursRes] = await Promise.all([
        api.get("/medical/suivi-transferts/"),
        api.get("/medical/bon-chauffeurs/"),
      ]);
      const transfers = Array.isArray(transfersRes.data) ? transfersRes.data : [];
      const listChauffeurs = Array.isArray(chauffeursRes.data)
        ? chauffeursRes.data.map((item) => item.nom_chauffeur).filter(Boolean)
        : [];
      setRows(transfers);
      setChauffeurs(Array.from(new Set(listChauffeurs)).sort());
    } catch (err) {
      setError(err?.response?.data?.detail || "Erreur lors du chargement des transferts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (dateFrom && row.date && row.date < dateFrom) return false;
      if (dateTo && row.date && row.date > dateTo) return false;
      if (chauffeurFilter && row.chauffeur !== chauffeurFilter) return false;
      return true;
    });
  }, [rows, dateFrom, dateTo, chauffeurFilter]);

  const chauffeurSummary = useMemo(() => {
    const counts = {};
    filteredRows.forEach((row) => {
      if (!row.chauffeur) return;
      counts[row.chauffeur] = (counts[row.chauffeur] || 0) + 1;
    });
    const names = Object.keys(counts).sort();
    return { names, counts };
  }, [filteredRows]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.date || !form.heure || !form.chauffeur) {
      setError("Veuillez remplir la date, l'heure et le chauffeur.");
      return;
    }

    try {
      setError("");
      await api.post("/medical/suivi-transferts/", {
        ...form,
        indemnite_deplacement: form.indemnite_deplacement
          ? Number(form.indemnite_deplacement)
          : null,
      });
      setForm(emptyRow);
      setShowModal(false);
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.detail || "Erreur lors de l'enregistrement.");
    }
  };

  const handleExport = () => {
    const header = [
      "Date",
      "Heure",
      "Prénom du Chauffeur",
      "Départ",
      "Destination",
      "Ordre de Transport (N°)",
      "Plant",
      "Indemnité de déplacement (DT)",
      "Cost Center",
    ];

    const dataRows = filteredRows.map((row) => [
      formatDate(row.date),
      formatTime(row.heure),
      row.chauffeur || "",
      row.depart || "",
      row.destination || "",
      row.ordre_transport || "",
      row.plant || "",
      row.indemnite_deplacement || "",
      row.cost_center || "",
    ]);

    const summaryHeader = ["Chauffeur", ...chauffeurSummary.names];
    const summaryValues = [
      "MH",
      ...chauffeurSummary.names.map((name) => chauffeurSummary.counts[name] || 0),
    ];

    const sheet = XLSX.utils.aoa_to_sheet([
      ["Suivi des transferts aux urgences"],
      [],
      header,
      ...dataRows,
      [],
      summaryHeader,
      summaryValues,
    ]);

    sheet["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: header.length - 1 },
      },
    ];
    sheet["!cols"] = header.map(() => ({ wch: 20 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Suivi transferts");
    XLSX.writeFile(workbook, "suivi-transferts-urgences.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Suivi des transferts aux urgences</h1>
            <p className="mt-2 text-sm text-slate-500">
              Historique des transferts et suivi des chauffeurs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={16} />
              Ajouter une ligne
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileDown size={16} />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Date du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Date au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Chauffeur</label>
            <select
              value={chauffeurFilter}
              onChange={(e) => setChauffeurFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              {chauffeurs.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Chargement...</div>
        ) : filteredRows.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">Aucun transfert enregistré.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr className="border-b">
                  <th className="py-2">Date</th>
                  <th className="py-2">Heure</th>
                  <th className="py-2">Prénom du Chauffeur</th>
                  <th className="py-2">Départ</th>
                  <th className="py-2">Destination</th>
                  <th className="py-2">Ordre de Transport</th>
                  <th className="py-2">Plant</th>
                  <th className="py-2">Indemnité (DT)</th>
                  <th className="py-2">Cost Center</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-none">
                    <td className="py-3 text-slate-700">{formatDate(row.date)}</td>
                    <td className="py-3 text-slate-600">{formatTime(row.heure)}</td>
                    <td className="py-3 text-slate-700">{row.chauffeur}</td>
                    <td className="py-3 text-slate-600">{row.depart || "-"}</td>
                    <td className="py-3 text-slate-600">{row.destination || "-"}</td>
                    <td className="py-3 text-slate-600">{row.ordre_transport || "-"}</td>
                    <td className="py-3 text-slate-600">{row.plant || "-"}</td>
                    <td className="py-3 text-slate-600">{row.indemnite_deplacement ?? "-"}</td>
                    <td className="py-3 text-slate-600">{row.cost_center || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Résumé par chauffeur</h3>
        {chauffeurSummary.names.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucune donnée pour le résumé.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-slate-400">
                  <th className="py-2">Chauffeur</th>
                  {chauffeurSummary.names.map((name) => (
                    <th key={name} className="py-2">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 font-semibold text-slate-700">MH</td>
                  {chauffeurSummary.names.map((name) => (
                    <td key={name} className="py-3 text-slate-600">
                      {chauffeurSummary.counts[name] || 0}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalShell
        open={showModal}
        title="Ajouter un transfert"
        onClose={() => setShowModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Enregistrer
            </button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-600">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Heure</label>
            <input
              type="time"
              value={form.heure}
              onChange={(e) => handleChange("heure", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Prénom du Chauffeur</label>
            <select
              value={form.chauffeur}
              onChange={(e) => handleChange("chauffeur", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Sélectionner</option>
              {chauffeurs.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Départ</label>
            <input
              type="text"
              value={form.depart}
              onChange={(e) => handleChange("depart", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Destination</label>
            <input
              type="text"
              value={form.destination}
              onChange={(e) => handleChange("destination", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Ordre de Transport (N°)</label>
            <input
              type="text"
              value={form.ordre_transport}
              onChange={(e) => handleChange("ordre_transport", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Plant</label>
            <input
              type="text"
              value={form.plant}
              onChange={(e) => handleChange("plant", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Indemnité de déplacement (DT)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.indemnite_deplacement}
              onChange={(e) => handleChange("indemnite_deplacement", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Cost Center</label>
            <input
              type="text"
              value={form.cost_center}
              onChange={(e) => handleChange("cost_center", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>
      </ModalShell>
    </div>
  );
}

